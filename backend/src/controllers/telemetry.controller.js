import ClickEvent from '../models/ClickEvent.model.js';
import User from '../models/User.model.js';

/**
 * Extract clean client IP address supporting Cloudflare, proxies, and load balancers
 */
export const getClientIp = (req) => {
  // 1. Cloudflare / CDN headers
  if (req.headers['cf-connecting-ip']) return req.headers['cf-connecting-ip'];
  if (req.headers['true-client-ip']) return req.headers['true-client-ip'];
  if (req.headers['x-client-ip']) return req.headers['x-client-ip'];
  if (req.headers['x-real-ip']) return req.headers['x-real-ip'];

  // 2. Standard X-Forwarded-For proxy chain (first client IP)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip.replace(/^::ffff:/, '');
  }

  // 3. Direct socket address
  let ip = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';

  // Clean IPv6-mapped IPv4
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === '::1') {
    ip = '127.0.0.1 (Localhost)';
  }

  return ip;
};

/**
 * Lightweight User Agent parser
 */
export const parseUserAgent = (ua = '') => {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

  if (/chrome|crios/i.test(ua) && !/edg|opr/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { browser, os, device };
};

/**
 * Ingest batched telemetry events from frontend
 * POST /api/telemetry/events
 */
export const trackBatchEvents = async (req, res) => {
  try {
    const rawEvents = req.body?.events || (Array.isArray(req.body) ? req.body : [req.body]);
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const ip = getClientIp(req);
    const uaString = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(uaString);

    const docs = rawEvents.map((evt) => {
      // Determine effective IP (fallback to client-detected public IP if localhost)
      let effectiveIp = ip;
      if ((ip.includes('127.0.0.1') || ip === '::1') && evt.clientPublicIp) {
        effectiveIp = evt.clientPublicIp;
      }

      return {
        user: evt.userId || req.user?._id || undefined,
        userEmail: evt.userEmail || req.user?.email || 'anonymous',
        userName: evt.userName || req.user?.name || 'Guest',
        sessionId: evt.sessionId || 'unknown_session',
        eventType: evt.eventType || 'click',
        element: {
          tag: evt.element?.tag || '',
          id: evt.element?.id || '',
          className: evt.element?.className || '',
          text: (evt.element?.text || '').slice(0, 200),
          role: evt.element?.role || '',
          ariaLabel: evt.element?.ariaLabel || '',
          targetHref: evt.element?.targetHref || '',
        },
        page: {
          pathname: evt.page?.pathname || '/',
          search: evt.page?.search || '',
          title: evt.page?.title || '',
          referrer: evt.page?.referrer || '',
        },
        coordinates: evt.coordinates || {},
        ip: effectiveIp,
        userAgent: uaString.slice(0, 300),
        device: evt.device || device,
        browser: evt.browser || browser,
        os: evt.os || os,
        metadata: evt.metadata || {},
        timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date(),
      };
    });

    // Non-blocking bulk insert into Cosmos DB
    ClickEvent.insertMany(docs, { ordered: false }).catch((err) => {
      console.error('[Telemetry] Ingestion insertMany error:', err.message);
    });

    return res.status(200).json({ success: true, count: docs.length });
  } catch (err) {
    console.error('[Telemetry] Controller error:', err);
    return res.status(200).json({ success: false, message: 'Telemetry received with fallback' });
  }
};

/**
 * Admin: Get live clickstream feed with filters and pagination
 * GET /api/admin/telemetry/clickstream
 */
export const getLiveClickstream = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 40));
    const search = req.query.search?.trim();
    const eventType = req.query.eventType?.trim();
    const userEmail = req.query.userEmail?.trim();

    const query = {};

    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    if (userEmail) {
      query.userEmail = { $regex: userEmail, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { 'element.text': { $regex: search, $options: 'i' } },
        { 'page.pathname': { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
      ];
    }

    const [events, total] = await Promise.all([
      ClickEvent.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ClickEvent.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Telemetry] getLiveClickstream error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch clickstream' });
  }
};

/**
 * Admin: Get complete user journey timeline for a specific user
 * GET /api/admin/telemetry/user-journey/:email
 */
export const getUserJourney = async (req, res) => {
  try {
    const { email } = req.params;
    const limit = Math.min(200, parseInt(req.query.limit) || 100);

    const timeline = await ClickEvent.find({ userEmail: email })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const stats = await ClickEvent.aggregate([
      { $match: { userEmail: email } },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]);

    const distinctIps = await ClickEvent.distinct('ip', { userEmail: email });

    return res.status(200).json({
      success: true,
      data: {
        email,
        timeline,
        distinctIps,
        stats,
      },
    });
  } catch (err) {
    console.error('[Telemetry] getUserJourney error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user journey' });
  }
};

/**
 * Admin: Get aggregated IP activity and top active users per IP
 * GET /api/admin/telemetry/ip-stats
 */
export const getIpStats = async (req, res) => {
  try {
    const ipAgg = await ClickEvent.aggregate([
      {
        $group: {
          _id: '$ip',
          totalClicks: { $sum: 1 },
          users: { $addToSet: '$userEmail' },
          lastActive: { $max: '$timestamp' },
          browsers: { $addToSet: '$browser' },
          devices: { $addToSet: '$device' },
        },
      },
      { $sort: { totalClicks: -1 } },
      { $limit: 50 },
    ]);

    return res.status(200).json({
      success: true,
      data: ipAgg.map((item) => ({
        ip: item._id || 'Unknown',
        totalClicks: item.totalClicks,
        uniqueUsersCount: item.users.filter((u) => u !== 'anonymous').length,
        users: item.users.slice(0, 5),
        lastActive: item.lastActive,
        browsers: item.browsers,
        devices: item.devices,
      })),
    });
  } catch (err) {
    console.error('[Telemetry] getIpStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch IP analytics' });
  }
};

/**
 * Admin: Get top clicked elements and pages
 * GET /api/admin/telemetry/top-clicks
 */
export const getTopClicks = async (req, res) => {
  try {
    const [topElements, topPages, deviceBreakdown] = await Promise.all([
      ClickEvent.aggregate([
        { $match: { eventType: 'click', 'element.text': { $nin: ['', null] } } },
        {
          $group: {
            _id: { text: '$element.text', pathname: '$page.pathname' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      ClickEvent.aggregate([
        {
          $group: {
            _id: '$page.pathname',
            visits: { $sum: 1 },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 15 },
      ]),
      ClickEvent.aggregate([
        {
          $group: {
            _id: '$device',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        topElements: topElements.map((e) => ({
          text: e._id.text,
          page: e._id.pathname,
          clicks: e.count,
        })),
        topPages: topPages.map((p) => ({
          pathname: p._id,
          count: p.visits,
        })),
        deviceBreakdown: deviceBreakdown.map((d) => ({
          device: d._id || 'Desktop',
          count: d.count,
        })),
      },
    });
  } catch (err) {
    console.error('[Telemetry] getTopClicks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch top clicks' });
  }
};
