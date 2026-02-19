// Fetch LeetCode stats using alfa-leetcode-api
export const getLeetCodeStats = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // Fetch solved problems count
    const solvedResponse = await fetch(
      `https://alfa-leetcode-api.onrender.com/${username}/solved`
    );

    if (!solvedResponse.ok) {
      throw new Error('Failed to fetch LeetCode data');
    }

    const solvedData = await solvedResponse.json();

    // Fetch user profile for additional details
    const profileResponse = await fetch(
      `https://alfa-leetcode-api.onrender.com/${username}`
    );

    let profileData = {};
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Fetch submission calendar/streak data
    const calendarResponse = await fetch(
      `https://alfa-leetcode-api.onrender.com/${username}/calendar`
    );

    let calendarData = {};
    if (calendarResponse.ok) {
      calendarData = await calendarResponse.json();
    }

    res.json({
      success: true,
      platform: 'leetcode',
      username,
      data: {
        totalSolved: solvedData.solvedProblem || 0,
        easySolved: solvedData.easySolved || 0,
        mediumSolved: solvedData.mediumSolved || 0,
        hardSolved: solvedData.hardSolved || 0,
        totalEasy: solvedData.totalEasy || 0,
        totalMedium: solvedData.totalMedium || 0,
        totalHard: solvedData.totalHard || 0,
        ranking: profileData.ranking || null,
        reputation: profileData.reputation || 0,
        contributionPoints: profileData.contributionPoints || 0,
        avatar: profileData.avatar || null,
        streak: calendarData.streak || 0,
        totalActiveDays: calendarData.totalActiveDays || 0,
        submissionCalendar: calendarData.submissionCalendar || {},
      },
    });
  } catch (error) {
    console.error('LeetCode API Error:', error.message);
    res.status(500).json({
      success: false,
      platform: 'leetcode',
      username,
      error: 'Failed to fetch LeetCode stats. Please check if the username is correct.',
    });
  }
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

// Fetch CodeChef stats (using unofficial API)
export const getCodeChefStats = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // CodeChef doesn't have an official public API
    // We'll use a workaround with their profile page or return mock structure
    // For now, return a placeholder indicating CodeChef integration is limited
    
    res.json({
      success: true,
      platform: 'codechef',
      username,
      data: {
        message: 'CodeChef stats are not available via public API',
        profileUrl: `https://www.codechef.com/users/${username}`,
      },
    });
  } catch (error) {
    console.error('CodeChef API Error:', error.message);
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
      fetch(`https://alfa-leetcode-api.onrender.com/${leetcode}/solved`)
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
