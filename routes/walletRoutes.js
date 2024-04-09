const express = require("express");
const router = express.Router();
const {
  getwallet,
  updateWallet,
  getwalletById,
} = require("../controller/wallet.controllers");
const { verifyUser } = require("../../middleware/middleware");

router.route("/")
      .put([verifyUser], updateWallet);

router.get("/:adminId", [verifyUser], getwallet);

module.exports = router;
