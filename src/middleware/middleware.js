const { verifyToken } = require("../utils/utility.function");
const connectDB = require("./../config/db");
const { format } = require("date-fns");
const User = require('../models/user');

const sendResponseError = (statusCode, msg, res) => {
  res.status(statusCode || 400).send(!!msg ? msg : "Invalid input !!");
};

const verifyUser = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return sendResponseError(400, 'You are not authorized', res);
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = await verifyToken(authorization.split(" ")[1]); // Use your actual secret key here
    // Check if the user exists in the database
    const user = await User.findById(payload.id);
    console.log(user)
    if (!user || user.logged_token != token) {
      return sendResponseError(400, 'Login to use the service', res);
    }

    // Store the user in the request object for further use if needed
    req.user = user;

    next();
  } catch (err) {
    return sendResponseError(400, `You are not authorized`, res);
  }
};

module.exports = {
  sendResponseError,
  verifyUser
};
