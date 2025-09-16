const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({  
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendTaskReminder(user, task) {
    const scheduledDateTime = task.getScheduledDateTime();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `⏰ Reminder: "${task.title}" starts in 10 minutes!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Task Reminder</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your task is starting in 10 minutes!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">📋 ${task.title}</h3>
            <p><strong>⏰ Scheduled Time:</strong> ${scheduledDateTime ? scheduledDateTime.toLocaleString() : 'Not specified'}</p>
            <p><strong>⏱️ Duration:</strong> ${task.duration} minutes</p>
            ${task.description ? `<p><strong>📝 Description:</strong> ${task.description}</p>` : ''}
          </div>
          
          <p>Good luck with your task! 🚀</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #888;">
            This is an automated reminder from your Task Assistant.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Reminder sent to ${user.email} for task: ${task.title}`);
      return true;
    } catch (error) {
      console.error(`Failed to send reminder to ${user.email}:`, error.message);
      return false;
    }
  }
}

module.exports = new EmailService();