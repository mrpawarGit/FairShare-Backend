const router = require("express").Router();
const { authMiddleware } = require("../../middlewares/auth");
const {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require("./expense.controller");

router.use(authMiddleware);

// Create an expense
router.post("/", createExpense);

// Get expenses inside a group
router.get("/group/:groupId", getGroupExpenses);

// Get single expense
router.get("/:expenseId", getExpenseById);

// Update expense (creator or payer only)
router.put("/:expenseId", updateExpense);

// Delete expense
router.delete("/:expenseId", deleteExpense);

module.exports = router;
