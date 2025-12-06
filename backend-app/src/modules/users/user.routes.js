const express = require("express");
const { authMiddleware } = require("../../middlewares/auth");
const { getMe } = require("./user.controller");

const router = express.Router();

// GET /api/users/me
router.get("/me", authMiddleware, getMe);

module.exports = router;
