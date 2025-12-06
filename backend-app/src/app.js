// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { prisma } = require("./config/db"); // 👈 make sure this line exists

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FairShare Backend is running 👋" });
});

// TEMP - for checking DB/Prisma
app.get("/test-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users); // [] initially
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "DB error (check DATABASE_URL or Prisma setup)",
      error: err.message,
    });
  }
});

module.exports = app;
