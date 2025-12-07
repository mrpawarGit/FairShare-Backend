const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { prisma } = require("./config/db");

const userRoutes = require("./modules/users/user.routes");
const groupRoutes = require("./modules/groups/group.routes");
const expenseRoutes = require("./modules/expenses/expense.routes");
const balanceRoutes = require("./modules/balances/balance.routes");
const simplifyRoutes = require("./modules/balances/simplify.routes");
const settlementRoutes = require("./modules/settlements/settlement.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FairShare Backend is running 👋" });
});

app.get("/test-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "DB error (check DATABASE_URL or Prisma setup)",
      error: err.message,
    });
  }
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/balances", balanceRoutes);
app.use("/api/balances", simplifyRoutes);
app.use("/api/settlements", settlementRoutes);

module.exports = app;
