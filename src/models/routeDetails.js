const mongoose = require('mongoose');

const routeDetailsSchema = new mongoose.Schema({
  route_name: { type: String, required: true },
  stop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BusStop', required: true },
  stop_sequence: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
});

const RouteDetails = mongoose.model('RouteDetails', routeDetailsSchema);

module.exports = RouteDetails;
