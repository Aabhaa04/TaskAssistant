// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/auth');

// const {
//   getUser,
//   getTasks,
//   getUnfinishedTasks,
//   createTask,
//   updateTask,
//   deleteTask
// } = require('../controllers/taskController');

// // User info
// router.get('/user', protect, getUser);

// // Tasks
// router.get('/', protect, getTasks);
// router.get('/unfinished', protect, getUnfinishedTasks);
// router.post('/', protect, createTask);
// router.put('/:id', protect, updateTask);
// router.delete('/:id', protect, deleteTask);

// module.exports = router;

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
  triggerReminders,        // NEW
  getUpcomingReminders,    // NEW
  resetReminder           // NEW
} = require('../controllers/taskController');

// User info
router.get('/user', protect, getUser);

// Tasks
router.get('/', protect, getTasks);
router.get('/unfinished', protect, getUnfinishedTasks);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

// Reminder routes (NEW)
router.post('/trigger-reminders', protect, triggerReminders);
router.get('/upcoming-reminders', protect, getUpcomingReminders);
router.put('/:id/reset-reminder', protect, resetReminder);

module.exports = router;