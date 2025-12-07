const { prisma } = require("../../config/db");

// Helper to check group membership
async function isGroupMember(groupId, userId) {
  return prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
}

// CREATE EXPENSE
async function createExpense(req, res) {
  try {
    const { description, amount, splitType, groupId, participants } = req.body;
    const currentUserId = req.user.id;

    if (!description || !amount || !splitType || !participants?.length) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // If groupId provided → validate membership
    if (groupId) {
      const member = await isGroupMember(groupId, currentUserId);
      if (!member)
        return res.status(403).json({ message: "Not in this group" });
    }

    // VALIDATE SPLITS
    let shares = [];

    if (splitType === "EQUAL") {
      const equalShare = Number(amount) / participants.length;
      shares = participants.map((p) => ({
        userId: p.userId,
        share: equalShare,
      }));
    } else if (splitType === "EXACT") {
      const total = participants.reduce((sum, p) => sum + Number(p.share), 0);
      if (total !== Number(amount))
        return res
          .status(400)
          .json({ message: "EXACT split does not sum correctly" });

      shares = participants.map((p) => ({
        userId: p.userId,
        share: Number(p.share),
      }));
    } else if (splitType === "PERCENT") {
      const totalPercent = participants.reduce(
        (s, p) => s + Number(p.percent),
        0
      );
      if (totalPercent !== 100)
        return res.status(400).json({ message: "PERCENT must total 100" });

      shares = participants.map((p) => ({
        userId: p.userId,
        share: (Number(amount) * Number(p.percent)) / 100,
      }));
    }

    // CREATE EXPENSE + PARTICIPANTS
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        splitType,
        groupId,
        paidById: currentUserId,
        createdById: currentUserId,
        participants: {
          create: shares,
        },
      },
      include: {
        participants: true,
      },
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("createExpense error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// GET EXPENSES IN A GROUP
async function getGroupExpenses(req, res) {
  try {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user.id;

    const member = await isGroupMember(groupId, currentUserId);
    if (!member) return res.status(403).json({ message: "Not in this group" });

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        participants: true,
        paidBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(expenses);
  } catch (err) {
    console.error("getGroupExpenses error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// GET SINGLE EXPENSE
async function getExpenseById(req, res) {
  try {
    const expenseId = parseInt(req.params.expenseId);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        participants: true,
        paidBy: true,
        createdBy: true,
      },
    });

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.json(expense);
  } catch (err) {
    console.error("getExpenseById error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// UPDATE EXPENSE
async function updateExpense(req, res) {
  try {
    const expenseId = parseInt(req.params.expenseId);
    const currentUserId = req.user.id;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) return res.status(404).json({ message: "Not found" });

    // Only creator OR payer can edit
    if (
      expense.createdById !== currentUserId &&
      expense.paidById !== currentUserId
    )
      return res.status(403).json({ message: "Not allowed" });

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: req.body,
    });

    res.json(updated);
  } catch (err) {
    console.error("updateExpense error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ===============================
// DELETE EXPENSE
// ===============================
async function deleteExpense(req, res) {
  try {
    const expenseId = parseInt(req.params.expenseId);
    const currentUserId = req.user.id;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) return res.status(404).json({ message: "Not found" });

    if (
      expense.createdById !== currentUserId &&
      expense.paidById !== currentUserId
    )
      return res.status(403).json({ message: "Not allowed" });

    await prisma.expenseParticipant.deleteMany({ where: { expenseId } });
    await prisma.expense.delete({ where: { id: expenseId } });

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("deleteExpense error", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
