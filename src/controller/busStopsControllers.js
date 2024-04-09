const connectDB = require("../config/db");
const { format } = require("date-fns");

const {
  sendResponseError,
  incrementTransactionCount,
} = require("../middleware/middleware");

const getExpense = async (req, res) => {
  const { adminId } = req.params;

  const getAllExpenseQuery =
    "SELECT expenses.id, category_id as categoryId, expense_category.category_name as categoryName,\
     user_id as userId, first_name as firstName, last_name as lastName, expenses.admin_id as adminId,\
      description, expense_amount as expenseAmount, archived, expenses.created_at as createdAt FROM expenses\
      LEFT JOIN user ON user.id = expenses.user_id\
      LEFT JOIN expense_category on expenses.category_id = expense_category.id where expenses.admin_id =? and archived = 0";
  const getAllExpenseData = [adminId];

  try {
    connectDB
      .query(getAllExpenseQuery, getAllExpenseData)
      .then(([result]) => {
        if (result.length <= 0) {
          res.status(200).send({
            status: false,
            message: "No expense data to show.",
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Expense data fetch succesfully.",
            data: result,
          });
        }
      })
      .catch((err) => {
        sendResponseError(
          500,
          "Error in fetching expense. Error- " + err.message,
          res
        );
      });
  } catch (err) {
    console.log(err);
    sendResponseError(500, "Something went wrong. Please try again");
  }
};

const getExpenseById = async (req, res) => {
  const expenseId = req.params.id;

  const getEachExpenseQuery =
    "SELECT * FROM expenses_managment.expenses  WHERE id = ? and archived = 0";
  try {
    connectDB
      .query(getEachExpenseQuery, [1, expenseId])
      .then(([result]) => {
        if (result.length <= 0) {
          // return Promise.reject(new Error('Failed to delete expenses.'));
          res.status(500).send({
            status: false,
            message: "Failed to fetch expense data.",
          });
          // Handle error or inform the user that the email already exists
        } else {
          res.status(200).send({
            status: true,
            message: "Expense data fetch succesfully.",
            data: result,
          });
        }
      })
      .catch((err) => {
        sendResponseError(
          500,
          "Error in fetching expense. Error- " + err.message,
          res
        );
      });
  } catch (err) {
    sendResponseError(500, "Something went wrong. Please try again");
  }
};

const addExpense = async (req, res) => {
  try {
    const { expenseAmount, categoryId, description, userId, adminId } =
      req.body;
    const roleType = await incrementTransactionCount(userId, adminId, res);
    const currentDateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    // Begin the transaction
    await connectDB.query("START TRANSACTION");

    if (roleType !== "superadmin") {
      const createExpenseQuery =
        "INSERT INTO expenses_managment.expenses (category_id, user_id, admin_id, expense_amount, description, archived, created_at, modified_at ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const updateWalletQuery =
        "UPDATE expenses_managment.wallet SET amount = amount - ?, modified_at = NOW() WHERE user_id = ?";

      const expenseData = [
        categoryId,
        userId,
        adminId,
        expenseAmount,
        description,
        0,
        currentDateTime,
        currentDateTime,
      ];

      const [result] = await connectDB.query(createExpenseQuery, expenseData);

      if (roleType === "admin") {
        if (result.length <= 0) {
          // Rollback the transaction if the first query fails
          await connectDB.query("ROLLBACK");
          res
            .status(404)
            .send({ status: false, message: "Expense is not added." });
        } else {
          // Commit the transaction if both queries succeed
          await connectDB.query("COMMIT");
          res
            .status(200)
            .send({ status: true, message: "Expense added successfully." });
        }
      } else {
        const walletData = [expenseAmount, userId];
        if (result.length > 0) {
          const [walletResult] = await connectDB.query(
            updateWalletQuery,
            walletData
          );

          if (walletResult.length <= 0) {
            // Rollback the transaction if the nested query fails
            await connectDB.query("ROLLBACK");
            res
              .status(404)
              .send({ status: false, message: "Expense is not added." });
          } else {
            // Commit the transaction if both queries succeed
            await connectDB.query("COMMIT");
            res
              .status(200)
              .send({ status: true, message: "Expense added successfully." });
          }
        } else {
          // Rollback the transaction if the first query fails
          await connectDB.query("ROLLBACK");
          throw new Error("Fail to add Expenses.");
        }
      }
    } else {
      res.status(400).send({
        status: false,
        message:
          "User is not admin or employee. Feature is only for admin and employee.",
      });
    }
  } catch (err) {
    console.error(err);
    sendResponseError(500, "Something went wrong. Please try again", res);
  }
};

const updateExpense = async (req, res) => {
  try {
    const {
      expenseId,
      expenseAmount,
      categoryId,
      description,
      userId,
      adminId,
    } = req.body;

    // Begin the transaction
    await connectDB.query("START TRANSACTION");

    const roleType = await incrementTransactionCount(userId, adminId, res);

    if (roleType !== "superadmin") {
      const getExpenseAmountQuery =
        "SELECT expense_amount FROM expenses_managment.expenses WHERE id = ? and archived = 0";
      const expenseUpdateQuery =
        "UPDATE expenses_managment.expenses SET category_id = ?, expense_amount = ?, description = ?, modified_at = NOW() WHERE id = ?";
      const walletUpdateQuery =
        "UPDATE expenses_managment.wallet SET amount = amount + ? - ?, modified_at = NOW() WHERE user_id = ? ";

      const [result] = await connectDB.query(getExpenseAmountQuery, [
        expenseId,
      ]);

      if (result.length <= 0) {
        // Rollback the transaction if the first query fails
        await connectDB.query("ROLLBACK");
        throw new Error("Failed to update expenses.");
      }

      const oldExpenseAmount = result[0].expense_amount;
      const expenseUpdatedData = [
        categoryId,
        expenseAmount,
        description,
        expenseId,
      ];

      const [updateResult] = await connectDB.query(
        expenseUpdateQuery,
        expenseUpdatedData
      );

      if (updateResult.length <= 0) {
        // Rollback the transaction if the second query fails
        await connectDB.query("ROLLBACK");
        res
          .status(404)
          .send({ status: false, message: "Expense is not updated." });
      } else {
        const walletUpdateData = [oldExpenseAmount, expenseAmount, userId];
        const [walletResult] = await connectDB.query(
          walletUpdateQuery,
          walletUpdateData
        );

        if (walletResult) {
          // Commit the transaction if both queries succeed
          await connectDB.query("COMMIT");
          res.status(200).send({
            status: true,
            message: "Expense is updated successfully.",
          });
        } else {
          // Rollback the transaction if the third query fails
          await connectDB.query("ROLLBACK");
          res
            .status(500)
            .send({ status: false, message: "Failed to update expenses." });
        }
      }
    } else {
      res.status(400).send({
        status: false,
        message:
          "User is not admin or employee. Feature is only for admin and employee.",
      });
    }
  } catch (err) {
    console.error(err);
    sendResponseError(500, "Something went wrong. Please try again", res);
  }
};

const deleteExpenseById = async (req, res) => {
  const expenseId = req.params.id;

  const expenseDeleteQuery =
    "UPDATE expenses_managment.expenses SET archived = ?,modified_at = NOW() WHERE id = ?";
  try {
    connectDB
      .query(expenseDeleteQuery, [1, expenseId])
      .then(([result]) => {
        if (result.length <= 0) {
          // return Promise.reject(new Error('Failed to delete expenses.'));
          res
            .status(500)
            .send({ status: false, message: "Failed to delete expenses." });
          // Handle error or inform the user that the email already exists
        } else {
          res
            .status(200)
            .send({ status: true, message: "Expense deleted succesfully." });
        }
      })
      .catch((err) => {
        sendResponseError(
          500,
          "Error in deleting expense. Error- " + err.message,
          res
        );
      });
  } catch (err) {
    console.log(err);
    sendResponseError(500, "Something went wrong. Please try again");
    return;
  }
};

const salaryPayout = async (req, res) => {
  const adminId = req.params.adminId;

  const getUsersQuery = `SELECT  u.id as user_id, u.admin_id,salary as amount, CONCAT(first_name, ' ', last_name) as description,
      (SELECT SUM(salary) FROM expenses_managment.user WHERE u.admin_id = ?) as total_amount, t.id as category_id FROM
      expenses_managment.user as u JOIN expenses_managment.expense_category as t ON u.admin_id = t.admin_id
    WHERE
      u.admin_id = ? and t.category_name = "Salary";
  `;
  try {
    // Start the transaction
    await connectDB.query("START TRANSACTION");

    const [result] = await connectDB.query(getUsersQuery, [adminId, adminId]);

    if (result.length <= 0) {
      // Rollback the transaction
      await connectDB.query("ROLLBACK");
      res
        .status(500)
        .send({ status: false, message: "Failed to Payout salary." });
      return;
    }

    let total_amount = result[0].total_amount;
    const expenseAddData = result.map((item) => [
      item.category_id, // category_id
      item.user_id,
      item.admin_id,
      item.amount,
      item.description,
      0, // archived (assuming it's always 0 based on your previous example)
      new Date(), // current timestamp for created_at
      new Date(), // current timestamp for modified_at
    ]);

    const expenseAddQuery = `INSERT INTO expenses_managment.expenses (category_id, user_id, admin_id, expense_amount, description, archived, created_at, modified_at) VALUES ?;`;

    const [insertResult] = await connectDB.query(expenseAddQuery, [
      expenseAddData,
    ]);

    if (insertResult.affectedRows <= 0) {
      // Rollback the transaction
      await connectDB.query("ROLLBACK");
      res
        .status(500)
        .send({ status: false, message: "Failed to Payout salary." });
      return;
    }

    const walletUpdateQuery =
      "UPDATE expenses_managment.wallet SET amount = amount - ?, modified_at = NOW() WHERE user_id = ? ";
    const walletData = [total_amount, adminId];

    const [updateResult] = await connectDB.query(walletUpdateQuery, walletData);

    if (updateResult.affectedRows <= 0) {
      // Rollback the transaction
      await connectDB.query("ROLLBACK");
      res
        .status(500)
        .send({ status: false, message: "Failed to Payout salary." });
      return;
    }

    // Commit the transaction if all queries succeed
    await connectDB.query("COMMIT");
    res.status(200).send({ status: true, message: "Salary payout done." });
  } catch (err) {
    console.log(err);
    // Rollback the transaction in case of any error
    await connectDB.query("ROLLBACK");
    sendResponseError(
      500,
      "Error in salary payout. Error- " + err.message,
      res
    );
  }
};

module.exports = {
  getExpense,
  addExpense,
  updateExpense,
  getExpenseById,
  deleteExpenseById,
  salaryPayout,
};
