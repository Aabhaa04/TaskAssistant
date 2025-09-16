const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getUser,
  getTasks,
  getUnfinishedTasks,
  createTask,
  updateTask,
  deleteTask,
  triggerReminders,        
  getUpcomingReminders,    
  resetReminder,           
  processVoiceCommand      
} = require('../controllers/taskController');

router.post('/voice-command', protect, processVoiceCommand);

router.get('/user', protect, getUser);

router.get('/', protect, getTasks);
router.get('/unfinished', protect, getUnfinishedTasks);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

router.post('/trigger-reminders', protect, triggerReminders);
router.get('/upcoming-reminders', protect, getUpcomingReminders);
router.put('/:id/reset-reminder', protect, resetReminder);

module.exports = router;