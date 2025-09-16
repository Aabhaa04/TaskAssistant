const Task = require('../models/Task');
const User = require('../models/User');

// ✅ Get user info (just username)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username');
    res.json({ userName: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Get unfinished tasks
exports.getUnfinishedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id, completed: false });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Create new task
exports.createTask = async (req, res) => {
  try {
    const newTask = new Task({
      ...req.body,
      user: req.user.id
    });
    const task = await newTask.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Update task
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// Add these imports at the top
const reminderService = require('../services/reminderService');

// Add these new methods to your existing exports

// Manual trigger for reminders (useful for testing)
exports.triggerReminders = async (req, res) => {
  try {
    await reminderService.triggerReminderCheck();
    res.json({
      success: true,
      message: 'Reminder check triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error triggering reminders',
      error: error.message
    });
  }
};

// Get upcoming tasks that need reminders (for debugging)
exports.getUpcomingReminders = async (req, res) => {
  try {
    const now = new Date();
    
    const tasks = await Task.find({
      user: req.user.id,
      reminderSent: false,
      completed: false,
      date: { $exists: true },
      time: { $exists: true }
    });

    const upcomingTasks = tasks.filter(task => {
      const scheduledDateTime = task.getScheduledDateTime();
      if (!scheduledDateTime) return false;
      
      const timeDiff = scheduledDateTime.getTime() - now.getTime();
      const minutesUntilTask = Math.floor(timeDiff / (1000 * 60));
      
      return minutesUntilTask > 0 && minutesUntilTask <= 60; // Next hour
    });
    
    res.json({
      success: true,
      count: upcomingTasks.length,
      tasks: upcomingTasks.map(task => ({
        ...task.toObject(),
        scheduledDateTime: task.getScheduledDateTime(),
        minutesUntilStart: Math.floor((task.getScheduledDateTime().getTime() - now.getTime()) / (1000 * 60))
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming reminders',
      error: error.message
    });
  }
};

// Reset reminder status for a task
exports.resetReminder = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { reminderSent: false },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Reminder status reset',
      task 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};