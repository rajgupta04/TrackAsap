import Sheet from '../models/Sheet.model.js';
import Problem from '../models/Problem.model.js';

// Default templates for each category
const defaultTemplates = {
  dsa: {
    name: 'DSA Sheet',
    description: 'Data Structures and Algorithms roadmap',
    topics: [
      { name: 'Arrays', totalProblems: 20, order: 1 },
      { name: 'Strings', totalProblems: 15, order: 2 },
      { name: 'Linked List', totalProblems: 15, order: 3 },
      { name: 'Stack & Queue', totalProblems: 12, order: 4 },
      { name: 'Trees', totalProblems: 25, order: 5 },
      { name: 'Binary Search', totalProblems: 15, order: 6 },
      { name: 'Graphs', totalProblems: 25, order: 7 },
      { name: 'Dynamic Programming', totalProblems: 30, order: 8 },
      { name: 'Recursion & Backtracking', totalProblems: 15, order: 9 },
      { name: 'Heap & Priority Queue', totalProblems: 10, order: 10 },
      { name: 'Greedy', totalProblems: 12, order: 11 },
      { name: 'Bit Manipulation', totalProblems: 8, order: 12 },
    ],
    color: '#39FF14',
    icon: 'binary',
  },
  cp: {
    name: 'Competitive Programming',
    description: 'Contest preparation roadmap',
    topics: [
      { name: 'Number Theory', totalProblems: 15, order: 1 },
      { name: 'Combinatorics', totalProblems: 12, order: 2 },
      { name: 'Segment Trees', totalProblems: 15, order: 3 },
      { name: 'Fenwick Tree', totalProblems: 10, order: 4 },
      { name: 'Advanced Graphs', totalProblems: 20, order: 5 },
      { name: 'Game Theory', totalProblems: 8, order: 6 },
      { name: 'Advanced DP', totalProblems: 20, order: 7 },
      { name: 'String Algorithms', totalProblems: 12, order: 8 },
      { name: 'Geometry', totalProblems: 10, order: 9 },
      { name: 'Interactive Problems', totalProblems: 8, order: 10 },
    ],
    color: '#1F8ACB',
    icon: 'trophy',
  },
  os: {
    name: 'Operating Systems',
    description: 'OS concepts for interviews',
    topics: [
      { name: 'Process Management', totalProblems: 15, order: 1 },
      { name: 'Threads & Concurrency', totalProblems: 15, order: 2 },
      { name: 'CPU Scheduling', totalProblems: 10, order: 3 },
      { name: 'Deadlocks', totalProblems: 8, order: 4 },
      { name: 'Memory Management', totalProblems: 15, order: 5 },
      { name: 'Virtual Memory', totalProblems: 10, order: 6 },
      { name: 'File Systems', totalProblems: 10, order: 7 },
      { name: 'I/O Systems', totalProblems: 8, order: 8 },
      { name: 'System Calls', totalProblems: 8, order: 9 },
    ],
    color: '#FF10F0',
    icon: 'cpu',
  },
  cn: {
    name: 'Computer Networks',
    description: 'Networking concepts for interviews',
    topics: [
      { name: 'OSI & TCP/IP Model', totalProblems: 10, order: 1 },
      { name: 'Application Layer', totalProblems: 12, order: 2 },
      { name: 'Transport Layer', totalProblems: 15, order: 3 },
      { name: 'Network Layer', totalProblems: 15, order: 4 },
      { name: 'Data Link Layer', totalProblems: 10, order: 5 },
      { name: 'Physical Layer', totalProblems: 5, order: 6 },
      { name: 'Network Security', totalProblems: 12, order: 7 },
      { name: 'HTTP & Web', totalProblems: 10, order: 8 },
      { name: 'Socket Programming', totalProblems: 8, order: 9 },
    ],
    color: '#00FFFF',
    icon: 'network',
  },
  oops: {
    name: 'Object Oriented Programming',
    description: 'OOP concepts and design patterns',
    topics: [
      { name: 'Classes & Objects', totalProblems: 10, order: 1 },
      { name: 'Inheritance', totalProblems: 10, order: 2 },
      { name: 'Polymorphism', totalProblems: 10, order: 3 },
      { name: 'Abstraction', totalProblems: 8, order: 4 },
      { name: 'Encapsulation', totalProblems: 8, order: 5 },
      { name: 'SOLID Principles', totalProblems: 10, order: 6 },
      { name: 'Design Patterns', totalProblems: 20, order: 7 },
      { name: 'UML Diagrams', totalProblems: 8, order: 8 },
    ],
    color: '#FFA116',
    icon: 'boxes',
  },
  dev: {
    name: 'Development',
    description: 'Web/App development roadmap',
    topics: [
      { name: 'HTML & CSS', totalProblems: 15, order: 1 },
      { name: 'JavaScript', totalProblems: 25, order: 2 },
      { name: 'React/Frontend', totalProblems: 20, order: 3 },
      { name: 'Node.js/Backend', totalProblems: 20, order: 4 },
      { name: 'Databases', totalProblems: 15, order: 5 },
      { name: 'REST APIs', totalProblems: 12, order: 6 },
      { name: 'Authentication', totalProblems: 8, order: 7 },
      { name: 'Deployment', totalProblems: 10, order: 8 },
      { name: 'System Design Basics', totalProblems: 15, order: 9 },
    ],
    color: '#22C55E',
    icon: 'code',
  },
};

// @desc    Create a new sheet
// @route   POST /api/sheets
// @access  Private
export const createSheet = async (req, res) => {
  try {
    const { name, description, category, topics, color, icon, useTemplate } = req.body;

    let sheetData = {
      user: req.user._id,
      name,
      description,
      category,
      color,
      icon,
      topics: topics || [],
    };

    // If using template, populate with default topics
    if (useTemplate && defaultTemplates[category]) {
      const template = defaultTemplates[category];
      sheetData = {
        ...sheetData,
        name: name || template.name,
        description: description || template.description,
        topics: template.topics.map(t => ({ ...t, solvedProblems: 0 })),
        color: color || template.color,
        icon: icon || template.icon,
        totalProblems: template.topics.reduce((sum, t) => sum + t.totalProblems, 0),
      };
    }

    const sheet = await Sheet.create(sheetData);
    res.status(201).json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sheets for user
// @route   GET /api/sheets
// @access  Private
export const getSheets = async (req, res) => {
  try {
    const sheets = await Sheet.find({ user: req.user._id, isActive: true })
      .sort({ createdAt: -1 });

    res.json(sheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single sheet with problems
// @route   GET /api/sheets/:id
// @access  Private
export const getSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    // Get problems for this sheet
    const problems = await Problem.find({
      user: req.user._id,
      sheet: sheet._id,
    }).sort({ solvedAt: -1 });

    res.json({ sheet, problems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update sheet
// @route   PUT /api/sheets/:id
// @access  Private
export const updateSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add topic to sheet
// @route   POST /api/sheets/:id/topics
// @access  Private
export const addTopic = async (req, res) => {
  try {
    const { name, totalProblems, description } = req.body;

    const sheet = await Sheet.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    const order = sheet.topics.length + 1;
    sheet.topics.push({
      name,
      totalProblems: totalProblems || 0,
      solvedProblems: 0,
      description: description || '',
      order,
    });

    sheet.totalProblems += totalProblems || 0;
    await sheet.save();

    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update topic progress
// @route   PUT /api/sheets/:id/topics/:topicName
// @access  Private
export const updateTopicProgress = async (req, res) => {
  try {
    const { solvedProblems, totalProblems } = req.body;
    const topicName = decodeURIComponent(req.params.topicName);

    const sheet = await Sheet.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    const topic = sheet.topics.find(t => t.name === topicName);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Update totals
    const oldSolved = topic.solvedProblems;
    const oldTotal = topic.totalProblems;

    if (solvedProblems !== undefined) {
      topic.solvedProblems = solvedProblems;
      sheet.solvedProblems = sheet.solvedProblems - oldSolved + solvedProblems;
    }

    if (totalProblems !== undefined) {
      topic.totalProblems = totalProblems;
      sheet.totalProblems = sheet.totalProblems - oldTotal + totalProblems;
    }

    await sheet.save();
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete sheet
// @route   DELETE /api/sheets/:id
// @access  Private
export const deleteSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    // Remove sheet reference from problems
    await Problem.updateMany(
      { sheet: sheet._id },
      { $unset: { sheet: 1, sheetTopic: 1 } }
    );

    res.json({ message: 'Sheet deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available templates
// @route   GET /api/sheets/templates
// @access  Private
export const getTemplates = async (req, res) => {
  try {
    const templates = Object.entries(defaultTemplates).map(([key, value]) => ({
      category: key,
      ...value,
      totalProblems: value.topics.reduce((sum, t) => sum + t.totalProblems, 0),
    }));

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
