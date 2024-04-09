const mongoose = require('mongoose');

const busDetailsSchema = new mongoose.Schema({
  bus_number: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver_number: { type: String, required: true },
  driver_name: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
});

const BusDetails = mongoose.model('BusDetails', busDetailsSchema);

module.exports = BusDetails;
