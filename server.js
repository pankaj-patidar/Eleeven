require("dotenv").config();
const express = require("express");
const expenseRoutes = require("./src/routes/busStopsRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const expenseCategory = require("./src/routes/routeDetailsRoutes.js");
const walletRoutes = require("./src/routes/busRoutes.js");
const { connectDB, getDB } = require('./src/config/db.js');

const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

// Middleware to attach the database to each request
app.use((req, res, next) => {
    req.db = getDB();
    next();
});


app.get("/", (req, res) => {
  res.json({ message: "API running..." });
});

app.use("/api/expense", expenseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/expenseCategory", expenseCategory);
app.use("/api/wallet", walletRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
