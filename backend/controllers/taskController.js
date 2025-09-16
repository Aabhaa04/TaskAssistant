const Task = require('../models/Task');
const User = require('../models/User');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username');
    res.json({ userName: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getUnfinishedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id, completed: false });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

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

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};


const reminderService = require('../services/reminderService');

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
const voiceCommandService = require('../services/voiceCommandService');

exports.processVoiceCommand = async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

    const result = await voiceCommandService.processVoiceCommand(transcript, req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error('Voice command processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing voice command',
      error: error.message
    });
  }
};