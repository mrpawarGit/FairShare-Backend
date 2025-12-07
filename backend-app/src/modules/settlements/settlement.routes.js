const router = require("express").Router();
const { authMiddleware } = require("../../middlewares/auth");
const {
  createSettlement,
  getGroupSettlements,
} = require("./settlement.controller");

router.use(authMiddleware);

// Record a settlement (payment)
router.post("/", createSettlement);

// View settlement history of a group
router.get("/group/:groupId", getGroupSettlements);

module.exports = router;
