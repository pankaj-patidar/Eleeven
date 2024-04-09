const mongoose = require('mongoose');

const scheduleTableSchema = new mongoose.Schema({
  bus_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BusDetails', required: true },
  route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RouteDetails', required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  day_of_week: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
});

const ScheduleTable = mongoose.model('ScheduleTable', scheduleTableSchema);

module.exports = ScheduleTable;
