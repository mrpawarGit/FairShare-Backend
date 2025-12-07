const router = require("express").Router();
const { authMiddleware } = require("../../middlewares/auth");
const { getMyBalances, getGroupBalances } = require("./balance.controller");

router.use(authMiddleware);

// Global balances for logged-in user
router.get("/me", getMyBalances);

// Group-level balances
router.get("/group/:groupId", getGroupBalances);

module.exports = router;
