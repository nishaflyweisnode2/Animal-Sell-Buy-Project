const mongoose = require('mongoose');

const VoiceCallSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  duration: {
    type: Number,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  type: {
    type: String,
    enum: ['Call', 'Video Call'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Ongoing', 'Completed', 'Missed'],
    default: 'Pending',
  },
});

const VoiceCall = mongoose.model('VoiceCall', VoiceCallSchema);

module.exports = VoiceCall;
