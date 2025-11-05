const mongoose = require('mongoose');

const feelingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  feelingText: {
    type: String,
    required: true,
  },
  moodType: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'angry', 'anxious', 'excited', 'neutral'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  voiceLink: {
    type: String,
    default: null,
  },
  videoLink: {
    type: String,
    default: null,
  },
  gratitude: {
    type: String,
    default: null,
  },
  aiResponse: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Feeling', feelingSchema);