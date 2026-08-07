import RoadmapProgress from '../models/RoadmapProgress.model.js';

export const getRoadmapProgress = async (req, res) => {
  try {
    const progress = await RoadmapProgress.findOne({ user: req.user._id });
    
    if (!progress) {
      return res.status(200).json({
        completedProblems: [],
        completedWorlds: [],
        unlockedWorlds: ['arrays'],
        totalXP: 0,
        coins: 0,
        awardedCoinProblems: [],
        awardedCoinWorlds: [],
        questionMode: 'blind75',
        unlockedAudioTracks: [],
        problemNotes: {},
        problemCode: {}
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error('Error in getRoadmapProgress controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const saveRoadmapProgress = async (req, res) => {
  try {
    const updateData = req.body;
    
    const progress = await RoadmapProgress.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json(progress);
  } catch (error) {
    console.error('Error in saveRoadmapProgress controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
