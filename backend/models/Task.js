// const mongoose = require('mongoose');

// const taskSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   date: { type: String },   // yyyy-MM-dd
//   time: { type: String },   // HH:mm
//   duration: { type: Number, default: 60 }, // minutes
//   completed: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
// });

// module.exports = mongoose.model('Task', taskSchema);
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: String },   
  time: { type: String },   
  duration: { type: Number, default: 60 }, 
  completed: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

taskSchema.methods.getScheduledDateTime = function() {
  if (!this.date || !this.time) return null;
  return new Date(`${this.date}T${this.time}:00`);
};

module.exports = mongoose.model('Task', taskSchema);