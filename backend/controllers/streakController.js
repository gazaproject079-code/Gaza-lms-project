const { DailyActivity } = require('../models');
const { Op } = require('sequelize');

// Format date as 'YYYY-MM-DD' in local time
const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Core streak calculation — shared by both endpoints
async function calculateStreak(userId) {
  // Fetch last 90 days of activity
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const activities = await DailyActivity.findAll({
    where: {
      userId,
      activityDate: { [Op.gte]: toDateStr(ninetyDaysAgo) },
    },
    order: [['activityDate', 'DESC']],
  });

  const activeDates = new Set(activities.map(a => a.activityDate));

  // Build last 7 days array (oldest → newest)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    last7Days.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      active: activeDates.has(dateStr),
    });
  }

  // Calculate current streak
  // Streak is live if active today, or if active yesterday (streak still valid until end of today)
  const today = new Date();
  const todayStr = toDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  const isActiveToday = activeDates.has(todayStr);

  // Find the start day for counting back
  let currentStreak = 0;
  let checkDate;
  if (isActiveToday) {
    checkDate = new Date(today);
  } else if (activeDates.has(yesterdayStr)) {
    // Yesterday active, today not yet — streak still valid
    checkDate = new Date(yesterday);
  } else {
    checkDate = null; // Streak broken
  }

  if (checkDate) {
    while (activeDates.has(toDateStr(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Calculate longest ever streak
  const sortedDates = [...activeDates].sort(); // ascending
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr);
    if (prevDate) {
      const diffMs = d - prevDate;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = d;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const lastActive = activities.length > 0 ? activities[0].activityDate : null;
  const totalActiveDays = activeDates.size;

  return {
    currentStreak,
    longestStreak,
    last7Days,
    isActiveToday,
    lastActive,
    totalActiveDays,
  };
}

// POST /api/streak/activity — record today as active (idempotent)
exports.recordActivity = async (req, res) => {
  try {
    const todayStr = toDateStr(new Date());
    await DailyActivity.findOrCreate({
      where: { userId: req.user.id, activityDate: todayStr },
    });
    const streakData = await calculateStreak(req.user.id);
    res.json({ success: true, ...streakData });
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/streak — return streak data without recording activity
exports.getStreak = async (req, res) => {
  try {
    const streakData = await calculateStreak(req.user.id);
    res.json({ success: true, ...streakData });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Exported helper so progressController can record activity on topic completion
exports.recordActivityForUser = async (userId) => {
  try {
    const todayStr = toDateStr(new Date());
    await DailyActivity.findOrCreate({
      where: { userId, activityDate: todayStr },
    });
  } catch (error) {
    console.error('Auto-record activity error:', error);
  }
};
