// models/userRole.js
const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  role_name: { type: String, enum: ['Superadmin', 'Admin', 'User'], required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
});

const UserRole = mongoose.model('UserRole', userRoleSchema);

module.exports = UserRole;
