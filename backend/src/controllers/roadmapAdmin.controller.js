import RoadmapWorld from '../models/RoadmapWorld.model.js';

/**
 * @desc    Get all active roadmap worlds (for user Roadmap page)
 * @route   GET /api/roadmap/worlds
 * @access  Public / Optional Auth
 */
export const getRoadmapWorlds = async (req, res) => {
  try {
    const worlds = await RoadmapWorld.find({ isActive: true })
      .populate('problems.judgeProblem', 'title slug difficulty')
      .populate('bossLevel.problems.judgeProblem', 'title slug difficulty')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: worlds,
    });
  } catch (error) {
    console.error('getRoadmapWorlds error:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap worlds' });
  }
};

/**
 * @desc    Get all roadmap worlds for Admin Management
 * @route   GET /api/admin/roadmap/worlds
 * @access  Admin
 */
export const getAdminRoadmapWorlds = async (req, res) => {
  try {
    const worlds = await RoadmapWorld.find()
      .populate('problems.judgeProblem', 'title slug difficulty')
      .populate('bossLevel.problems.judgeProblem', 'title slug difficulty')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: worlds,
    });
  } catch (error) {
    console.error('getAdminRoadmapWorlds error:', error);
    res.status(500).json({ message: 'Failed to fetch admin roadmap worlds' });
  }
};

/**
 * @desc    Upsert (create or update) a Roadmap World
 * @route   POST /api/admin/roadmap/worlds
 * @access  Admin
 */
export const upsertRoadmapWorld = async (req, res) => {
  try {
    const {
      id,
      name,
      image,
      emoji,
      difficulty,
      estimatedTime,
      description,
      order,
      theme,
      problems,
      bossLevel,
      isActive,
    } = req.body;

    if (!id || !name) {
      return res.status(400).json({ message: 'World ID and Name are required' });
    }

    const world = await RoadmapWorld.findOneAndUpdate(
      { id },
      {
        $set: {
          id,
          name,
          image: image || '',
          emoji: emoji || '🏰',
          difficulty: difficulty || 2,
          estimatedTime: estimatedTime || '4-6 hours',
          description: description || '',
          order: typeof order === 'number' ? order : 0,
          theme: theme || {},
          problems: problems || [],
          bossLevel: bossLevel || {},
          isActive: typeof isActive === 'boolean' ? isActive : true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Roadmap World "${world.name}" saved successfully! 🚀`,
      data: world,
    });
  } catch (error) {
    console.error('upsertRoadmapWorld error:', error);
    res.status(500).json({ message: error.message || 'Failed to save roadmap world' });
  }
};

/**
 * @desc    Delete a Roadmap World
 * @route   DELETE /api/admin/roadmap/worlds/:id
 * @access  Admin
 */
export const deleteRoadmapWorld = async (req, res) => {
  try {
    const { id } = req.params;
    const world = await RoadmapWorld.findOneAndDelete({ id });

    if (!world) {
      return res.status(404).json({ message: 'Roadmap world not found' });
    }

    res.json({
      success: true,
      message: `Roadmap World "${world.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('deleteRoadmapWorld error:', error);
    res.status(500).json({ message: 'Failed to delete roadmap world' });
  }
};

/**
 * @desc    Batch seed/import Roadmap Worlds (e.g. from static roadmapData)
 * @route   POST /api/admin/roadmap/seed
 * @access  Admin
 */
export const seedRoadmapWorlds = async (req, res) => {
  try {
    const { worlds } = req.body;
    if (!Array.isArray(worlds) || worlds.length === 0) {
      return res.status(400).json({ message: 'An array of worlds is required' });
    }

    const operations = worlds.map((world, idx) => ({
      updateOne: {
        filter: { id: world.id },
        update: {
          $set: {
            ...world,
            order: typeof world.order === 'number' ? world.order : idx,
            isActive: typeof world.isActive === 'boolean' ? world.isActive : true,
          },
        },
        upsert: true,
      },
    }));

    await RoadmapWorld.bulkWrite(operations);

    res.json({
      success: true,
      message: `Successfully seeded/updated ${worlds.length} roadmap worlds! 🎉`,
    });
  } catch (error) {
    console.error('seedRoadmapWorlds error:', error);
    res.status(500).json({ message: error.message || 'Failed to seed roadmap worlds' });
  }
};
