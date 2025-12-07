const { prisma } = require("../../config/db");

function addBalance(balances, from, to, amount) {
  if (from === to) return;
  balances[from] ??= {};
  balances[from][to] = (balances[from][to] || 0) + amount;
}

// GLOBAL BALANCES (ME)
async function getMyBalances(req, res) {
  try {
    const userId = req.user.id;

    const expenses = await prisma.expense.findMany({
      include: { participants: true },
    });

    const settlements = await prisma.settlement.findMany();

    const balances = {};

    // EXPENSE LOGIC
    for (const exp of expenses) {
      for (const p of exp.participants) {
        if (p.userId !== exp.paidById) {
          addBalance(balances, p.userId, exp.paidById, Number(p.share));
        }
      }
    }

    // SETTLEMENT LOGIC
    for (const s of settlements) {
      addBalance(balances, s.paidById, s.paidToId, -Number(s.amount));
    }

    res.json(balances[userId] || {});
  } catch (err) {
    console.error("getMyBalances error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// GROUP BALANCES
async function getGroupBalances(req, res) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;

    // Ensure membership
    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (!member) return res.status(403).json({ message: "Not a group member" });

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { participants: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
    });

    const balances = {};

    // Expense balances
    for (const exp of expenses) {
      for (const p of exp.participants) {
        if (p.userId !== exp.paidById) {
          addBalance(balances, p.userId, exp.paidById, Number(p.share));
        }
      }
    }

    // Settlement balances
    for (const s of settlements) {
      addBalance(balances, s.paidById, s.paidToId, -Number(s.amount));
    }

    res.json(balances);
  } catch (err) {
    console.error("getGroupBalances error", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getMyBalances,
  getGroupBalances,
};
