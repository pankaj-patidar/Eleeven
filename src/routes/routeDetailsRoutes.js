const express = require("express");
const {
  addExpenseCategory,
  updateExpenseCategory,
  getExpenseCategory,
  deleteExpenseCategory,
} = require("../controller/routeDetailsController");
const { verifyUser } = require("../middleware/middleware");
const router = express.Router();

router.route("/").post([verifyUser], addExpenseCategory);

router.route("/:adminId").get([verifyUser], getExpenseCategory);

router.route("/:id").put([verifyUser], updateExpenseCategory);

router.route("/:id").delete([verifyUser], deleteExpenseCategory);

module.exports = router;
