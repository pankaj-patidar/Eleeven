const connectDB = require("../config/db");
const { format } = require("date-fns");

const {
  sendResponseError,
  incrementTransactionCount,
} = require("../middleware/middleware");

const getwallet = async (req, res) => {
  adminId = req.params.adminId;

  const getWalletsQuery =
    "SELECT wallet.id, wallet.admin_id as adminId, user_id as userId, first_name as firstName,\
    last_name as lastName, amount as amount, wallet.created_at as createdAt, wallet.modified_at as modifiedAt FROM wallet\
    LEFT JOIN user ON user.id = wallet.user_id where wallet.admin_id =?";
  try {
    connectDB
      .query(getWalletsQuery, [adminId])
      .then(([result]) => {
        if (result.length <= 0) {
          // return Promise.reject(new Error('Failed to delete expenses.'));
          res
            .status(500)
            .send({ status: false, message: "Failed to fetch wallet data." });
          // Handle error or inform the user that the email already exists
        } else {
          res.status(200).send({
            status: true,
            message: "Wallet data fetch succesfully.",
            data: result,
          });
        }
      })
      .catch((err) => {
        sendResponseError(
          500,
          "Error in fetching Wallet. Error- " + err.message,
          res
        );
      });
  } catch (err) {
    console.log(err);
    sendResponseError(500, "Something went wrong. Please try again");
  }
};

const updateWallet = async (req, res) => {
  try {
    const { amount, walletId, adminId } = req.body;

    // Begin the transaction
    await connectDB.query("START TRANSACTION");

    const walletData = [amount, walletId];
    const updateWalletQuery =
      "UPDATE expenses_managment.wallet SET amount = amount + ?, modified_at = NOW() WHERE id = ?";

    const [result] = await connectDB.query(updateWalletQuery, walletData);

    if (result.affectedRows <= 0) {
      // Rollback the transaction if the first query fails
      await connectDB.query("ROLLBACK");
      res.status(500).send({
        status: false,
        message: "Failed to update wallet data.",
      });
    } else {
      const adminWalletData = [amount, adminId];
      const updateAdminWalletQuery =
        "UPDATE expenses_managment.wallet SET amount = amount - ?, modified_at = NOW() WHERE user_id = ?";

      const [adminResult] = await connectDB.query(
        updateAdminWalletQuery,
        adminWalletData
      );

      console.log(adminResult);
      if (adminResult.affectedRows <= 0) {
        // Rollback the transaction if the second query fails
        await connectDB.query("ROLLBACK");
        res.status(500).send({
          status: false,
          message: "Failed to update admin wallet data.",
        });
      } else {
        // Commit the transaction if both queries succeed
        await connectDB.query("COMMIT");
        res.status(200).send({
          status: true,
          message: "Wallet data updated successfully.",
        });
      }
    }
  } catch (err) {
    console.error(err);
    sendResponseError(500, "Something went wrong. Please try again", res);
  }
};

const getwalletById = async (req, res) => {
  const walletId = req.params.id;

  const getWalletsQuery = "SELECT * FROM expenses_managment.wallet WHERE id=?";
  try {
    connectDB
      .query(getWalletsQuery, [walletId])
      .then(([result]) => {
        if (result.length <= 0) {
          // return Promise.reject(new Error('Failed to delete expenses.'));
          res
            .status(500)
            .send({ status: false, message: "Failed to fetch wallet data." });
          // Handle error or inform the user that the email already exists
        } else {
          res.status(200).send({
            status: true,
            message: "Wallet data fetch succesfully.",
            data: result,
          });
        }
      })
      .catch((err) => {
        sendResponseError(
          500,
          "Error in fetching Wallet. Error- " + err.message,
          res
        );
      });
  } catch (err) {
    console.log(err);
    sendResponseError(500, "Something went wrong. Please try again");
  }
};

module.exports = {
  getwallet,
  updateWallet,
  getwalletById,
};
