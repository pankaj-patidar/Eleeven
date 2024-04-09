const express = require("express");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const { format } = require("date-fns");
const User = require('../models/user');
const mongoose = require('mongoose');

const { sendResponseError } = require("../middleware/middleware");

const { newToken } = require("../utils/utility.function");
const UserRole = require('../models/userRole');

const registerUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      roleName,
      mobileNumber,
    } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'User already exists' });
    }

    // Find the UserRole document based on the provided RoleName
    const userRole = await UserRole.findOne({ role_name: roleName }).session(session);
    
    if (!userRole) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid role name' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({
      first_name: firstName,
      last_name: lastName,
      user_name: userName,
      email,
      password: hashedPassword,
      user_role: userRole._id, // Assign the retrieved RoleId
      mobile_number: mobileNumber,
    });

    // Save the user to the database
    await newUser.save({ session });

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);

    // If an error occurs, abort the transaction and rollback changes
    await session.abortTransaction();
    session.endSession();

    sendResponseError(500, 'Internal Server Error', res);
  }
};

const loginUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { identifier, password } = req.body;

    // Find the user by username, email, or mobile number
    const user = await User.findOne({
      $or: [
        { user_name: identifier },
        { email: identifier },
        { mobile_number: identifier },
      ],
    }).populate('user_role').session(session);

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the provided password matches the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get the user role name
    const userRoleName = user.user_role ? user.user_role.role_name : '';

    // Generate and store a new authentication token with user role name
    const authToken = newToken(user._id, userRoleName);
    user.logged_token = authToken;
    user.modified_at = new Date()
    await user.save({ session });

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Login successful', authToken });
  } catch (error) {
    console.error(error);

    // If an error occurs, abort the transaction and rollback changes
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllUser = async (req, res) => {
  try {
    // Find all users in the database
    const users = await User.find({}, '-password').populate('user_role'); // Excluding the 'password' field

    // Convert each user document to a plain JavaScript object
    const userObjects = users.map(user => {
      const userObject = user.toObject();
      delete userObject.logged_token;
      delete userObject.created_at;
      delete userObject.modified_at;
      if (userObject.user_role) {
        delete userObject.user_role.modified_at;
        delete userObject.user_role.created_at;
        delete userObject.user_role.__v;
      }
      return userObject;
    });

    // Send the user data in the response
    res.status(200).json({ users: userObjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the provided userId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user ID' });
    }

    // Find the user by ID in the database
    const user = await User.findById(id).populate('user_role');

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // Convert Mongoose document to plain JavaScript object and remove the 'password' field
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.logged_token;
    delete userObject.created_at;
    delete userObject.modified_at;
    delete userObject.user_role.modified_at;
    delete userObject.user_role.created_at;
    delete userObject.user_role.__v;


    // Send the user data in the response
    res.status(200).json({ user: userObject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};


// const activateUser = async (req, res) => {
//   const user_id = req.params.id;
//   var { status, adminId } = req.body;

//   if (adminId == null) {
//     var adminId = user_id;
//   }
//   const userActiveQuery =
//     "UPDATE expenses_managment.user SET is_active=?,modified_at = NOW() WHERE id=? or admin_id=?";
//   userActiveData = [status, user_id, adminId];
//   try {
//     connectDB.query(userActiveQuery, userActiveData).then(([result]) => {
//       if (result.affectedRows <= 0) {
//         res
//           .status(404)
//           .send({ status: false, message: "Unable to change user status." });
//       } else {
//         res
//           .status(200)
//           .send({ status: true, message: "User is status changed." });
//       }
//     });
//   } catch (err) {
//     console.log("Error : ", err);
//     sendResponseError(500, "Something wrong please try again");
//     return;
//   }
// };

const resetPassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    // Validate the provided userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: true, message: 'Invalid user ID' });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // Check if the provided old password matches the stored hashed password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: true, message: 'Invalid old password' });
    }

    // Update the password and modified_at
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.modified_at = new Date();

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

// const getPointByUserId = async (req, res) => {
//   const user_id = req.params.id;
//   console.log(user_id);
//   const getUserQuery =
//     "SELECT  user_id as userId, amount FROM expenses_managment.wallet WHERE user_id=? ";
//   try {
//     connectDB
//       .query(getUserQuery, [user_id])
//       .then(([result]) => {
//         if (result.length <= 0) {
//           res
//             .status(404)
//             .send({ status: false, message: "Unable to fetch users data." });
//         } else {
//           res.status(200).send({
//             status: false,
//             message: "User data fetched succesfully.",
//             data: result[0],
//           });
//         }
//       })
//       .catch((err) => {
//         sendResponseError(
//           500,
//           "Unable to fetch users data.. Error- " + err.message,
//           res
//         );
//       });
//   } catch (err) {
//     sendResponseError(500, "Something wrong please try again");
//     return;
//   }
// };

const logout = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming the user information is stored in req.user

    // Find the user by ID and update the logged_token and modified_at
    const user = await User.findByIdAndUpdate(
      userId,
      { logged_token: null, modified_at: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  resetPassword,
  getUserById,
  logout,
  getAllUser,
};