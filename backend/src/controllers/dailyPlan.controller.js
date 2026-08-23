import { GoogleGenAI } from '@google/genai';
import DailyPlan from '../models/DailyPlan.model.js';
import Sheet from '../models/Sheet.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import crypto from 'crypto';

/**
 * Robust Substring & Regex Matcher for User's Active Sheets and Topics
 */
function findMatchingSheetForText(sheets = [], text = '') {
  if (!text || !Array.isArray(sheets) || sheets.length === 0) return null;
  const clean = text.toLowerCase();

  // Keyword extraction (words of length >= 3)
  const keywords = clean.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);

  // 1. Direct match on sheet name
  for (const s of sheets) {
    const sName = (s.name || '').toLowerCase();
    for (const kw of keywords) {
      if (sName.includes(kw) || kw.includes(sName)) {
        return {
          sheetId: s._id,
          sheetName: s.name,
        };
      }
    }
  }

  // 2. Match on topics within sheets
  for (const s of sheets) {
    if (Array.isArray(s.topics)) {
      for (const t of s.topics) {
        const tName = (t.name || '').toLowerCase();
        for (const kw of keywords) {
          if (tName.includes(kw) || kw.includes(tName)) {
            return {
              sheetId: s._id,
              sheetName: s.name,
              topicName: t.name,
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Fuzzy match subject name with user's available sheets and topics
 */
async function matchSubjectToSheets(userId, subjectName) {
  try {
    const sheets = await Sheet.find({ user: userId, isActive: true }).select('name category topics _id');
    return findMatchingSheetForText(sheets, subjectName);
  } catch (err) {
    console.warn('Sheet matching error:', err.message);
    return null;
  }
}

/**
 * Fallback heuristic plan generator if Gemini API key is missing or network fails
 */
function generateHeuristicPlanOptions(inputs, matchedSheets, userSheets = []) {
  const { mode = 'grind', totalHours = 4, subjects = [], meals = 1, breaks = 2, powerNap = false, beverage = 'chai' } = inputs;
  const beverageBreaksCount = Math.max(1, Math.ceil(totalHours / 6));

  const beverageEmoji = beverage === 'coffee' ? '☕' : beverage === 'chai' ? '🍵' : beverage === 'water' ? '💧' : '🧃';
  const beverageTitle = beverage === 'coffee' ? 'Coffee Break' : beverage === 'chai' ? 'Chai & Refreshment' : 'Hydration Break';

  const modePrefix = mode === 'chill' ? 'Chill Pace' : mode === 'allin' ? 'All-In Deep Work' : 'Grind Session';

  const createPlan = (variant) => {
    const tasks = [];
    let currentOffsetMinutes = 0;
    const startTime = new Date();
    const mins = startTime.getMinutes();
    const roundedMins = Math.ceil(mins / 15) * 15;
    startTime.setMinutes(roundedMins, 0, 0);

    const formatSlot = (startOffset, duration) => {
      const s = new Date(startTime.getTime() + startOffset * 60000);
      const e = new Date(startTime.getTime() + (startOffset + duration) * 60000);
      const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${fmt(s)} - ${fmt(e)}`;
    };

    // Warmup task
    const warmupDur = mode === 'allin' ? 10 : 15;
    tasks.push({
      id: crypto.randomUUID(),
      time: formatSlot(currentOffsetMinutes, warmupDur),
      duration: warmupDur,
      title: variant === 1 ? 'Desk Setup & Goal Mental Run' : 'Quick Warm-up & Priority Review',
      category: 'warmup',
      icon: '🎯',
      completed: false,
    });
    currentOffsetMinutes += warmupDur;

    // Subjects allocation
    const userSubs = subjects.length > 0 ? subjects : [{ name: 'DSA & Core Topics', type: 'revision' }];
    const targetStudyTimeTotal = totalHours * 60 - (meals * 35 + breaks * 10 + (powerNap ? 25 : 0) + beverageBreaksCount * 15 + 20);
    const subDuration = Math.max(30, Math.floor(targetStudyTimeTotal / userSubs.length));

    userSubs.forEach((sub, idx) => {
      const match = matchedSheets[idx] || findMatchingSheetForText(userSheets, sub.name);
      tasks.push({
        id: crypto.randomUUID(),
        time: formatSlot(currentOffsetMinutes, subDuration),
        duration: subDuration,
        title: `${sub.name} (${sub.type || 'revision'})`,
        category: 'study',
        icon: sub.type === 'revision' ? '🔄' : sub.type === 'new' ? '📖' : '⚡',
        completed: false,
        linkedSheetId: match?.sheetId || undefined,
        linkedSheetName: match?.sheetName || undefined,
        monitorTopic: match?.topicName || undefined,
      });
      currentOffsetMinutes += subDuration;

      // Add beverage break after first heavy block
      if (idx === 0 && beverage !== 'none') {
        tasks.push({
          id: crypto.randomUUID(),
          time: formatSlot(currentOffsetMinutes, 15),
          duration: 15,
          title: beverageTitle,
          category: 'beverage',
          icon: beverageEmoji,
          completed: false,
        });
        currentOffsetMinutes += 15;
      } else if (idx < userSubs.length - 1) {
        tasks.push({
          id: crypto.randomUUID(),
          time: formatSlot(currentOffsetMinutes, 10),
          duration: 10,
          title: variant === 1 ? 'Quick Stretch & Water' : 'Eye Rest & Walk',
          category: 'break',
          icon: '🧘',
          completed: false,
        });
        currentOffsetMinutes += 10;
      }
    });

    if (powerNap) {
      tasks.push({
        id: crypto.randomUUID(),
        time: formatSlot(currentOffsetMinutes, 20),
        duration: 20,
        title: 'Recharging Power Nap',
        category: 'nap',
        icon: '💤',
        completed: false,
      });
      currentOffsetMinutes += 20;
    }

    if (meals > 0) {
      tasks.push({
        id: crypto.randomUUID(),
        time: formatSlot(currentOffsetMinutes, 35),
        duration: 35,
        title: 'Nutritious Meal & Reset',
        category: 'meal',
        icon: '🍲',
        completed: false,
      });
      currentOffsetMinutes += 35;
    }

    // Cooldown
    tasks.push({
      id: crypto.randomUUID(),
      time: formatSlot(currentOffsetMinutes, 10),
      duration: 10,
      title: 'Session Wrap-up & Notes Log',
      category: 'cooldown',
      icon: '✅',
      completed: false,
    });

    return {
      title: `${modePrefix} — Option ${variant === 1 ? 'A (Deep Focus Blocks)' : 'B (Agile Pomodoro Spreads)'}`,
      tasks,
    };
  };

  return {
    planA: createPlan(1),
    planB: createPlan(2),
  };
}

// @desc    Generate 2 AI Daily Plans based on user prompt & mode
// @route   POST /api/daily-plan/generate
// @access  Private
export const generateDailyPlan = async (req, res) => {
  try {
    const {
      mode = 'grind',
      totalHours = 4,
      subjects = [],
      meals = 1,
      breaks = 2,
      powerNap = false,
      beverage = 'chai',
    } = req.body;

    const userSheets = await Sheet.find({ user: req.user._id, isActive: true }).select('name category topics _id');

    // 1. Resolve sheet matches for each subject in parallel
    const matchedSheets = subjects.map((sub) => findMatchingSheetForText(userSheets, sub.name));

    const beverageBreaksCount = Math.max(1, Math.ceil(totalHours / 6));

    // 2. Prepare Gemini Prompt
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const subjectsDescription = subjects
          .map(
            (s, i) =>
              `- ${s.name} (${s.type || 'revision'})${
                matchedSheets[i] ? ` [Linked to user sheet: "${matchedSheets[i].sheetName}"]` : ''
              }`
          )
          .join('\n');

        const prompt = `You are an elite productivity and DSA study mentor for TrackAsap.
Generate TWO distinct, high-impact study session plans tailored to these user parameters:

- Mode: "${mode}" (chill: relaxed & balanced; grind: high focus & structured; allin: aggressive deep-work & fast cycles)
- Total Time Available: ${totalHours} hours
- Subjects / Study Goals:
${subjectsDescription || '- General DSA problem solving & revision'}
- Meals to schedule: ${meals}
- Break preference: ${breaks} breaks
- Power Nap: ${powerNap ? 'Yes (include a 20m power nap)' : 'No'}
- Beverage choice: ${beverage} (Schedule exactly ${beverageBreaksCount} beverage break(s) of 15 min each, labeled appropriately)

REQUIREMENTS:
1. Provide TWO contrasting schedules:
   - Plan A: Deep Work blocks (longer focused intervals)
   - Plan B: Balanced Pomodoro flow (shorter alternating sprints)
2. Every task item MUST include:
   - "id": a unique string
   - "time": realistic time slot string (e.g., "10:00 AM - 11:15 AM")
   - "duration": integer in minutes
   - "title": clear action-oriented task name
   - "category": one of ["study", "break", "meal", "nap", "beverage", "warmup", "cooldown"]
   - "icon": appropriate single emoji
   - "subjectIndex": integer (index 0, 1, ... of the input subject if this is a study task, else null)
3. Total duration of tasks in each plan must equal approximately ${totalHours * 60} minutes.

Return ONLY valid JSON matching this schema:
{
  "planA": {
    "title": "String (engaging title)",
    "tasks": [
      {
        "id": "task-1",
        "time": "10:00 AM - 10:15 AM",
        "duration": 15,
        "title": "Task title",
        "category": "warmup",
        "icon": "🎯",
        "subjectIndex": null
      }
    ]
  },
  "planB": {
    "title": "String (engaging title)",
    "tasks": [ ... ]
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);

          const attachSheetsToTasks = (tasks = []) =>
            tasks.map((t, idx) => {
              // Match by subjectIndex or by keyword search in task title
              const matched =
                typeof t.subjectIndex === 'number' && matchedSheets[t.subjectIndex]
                  ? matchedSheets[t.subjectIndex]
                  : findMatchingSheetForText(userSheets, t.title);

              return {
                id: t.id || `task-${idx + 1}-${Date.now()}`,
                time: t.time || '',
                duration: t.duration || 45,
                title: t.title || 'Study Session',
                category: t.category || 'study',
                icon: t.icon || '📝',
                completed: false,
                linkedSheetId: matched?.sheetId || undefined,
                linkedSheetName: matched?.sheetName || undefined,
                monitorTopic: matched?.topicName || undefined,
              };
            });

          if (parsed.planA?.tasks && parsed.planB?.tasks) {
            return res.json({
              success: true,
              mode,
              totalHours,
              matchedSheets,
              planA: {
                title: parsed.planA.title || 'Option A: Deep Work Sequence',
                tasks: attachSheetsToTasks(parsed.planA.tasks),
              },
              planB: {
                title: parsed.planB.title || 'Option B: Balanced Sprint Flow',
                tasks: attachSheetsToTasks(parsed.planB.tasks),
              },
            });
          }
        }
      } catch (aiErr) {
        console.warn('[Gemini AI Plan Gen] AI call failed, using heuristic fallback:', aiErr.message);
      }
    }

    // 3. Fallback Heuristic Generator
    const heuristic = generateHeuristicPlanOptions(
      { mode, totalHours, subjects, meals, breaks, powerNap, beverage },
      matchedSheets,
      userSheets
    );

    res.json({
      success: true,
      mode,
      totalHours,
      matchedSheets,
      planA: heuristic.planA,
      planB: heuristic.planB,
      fallbackUsed: true,
    });
  } catch (error) {
    console.error('Generate Daily Plan Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate daily plan' });
  }
};

// @desc    Save selected plan as draft or start session
// @route   POST /api/daily-plan/save
// @access  Private
export const saveDailyPlan = async (req, res) => {
  try {
    const { mode, totalHours, subjects, meals, breaks, powerNap, beverage, chosenPlan, altPlan } = req.body;

    const planDoc = await DailyPlan.create({
      user: req.user._id,
      mode,
      totalHours,
      subjects: subjects || [],
      meals,
      breaks,
      powerNap,
      beverage,
      plan: chosenPlan,
      altPlan: altPlan || null,
      status: 'draft',
      durationSecondsPlanned: (totalHours || 4) * 3600,
    });

    res.status(201).json(planDoc);
  } catch (error) {
    console.error('Save Daily Plan Error:', error);
    res.status(500).json({ message: error.message || 'Failed to save daily plan' });
  }
};

// @desc    Start non-stop countdown session & snapshot linked sheets
// @route   PATCH /api/daily-plan/:id/start-session
// @access  Private
export const startPlanSession = async (req, res) => {
  try {
    const plan = await DailyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const userSheets = await Sheet.find({ user: req.user._id, isActive: true });

    // Collect all linked sheet IDs or auto-match from tasks
    const linkedSheetIds = new Set();
    (plan.plan?.tasks || []).forEach((t) => {
      if (t.linkedSheetId) {
        linkedSheetIds.add(t.linkedSheetId.toString());
      } else {
        const match = findMatchingSheetForText(userSheets, t.title);
        if (match) {
          t.linkedSheetId = match.sheetId;
          t.linkedSheetName = match.sheetName;
          linkedSheetIds.add(match.sheetId.toString());
        }
      }
    });

    (plan.subjects || []).forEach((s) => {
      if (s.linkedSheetId) {
        linkedSheetIds.add(s.linkedSheetId.toString());
      } else {
        const match = findMatchingSheetForText(userSheets, s.name);
        if (match) {
          s.linkedSheetId = match.sheetId;
          s.linkedSheetName = match.sheetName;
          linkedSheetIds.add(match.sheetId.toString());
        }
      }
    });

    // Take snapshot of each sheet's current solved & revision count
    const snapshots = [];
    for (const sheet of userSheets) {
      // Snapshot any explicitly linked sheet OR any sheet matching user subjects
      if (linkedSheetIds.has(sheet._id.toString()) || linkedSheetIds.size === 0) {
        const solvedCount = await SheetProblem.countDocuments({
          sheet: sheet._id,
          status: 'solved',
        });
        const revisionCount = await SheetProblem.countDocuments({
          sheet: sheet._id,
          status: { $in: ['revision', 'Revision'] },
        });
        const totalCount = await SheetProblem.countDocuments({ sheet: sheet._id });

        snapshots.push({
          sheetId: sheet._id,
          sheetName: sheet.name,
          totalProblems: totalCount,
          solvedProblems: solvedCount,
          revisionCount,
          updatedAt: new Date(),
        });
      }
    }

    plan.status = 'active';
    plan.sessionStartedAt = new Date();
    plan.sheetSnapshotsStart = snapshots;
    plan.durationSecondsPlanned = (plan.totalHours || 4) * 3600;

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Start Session Error:', error);
    res.status(500).json({ message: error.message || 'Failed to start session' });
  }
};

// @desc    Toggle a task completed status in the plan
// @route   PATCH /api/daily-plan/:id/toggle-task
// @access  Private
export const toggleTaskCompleted = async (req, res) => {
  try {
    const { taskId } = req.body;
    const plan = await DailyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const task = plan.plan.tasks.find((t) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found in plan' });
    }

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Toggle Task Error:', error);
    res.status(500).json({ message: error.message || 'Failed to toggle task' });
  }
};

// @desc    Update/Reorder tasks array (allows editing during active session too)
// @route   PATCH /api/daily-plan/:id/update-tasks
// @access  Private
export const updatePlanTasks = async (req, res) => {
  try {
    const { tasks, title } = req.body;
    const plan = await DailyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (tasks) plan.plan.tasks = tasks;
    if (title) plan.plan.title = title;

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Update Plan Tasks Error:', error);
    res.status(500).json({ message: error.message || 'Failed to update plan tasks' });
  }
};

// @desc    End session, capture full platform activity delta & generate AI motivational report
// @route   PATCH /api/daily-plan/:id/end-session
// @access  Private
export const endPlanSession = async (req, res) => {
  try {
    const plan = await DailyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const now = new Date();
    plan.status = 'completed';
    plan.sessionEndedAt = now;

    const sessionStart = plan.sessionStartedAt ? new Date(plan.sessionStartedAt) : new Date(Date.now() - 3600000);
    const actualSeconds = Math.round((now.getTime() - sessionStart.getTime()) / 1000);
    plan.durationSecondsActual = actualSeconds;

    // 1. Query ALL SheetProblems updated / solved / revised by user during this session window
    const activeSheetProblems = await SheetProblem.find({
      user: req.user._id,
      $or: [
        { updatedAt: { $gte: sessionStart, $lte: now } },
        { lastAttemptedAt: { $gte: sessionStart, $lte: now } },
        { solvedAt: { $gte: sessionStart, $lte: now } },
      ],
    }).populate('sheet', 'name color category');

    // 2. Track activity by Sheet
    const sheetActivityMap = new Map();
    activeSheetProblems.forEach((p) => {
      const sheetName = p.sheet?.name || 'General Sheet';
      const sheetId = p.sheet?._id || p.sheet;
      if (!sheetActivityMap.has(sheetName)) {
        sheetActivityMap.set(sheetName, {
          sheetId,
          sheetName,
          solvedDelta: 0,
          revisionDelta: 0,
          problemTitles: [],
        });
      }
      const entry = sheetActivityMap.get(sheetName);
      if (p.status === 'solved' || p.status === 'Solved') {
        entry.solvedDelta += 1;
      } else if (p.status === 'revision' || p.status === 'Revision') {
        entry.revisionDelta += 1;
      }
      entry.problemTitles.push(`${p.title} (${p.difficulty || 'medium'})`);
    });

    // Also check snapshots delta as fallback
    const monitoredReport = [];
    let totalSolvedDelta = 0;
    let totalRevisionDelta = 0;

    for (const [_, act] of sheetActivityMap.entries()) {
      totalSolvedDelta += act.solvedDelta;
      totalRevisionDelta += act.revisionDelta;
      monitoredReport.push({
        sheetId: act.sheetId,
        sheetName: act.sheetName,
        solvedDelta: act.solvedDelta,
        revisionDelta: act.revisionDelta,
        problemTitles: act.problemTitles,
      });
    }

    // Also check any existing snapshots if no activity query matches
    if (monitoredReport.length === 0 && plan.sheetSnapshotsStart?.length > 0) {
      for (const startSnap of plan.sheetSnapshotsStart) {
        const sheet = await Sheet.findById(startSnap.sheetId);
        if (sheet) {
          const endSolved = await SheetProblem.countDocuments({ sheet: sheet._id, status: 'solved' });
          const endRev = await SheetProblem.countDocuments({ sheet: sheet._id, status: { $in: ['revision', 'Revision'] } });
          const sDelta = Math.max(0, endSolved - (startSnap.solvedProblems || 0));
          const rDelta = Math.max(0, endRev - (startSnap.revisionCount || 0));
          totalSolvedDelta += sDelta;
          totalRevisionDelta += rDelta;
          if (sDelta > 0 || rDelta > 0) {
            monitoredReport.push({
              sheetId: sheet._id,
              sheetName: sheet.name,
              solvedDelta: sDelta,
              revisionDelta: rDelta,
              problemTitles: [],
            });
          }
        }
      }
    }

    // Calculate task completion rate
    const totalTasks = plan.plan?.tasks?.length || 0;
    const completedTasks = (plan.plan?.tasks || []).filter((t) => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const activityBonus = Math.min(30, (totalSolvedDelta + totalRevisionDelta) * 10);
    const focusScore = Math.min(100, Math.round(completionRate * 0.7 + activityBonus));

    // 3. Generate Anonymized AI Motivational Commentary via Gemini
    let aiCommentary = 'Give yourself a pat on your back! Not everyone clears the first step of planning things out. Vision is not clear until you write it down and execute.';
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const activitySummary = monitoredReport.map((m) => `${m.sheetName}: +${m.solvedDelta} solved, +${m.revisionDelta} revised`).join(', ') || 'Consistent revision work';
        const tasksSummary = `${completedTasks} of ${totalTasks} tasks completed in ${plan.mode} mode (${Math.round(actualSeconds / 60)} minutes)`;

        const prompt = `You are an elite, inspiring study mentor for TrackAsap.
A student just completed a study session with the following objective metrics:
- Mode: ${plan.mode}
- Tasks Done: ${tasksSummary}
- Problems/Revisions Tackled on Platform: ${activitySummary}
- Focus Score: ${focusScore}%

Write an energetic, highly motivating 2-sentence personal debrief for this student celebrating their specific accomplishments. Keep it punchy, authentic, and inspiring. DO NOT use generic filler.`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });
        if (response.text?.trim()) {
          aiCommentary = response.text.trim();
        }
      } catch (aiErr) {
        console.warn('AI Commentary generation failed:', aiErr.message);
      }
    }

    plan.report = {
      totalTasksCompleted: completedTasks,
      totalTasksPlanned: totalTasks,
      completionRate,
      problemsSolvedDelta: totalSolvedDelta,
      revisionsDelta: totalRevisionDelta,
      totalActivityCount: totalSolvedDelta + totalRevisionDelta,
      focusScore,
      motivationalQuote: aiCommentary,
      sheetsMonitored: monitoredReport,
    };

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('End Session Error:', error);
    res.status(500).json({ message: error.message || 'Failed to end session' });
  }
};

// @desc    Get user's current active session or latest draft
// @route   GET /api/daily-plan/active
// @access  Private
export const getActivePlan = async (req, res) => {
  try {
    const active = await DailyPlan.findOne({
      user: req.user._id,
      status: 'active',
    }).sort({ createdAt: -1 });

    if (active) return res.json(active);

    const latestDraft = await DailyPlan.findOne({
      user: req.user._id,
      status: 'draft',
    }).sort({ createdAt: -1 });

    res.json(latestDraft || null);
  } catch (error) {
    console.error('Get Active Plan Error:', error);
    res.status(500).json({ message: error.message || 'Failed to get active plan' });
  }
};

// @desc    Get user's past plan history
// @route   GET /api/daily-plan/history
// @access  Private
export const getPlanHistory = async (req, res) => {
  try {
    const history = await DailyPlan.find({
      user: req.user._id,
      status: { $in: ['completed', 'abandoned'] },
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(history);
  } catch (error) {
    console.error('Get Plan History Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch plan history' });
  }
};

// @desc    Get single plan by ID
// @route   GET /api/daily-plan/:id
// @access  Private
export const getPlanById = async (req, res) => {
  try {
    const plan = await DailyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    console.error('Get Plan By ID Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch plan' });
  }
};
