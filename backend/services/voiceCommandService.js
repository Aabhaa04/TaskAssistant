const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const User = require('../models/User');
const emailService = require('./emailService');


class VoiceCommandService {
  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async processVoiceCommand(transcript, userId) {
    try {
      const prompt = `
You are a task management assistant. Convert the following voice command into a structured JSON response.

Voice Command: "${transcript}"

Based on the command, determine the action and extract relevant information. Respond with ONLY a JSON object in this format:

For CREATE TASK:
{
  "action": "create_task",
  "data": {
    "title": "extracted title",
    "description": "extracted description",
    "date": "YYYY-MM-DD format",
    "time": "HH:MM format (24-hour)",
    "duration": number_in_minutes
  }
}

For MARK COMPLETED:
{
  "action": "mark_completed",
  "data": {
    "taskTitle": "task name to mark as completed"
  }
}

For EMAIL NEXT MEETING:
{
  "action": "email_next_meeting"
}

For LIST TASKS:
{
  "action": "list_tasks",
  "filter": "all" | "pending" | "completed" | "today" | "tomorrow"
}

Rules:
- Use current year if year not specified
- Convert relative dates (today, tomorrow, next week) to actual dates
- Convert 12-hour time to 24-hour format
- Default duration is 60 minutes if not specified
- If date/time is unclear, use "TBD"
- Today's date is ${new Date().toISOString().split('T')[0]}

Examples:
"Schedule a meeting tomorrow at 2 PM" → date: tomorrow's date, time: "14:00"
"Create task for staff meeting on 17th September" → date: "2024-09-17" (assuming current year)
"Mark staff meeting as completed" → action: "mark_completed", taskTitle: "staff meeting"
`;

  const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);

      let response = result.response.text().trim();
      console.log('Gemini Response:', response);

      if (response.startsWith('```')) {
        response = response.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
      }

      const commandData = JSON.parse(response);

      return await this.executeCommand(commandData, userId);

    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        success: false,
        message: 'Sorry, I could not understand your command. Please try again.',
        error: error.message
      };
    }
  }

  async executeCommand(commandData, userId) {
    try {
      switch (commandData.action) {
        case 'create_task':
          return await this.createTaskFromCommand(commandData.data, userId);
        
        case 'mark_completed':
          return await this.markTaskCompleted(commandData.data.taskTitle, userId);
        
        case 'email_next_meeting':
          return await this.emailNextMeeting(userId);
        
        case 'list_tasks':
          return await this.listTasks(commandData.filter, userId);
        
        default:
          return {
            success: false,
            message: 'Unknown command action'
          };
      }
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        message: 'Error executing command',
        error: error.message
      };
    }
  }

  async createTaskFromCommand(taskData, userId) {
    try {
      const task = new Task({
        title: taskData.title,
        description: taskData.description || '',
        date: taskData.date === 'TBD' ? '' : taskData.date,
        time: taskData.time === 'TBD' ? '' : taskData.time,
        duration: taskData.duration || 60,
        completed: false,
        user: userId
      });

      await task.save();

      return {
        success: true,
        message: `Task "${taskData.title}" created successfully!`,
        task: task
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create task',
        error: error.message
      };
    }
  }

  async markTaskCompleted(taskTitle, userId) {
    try {
      const task = await Task.findOne({
        user: userId,
        title: { $regex: taskTitle, $options: 'i' },
        completed: false
      });

      if (!task) {
        return {
          success: false,
          message: `Task "${taskTitle}" not found or already completed`
        };
      }

      task.completed = true;
      await task.save();

      return {
        success: true,
        message: `Task "${task.title}" marked as completed!`,
        task: task
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to mark task as completed',
        error: error.message
      };
    }
  }

  async emailNextMeeting(userId) {
    try {
      const now = new Date();
      
      const nextTask = await Task.findOne({
        user: userId,
        completed: false,
        date: { $exists: true, $ne: '' },
        time: { $exists: true, $ne: '' }
      }).populate('user', 'name email').sort({ date: 1, time: 1 });

      if (!nextTask) {
        return {
          success: false,
          message: 'No upcoming meetings found'
        };
      }

      const taskDateTime = nextTask.getScheduledDateTime();
      if (taskDateTime < now) {
        return {
          success: false,
          message: 'Next meeting has already passed'
        };
      }

      await emailService.sendTaskReminder(nextTask.user, nextTask);

      return {
        success: true,
        message: `Email sent for "${nextTask.title}" scheduled on ${taskDateTime.toLocaleString()}`,
        task: nextTask
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  async listTasks(filter, userId) {
    try {
      let query = { user: userId };
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      switch (filter) {
        case 'pending':
          query.completed = false;
          break;
        case 'completed':
          query.completed = true;
          break;
        case 'today':
          query.date = today;
          break;
        case 'tomorrow':
          query.date = tomorrow;
          break;
      }

      const tasks = await Task.find(query).sort({ date: 1, time: 1 });

      return {
        success: true,
        message: `Found ${tasks.length} tasks`,
        tasks: tasks
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list tasks',
        error: error.message
      };
    }
  }
}

module.exports = new VoiceCommandService();