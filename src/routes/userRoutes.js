const express = require("express");
const {
  registerUser,
  loginUser,
  getAllUser,
  getUserById,
  resetPassword,
  logout,
} = require("../controller/userController");
const { verifyUser } = require("../middleware/middleware");
const router = express.Router();

router.route("/").get([verifyUser], getAllUser);
router.route("/:id").get([verifyUser], getUserById);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.route("/reset-password").post([], resetPassword);
router.route("/logout/:id").get([verifyUser], logout);

module.exports = router;
