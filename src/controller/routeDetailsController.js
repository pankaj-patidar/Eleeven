const connectDB = require("../config/db");
const { format } = require("date-fns");

const {
  sendResponseError,
  incrementTransactionCount,
} = require("../middleware/middleware");

const getExpenseCategory = async (req, res) => {
  const adminId = req.params.adminId;
  // const roleType = await incrementTransactionCount(
  //   req.query.user_id,
  //   req.query.admin_id,
  //   res
  // );
  // if (roleType == "admin") {
  const expenseCategoryQuery =
    "SELECT id,category_name as categoryName, admin_id as adminId, created_at as createdAt FROM expenses_managment.expense_category WHERE admin_id=?";
  try {
    connectDB
      .query(expenseCategoryQuery, [adminId])
      .then(([result]) => {
        if (result.length <= 0) {
          res.status(404).send({
            status: false,
            message: "Fail to fetch expense category.",
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Expense Category is fetched succesfully.",
            data: result,
          });
          return;
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          status: false,
          message: "Error in Logging in. Please try after some time",
        });
      });
  } catch (err) {
    console.log("Error : ", err);
    sendResponseError(500, "Something wrong please try again");
    return;
  }
  // } else {
  //   console.log("here");
  //   res.status(400).send({
  //     status: false,
  //     message: "User is not admin. Feature is only for admin",
  //   });
  // }
};

const addExpenseCategory = async (req, res) => {
  const { categoryName, userId, adminId } = req.body;
  const currentDateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");

  const expenseCategoryNameExistQuery =
    "SELECT COUNT(*) as count FROM expenses_managment.expense_category WHERE category_name = ? and admin_id = ?";
  
  const expenseCategoryQuery =
    "INSERT INTO expenses_managment.expense_category (category_name,admin_id,created_at,modified_at) VALUE (?, ?, ?, ?)";

  try {
    // Start the transaction
    await connectDB.query("START TRANSACTION");

    // Check if the category name exists
    const [row] = await connectDB.query(expenseCategoryNameExistQuery, [
      categoryName,
      adminId,
    ]);

    const expenseCategoryNameExists = row[0].count > 0;

    if (expenseCategoryNameExists) {
      console.log("Expense Category Name already exists. Please choose another Name.");
      // Rollback the transaction
      await connectDB.query("ROLLBACK");
      throw new Error("Expense Category Name already exists");
    }

    // Insert the new category
    const userData = [
      categoryName,
      adminId,
      currentDateTime,
      currentDateTime,
    ];

    const [result] = await connectDB.query(expenseCategoryQuery, userData);

    if (result.length <= 0) {
      // Rollback the transaction
      await connectDB.query("ROLLBACK");
      res.status(404).send({
        status: false,
        message: "Expense Category is not added.",
      });
    } else {
      // Commit the transaction if both queries succeed
      await connectDB.query("COMMIT");
      res.status(200).send({
        status: true,
        message: "Expense Category added successfully.",
      });
    }
  } catch (err) {
    console.error(err);

    if (err.message === "Expense Category Name already exists") {
      res.status(500).send({
        status: false,
        message: "Expense Category Name already exists.",
      });
    } else {
      // Rollback the transaction in case of any other error
      await connectDB.query("ROLLBACK");
      sendResponseError(
        500,
        "Error in adding expense category. Error- " + err.message,
        res
      );
    }
  }
};

const updateExpenseCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { categoryName, user_id, admin_id } = req.body;
  const roleType = await incrementTransactionCount(user_id, admin_id, res);

  if (roleType === "admin") {
    try {
      // Start the transaction
      await connectDB.query("START TRANSACTION");

      // Check if the new category name already exists
      const expenseCategoryNameExistQuery =
        "SELECT COUNT(*) as count FROM expenses_managment.expense_category WHERE category_name = ? and admin_id = ?";
      const [expenseCategoryNameCheck] = await connectDB.query(
        expenseCategoryNameExistQuery,
        [categoryName, admin_id]
      );
      const expenseCategoryNameExists =
        expenseCategoryNameCheck[0].count > 0;

      if (expenseCategoryNameExists) {
        // Rollback the transaction
        await connectDB.query("ROLLBACK");
        return res.status(500).send({
          status: false,
          message: "Expense Category Name already exists.",
        });
      }

      // Update the expense category
      const expenseCategoryQuery =
        "UPDATE expenses_managment.expense_category SET category_name = ?, modified_at = NOW() WHERE id = ?";
      const [result] = await connectDB.query(expenseCategoryQuery, [
        categoryName,
        categoryId,
      ]);

      if (result.affectedRows > 0) {
        // Commit the transaction if both queries succeed
        await connectDB.query("COMMIT");
        return res.status(200).send({
          status: true,
          message: "Expense Category is updated successfully.",
        });
      } else {
        // Rollback the transaction
        await connectDB.query("ROLLBACK");
        return res.status(404).send({
          status: false,
          message: "Expense Category is not updated.",
        });
      }
    } catch (err) {
      // Rollback the transaction in case of an error
      await connectDB.query("ROLLBACK");
      sendResponseError(
        500,
        "Error in updating expense category. Error- " + err.message,
        res
      );
    }
  } else {
    res.status(400).send({
      status: false,
      message: "User is not admin. Feature is only for admin.",
    });
  }
};

const deleteExpenseCategory = (req, res, next) => {
  let categoryId = req.params.id;
  connectDB.query(
    "DELETE FROM expense_category WHERE  id= ?",
    [categoryId],
    (err, result, fields) => {
      if (err) {
        console.log(err);
        res.status(500).send({
          status: false,
          message: err.sqlMessage,
        });
      } else {
        res.status(200).send({ status: true, message: "Expense category deleted" });
      }
    }
  );
};

module.exports = {
  addExpenseCategory,
  updateExpenseCategory,
  getExpenseCategory,
  deleteExpenseCategory,
};
