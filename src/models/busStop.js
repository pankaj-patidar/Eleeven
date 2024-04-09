const mongoose = require('mongoose');

const busStopSchema = new mongoose.Schema({
  stop_id: { type: String, required: true, unique: true },
  stop_name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
});

const BusStop = mongoose.model('BusStop', busStopSchema);

module.exports = BusStop;
