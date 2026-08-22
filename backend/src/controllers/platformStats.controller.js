const LEETCODE_API_URL = process.env.LEETCODE_API_URL || 'http://localhost:3000';

// Helper to calculate streak and total active days from LeetCode submissionCalendar JSON
function calculateLeetCodeStreak(calendarJson) {
  if (!calendarJson) return { streak: 0, totalActiveDays: 0, submissionCalendar: {} };
  let calendar = {};
  try {
    calendar = typeof calendarJson === 'string' ? JSON.parse(calendarJson) : calendarJson;
  } catch {
    return { streak: 0, totalActiveDays: 0, submissionCalendar: {} };
  }

  const timestamps = Object.keys(calendar)
    .map(Number)
    .filter((t) => !isNaN(t) && calendar[t] > 0)
    .sort((a, b) => b - a);

  if (timestamps.length === 0) {
    return { streak: 0, totalActiveDays: 0, submissionCalendar: calendar };
  }

  const dateSet = new Set(
    timestamps.map((t) => new Date(t * 1000).toISOString().split('T')[0])
  );

  let currentStreak = 0;
  const now = new Date();
  let checkDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const todayStr = checkDate.toISOString().split('T')[0];
  const yesterday = new Date(checkDate.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (!dateSet.has(todayStr)) {
    if (dateSet.has(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      return { streak: 0, totalActiveDays: dateSet.size, submissionCalendar: calendar };
    }
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dStr)) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return {
    streak: currentStreak,
    totalActiveDays: dateSet.size,
    submissionCalendar: calendar,
  };
}

// Direct official LeetCode GraphQL Scraper
async function fetchLeetCodeDirectGraphQL(username) {
  const query = `
    query getUserProfile($username: String!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
          reputation
          starRating
          userAvatar
        }
        submissionCalendar
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
      }
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        contest {
          title
          startTime
        }
      }
    }
  `;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL responded with status ${res.status}`);
  }

  const json = await res.json();
  if (json.errors || !json.data?.matchedUser) {
    throw new Error('User not found on LeetCode');
  }

  const data = json.data;
  const user = data.matchedUser;
  const submitStats = user.submitStats?.acSubmissionNum || [];
  const allCounts = data.allQuestionsCount || [];

  const getCount = (arr, diff) =>
    arr.find((x) => x.difficulty.toLowerCase() === diff.toLowerCase())?.count || 0;

  const totalSolved = getCount(submitStats, 'all');
  const easySolved = getCount(submitStats, 'easy');
  const mediumSolved = getCount(submitStats, 'medium');
  const hardSolved = getCount(submitStats, 'hard');

  const totalQuestions = getCount(allCounts, 'all');
  const totalEasy = getCount(allCounts, 'easy');
  const totalMedium = getCount(allCounts, 'medium');
  const totalHard = getCount(allCounts, 'hard');

  const calendarStats = calculateLeetCodeStreak(user.submissionCalendar);

  const contestRanking = data.userContestRanking;
  const contestHistory = data.userContestRankingHistory || [];

  const attendedHistory = contestHistory.filter((c) => c.attended);
  const ratingHistory = attendedHistory.slice(-15).map((c, idx, arr) => {
    const prevRating = idx > 0 ? arr[idx - 1].rating : c.rating;
    return {
      contestName: c.contest?.title || 'Contest',
      rank: c.ranking,
      oldRating: Math.round(prevRating),
      newRating: Math.round(c.rating),
    };
  });

  return {
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    totalEasy: totalEasy || 850,
    totalMedium: totalMedium || 1800,
    totalHard: totalHard || 800,
    ranking: user.profile?.ranking || null,
    reputation: user.profile?.reputation || 0,
    contributionPoints: user.profile?.reputation || 0,
    avatar: user.profile?.userAvatar || null,
    streak: calendarStats.streak,
    totalActiveDays: calendarStats.totalActiveDays,
    submissionCalendar: calendarStats.submissionCalendar,
    contestsParticipated: contestRanking?.attendedContestsCount || attendedHistory.length,
    contestRating: contestRanking ? Math.round(contestRanking.rating) : null,
    globalContestRanking: contestRanking?.globalRanking || null,
    ratingHistory,
  };
}

// Fetch LeetCode stats with direct GraphQL + fallback proxies
export const getLeetCodeStats = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  // 1. Primary: Direct official LeetCode GraphQL API
  try {
    const stats = await fetchLeetCodeDirectGraphQL(username);
    return res.json({
      success: true,
      platform: 'leetcode',
      username,
      data: stats,
    });
  } catch (directErr) {
    console.warn(`[LeetCode] Direct GraphQL fetch failed for ${username}:`, directErr.message);
  }

  // 2. Fallback: Proxy / self-hosted alfa-leetcode-api
  const fallbackUrls = [
    LEETCODE_API_URL,
    'https://alfa-leetcode-api.onrender.com',
  ].filter(Boolean);

  for (const baseUrl of fallbackUrls) {
    try {
      const solvedResponse = await fetch(`${baseUrl}/${username}/solved`);
      if (!solvedResponse.ok) continue;

      const solvedData = await solvedResponse.json();

      const profileResponse = await fetch(`${baseUrl}/${username}`);
      const profileData = profileResponse.ok ? await profileResponse.json() : {};

      const calendarResponse = await fetch(`${baseUrl}/${username}/calendar`);
      const calendarData = calendarResponse.ok ? await calendarResponse.json() : {};

      const contestResponse = await fetch(`${baseUrl}/${username}/contest`);
      const contestData = contestResponse.ok ? await contestResponse.json() : {};

      let contestsParticipated = 0;
      let ratingHistory = [];

      if (contestData?.contestParticipation) {
        contestsParticipated = contestData.contestParticipation.length;
        ratingHistory = contestData.contestParticipation.slice(-15).map((c) => ({
          contestName: c.contest.title,
          rank: c.ranking,
          oldRating: Math.round(c.rating - (c.trendDirection === 'UP' ? 1 : -1)),
          newRating: Math.round(c.rating),
        }));
      }

      return res.json({
        success: true,
        platform: 'leetcode',
        username,
        data: {
          totalSolved: solvedData.solvedProblem || 0,
          easySolved: solvedData.easySolved || 0,
          mediumSolved: solvedData.mediumSolved || 0,
          hardSolved: solvedData.hardSolved || 0,
          totalEasy: solvedData.totalEasy || 850,
          totalMedium: solvedData.totalMedium || 1800,
          totalHard: solvedData.totalHard || 800,
          ranking: profileData.ranking || null,
          reputation: profileData.reputation || 0,
          contributionPoints: profileData.contributionPoints || 0,
          avatar: profileData.avatar || null,
          streak: calendarData.streak || 0,
          totalActiveDays: calendarData.totalActiveDays || 0,
          submissionCalendar: calendarData.submissionCalendar || {},
          contestsParticipated,
          ratingHistory,
        },
      });
    } catch (fallbackErr) {
      console.warn(`[LeetCode] Fallback ${baseUrl} failed for ${username}:`, fallbackErr.message);
    }
  }

  res.status(500).json({
    success: false,
    platform: 'leetcode',
    username,
    error: 'Failed to fetch LeetCode stats. Please check if the username is correct.',
  });
};

// Fetch Codeforces stats using official API
export const getCodeforcesStats = async (req, res) => {
  const { handle } = req.params;

  if (!handle) {
    return res.status(400).json({ message: 'Handle is required' });
  }

  try {
    // Fetch user info
    const userResponse = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Codeforces data');
    }

    const userData = await userResponse.json();

    if (userData.status !== 'OK') {
      throw new Error(userData.comment || 'Invalid handle');
    }

    const user = userData.result[0];

    // Fetch rating history
    const ratingResponse = await fetch(
      `https://codeforces.com/api/user.rating?handle=${handle}`
    );

    let ratingHistory = [];
    if (ratingResponse.ok) {
      const ratingData = await ratingResponse.json();
      if (ratingData.status === 'OK') {
        ratingHistory = ratingData.result.slice(-10); // Last 10 contests
      }
    }

    // Fetch user submissions to count problems solved
    const submissionsResponse = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`
    );

    let problemsSolved = 0;
    let uniqueProblems = new Set();
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      if (submissionsData.status === 'OK') {
        submissionsData.result.forEach((submission) => {
          if (submission.verdict === 'OK') {
            const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
            uniqueProblems.add(problemId);
          }
        });
        problemsSolved = uniqueProblems.size;
      }
    }

    res.json({
      success: true,
      platform: 'codeforces',
      handle,
      data: {
        rating: user.rating || 0,
        maxRating: user.maxRating || 0,
        rank: user.rank || 'unrated',
        maxRank: user.maxRank || 'unrated',
        contribution: user.contribution || 0,
        friendOfCount: user.friendOfCount || 0,
        avatar: user.titlePhoto || null,
        problemsSolved,
        contestsParticipated: ratingHistory.length,
        ratingHistory: ratingHistory.map((r) => ({
          contestName: r.contestName,
          rank: r.rank,
          oldRating: r.oldRating,
          newRating: r.newRating,
          ratingChange: r.newRating - r.oldRating,
        })),
      },
    });
  } catch (error) {
    console.error('Codeforces API Error:', error.message);
    res.status(500).json({
      success: false,
      platform: 'codeforces',
      handle,
      error: 'Failed to fetch Codeforces stats. Please check if the handle is correct.',
    });
  }
};

// Fetch CodeChef stats (using native high-performance HTML parser)
export const getCodeChefStats = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const profileUrl = `https://www.codechef.com/users/${username}`;
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    // Handle profile redirect (e.g. non-existent or renamed handles redirect to home page)
    if (!response.ok || response.redirected || response.url === 'https://www.codechef.com/' || response.url.includes('/?')) {
      return res.status(404).json({
        success: false,
        platform: 'codechef',
        username,
        error: `CodeChef profile '${username}' not found. Please check your exact username on codechef.com.`,
      });
    }

    const html = await response.text();

    // Double check if page was redirected to CodeChef homepage
    if (html.includes('Join 5M+ students') && !html.includes('rating-header') && !html.includes('date_versus_rating')) {
      return res.status(404).json({
        success: false,
        platform: 'codechef',
        username,
        error: `CodeChef profile '${username}' not found. Please check your exact handle.`,
      });
    }

    // 1. Current Rating
    const ratingMatch = html.match(/class="rating-number">([^<]+)</i) || html.match(/"rating":\s*(\d+)/i);
    let rating = ratingMatch ? parseInt(ratingMatch[1].trim()) || 0 : 0;

    // 2. Contest Rating History (var date_versus_rating = [...])
    const ratingHistoryMatch = html.match(/date_versus_rating\s*=\s*(\[[^;]+\])/i) || html.match(/var\s+all_rating\s*=\s*(\[[^;]+\])/i);
    let ratingHistory = [];
    let contestsParticipated = 0;
    let maxRating = 0;

    if (ratingHistoryMatch) {
      try {
        const rawHistory = JSON.parse(ratingHistoryMatch[1]);
        contestsParticipated = rawHistory.length;

        // Extract max rating across all contests
        const ratings = rawHistory.map((c) => parseInt(c.rating) || 0).filter((r) => r > 0);
        if (ratings.length > 0) {
          maxRating = Math.max(...ratings);
          // If current profile rating is 0 or unrated, set current rating to latest contest rating
          if (rating === 0 && rawHistory.length > 0) {
            rating = parseInt(rawHistory[rawHistory.length - 1].rating) || 0;
          }
        }

        // Map rating history for chart
        ratingHistory = rawHistory.slice(-20).map((c) => ({
          contestName: c.name || c.code,
          rank: parseInt(c.rank) || 0,
          newRating: parseInt(c.rating) || 0,
          date: c.end_date ? c.end_date.split(' ')[0] : `${c.getyear}-${c.getmonth}-${c.getday}`,
          penalised: !!c.penalised_in || !!c.reason,
        }));

        // Map submission/contest calendar for heatmap
        const submissionCalendar = {};
        rawHistory.forEach((c) => {
          const dateStr = c.end_date ? c.end_date.split(' ')[0] : `${c.getyear}-${c.getmonth}-${c.getday}`;
          const ts = Math.floor(new Date(dateStr).getTime() / 1000);
          if (ts > 0) {
            submissionCalendar[ts] = (submissionCalendar[ts] || 0) + 1;
          }
        });
        res.locals_calendar = submissionCalendar;
      } catch (e) {
        console.error('CodeChef Rating History JSON parse error:', e.message);
      }
    }

    // Fallback Highest Rating from HTML if history was empty
    if (!maxRating) {
      const maxRatingMatch = html.match(/\(highest rating\s*(\d+)\)/i) || html.match(/\(max rating\s*(\d+)\)/i);
      maxRating = maxRatingMatch ? parseInt(maxRatingMatch[1]) : rating;
    }

    // 3. Stars Badge
    const starsMatch = html.match(/class="rating-star">([^<]+)</i) || html.match(/(\d+★)/i);
    let stars = starsMatch ? starsMatch[1].replace(/[^0-9★]/g, '').trim() : '';
    const effectiveRating = Math.max(rating, maxRating);
    if (!stars && effectiveRating > 0) {
      stars = effectiveRating >= 2500 ? '7★' : effectiveRating >= 2200 ? '6★' : effectiveRating >= 2000 ? '5★' : effectiveRating >= 1800 ? '4★' : effectiveRating >= 1600 ? '3★' : effectiveRating >= 1400 ? '2★' : '1★';
    }

    // 4. Global & Country Ranks
    const globalRankMatch = html.match(/class='global-rank'[^>]*>(\d+)<\/strong>/i) || html.match(/Global Rank:[^\d]*(\d+)/i);
    const globalRank = globalRankMatch ? parseInt(globalRankMatch[1]) : null;

    const countryRankMatch = html.match(/class='country-rank'[^>]*>(\d+)<\/strong>/i) || html.match(/Country Rank:[^\d]*(\d+)/i);
    const countryRank = countryRankMatch ? parseInt(countryRankMatch[1]) : null;

    // 5. Total Problems Solved
    const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) || html.match(/Total Problems Solved[^\d]*(\d+)/i);
    const totalSolved = solvedMatch ? parseInt(solvedMatch[1]) : 0;

    res.json({
      success: true,
      platform: 'codechef',
      username,
      data: {
        username,
        rating,
        maxRating,
        stars: stars || '1★',
        globalRank,
        countryRank,
        totalSolved,
        contestsParticipated,
        ratingHistory,
        submissionCalendar: res.locals_calendar || {},
        profileUrl,
      },
    });
  } catch (error) {
    console.error('CodeChef Scraper Error:', error.message);
    res.status(500).json({
      success: false,
      platform: 'codechef',
      username,
      error: 'Failed to fetch CodeChef stats.',
    });
  }
};

// Get all platform stats for a user
export const getAllPlatformStats = async (req, res) => {
  const { leetcode, codeforces, codechef } = req.query;

  const results = {
    leetcode: null,
    codeforces: null,
    codechef: null,
  };

  const fetchPromises = [];

  if (leetcode) {
    fetchPromises.push(
      fetch(`${LEETCODE_API_URL}/${leetcode}/solved`)
        .then((r) => r.json())
        .then((data) => {
          results.leetcode = {
            success: true,
            username: leetcode,
            totalSolved: data.solvedProblem || 0,
            easySolved: data.easySolved || 0,
            mediumSolved: data.mediumSolved || 0,
            hardSolved: data.hardSolved || 0,
          };
        })
        .catch(() => {
          results.leetcode = { success: false, username: leetcode, error: 'Failed to fetch' };
        })
    );
  }

  if (codeforces) {
    fetchPromises.push(
      fetch(`https://codeforces.com/api/user.info?handles=${codeforces}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'OK') {
            const user = data.result[0];
            results.codeforces = {
              success: true,
              handle: codeforces,
              rating: user.rating || 0,
              maxRating: user.maxRating || 0,
              rank: user.rank || 'unrated',
            };
          } else {
            results.codeforces = { success: false, handle: codeforces, error: 'Invalid handle' };
          }
        })
        .catch(() => {
          results.codeforces = { success: false, handle: codeforces, error: 'Failed to fetch' };
        })
    );
  }

  if (codechef) {
    results.codechef = {
      success: true,
      username: codechef,
      profileUrl: `https://www.codechef.com/users/${codechef}`,
    };
  }

  await Promise.all(fetchPromises);

  res.json({
    success: true,
    data: results,
  });
};
