const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Simple health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FairShare Backend is running" });
});

module.exports = app;
