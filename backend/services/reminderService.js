const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const emailService = require('./emailService');

class ReminderService {
  start() {
    cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    });
    
    console.log('📧 Reminder service started - checking every minute');
  }

  async checkAndSendReminders() {
    try {
      const now = new Date();
      
      const tasks = await Task.find({
        reminderSent: false,
        completed: false,
        date: { $exists: true },
        time: { $exists: true }
      }).populate('user', 'name email');

      const tasksNeedingReminders = [];

      for (const task of tasks) {
        const scheduledDateTime = task.getScheduledDateTime();
        if (!scheduledDateTime) continue;

        const timeDiff = scheduledDateTime.getTime() - now.getTime();
        const minutesUntilTask = Math.floor(timeDiff / (1000 * 60));

        if (minutesUntilTask >= 9 && minutesUntilTask <= 10) {
          tasksNeedingReminders.push(task);
        }
      }

      console.log(`🔍 Found ${tasksNeedingReminders.length} tasks needing reminders`);

      for (const task of tasksNeedingReminders) {
        if (task.user && task.user.email) {
          const emailSent = await emailService.sendTaskReminder(task.user, task);
          
          if (emailSent) {
            await Task.findByIdAndUpdate(task._id, { reminderSent: true });
          }
        } else {
          console.warn(`Task ${task._id} has no associated user or email`);
        }
      }
    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  }

  async triggerReminderCheck() {
    await this.checkAndSendReminders();
  }
}

module.exports = new ReminderService();