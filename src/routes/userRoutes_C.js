const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// Define routes
router.get('/users', userController.getAllUsers);

module.exports = router;
