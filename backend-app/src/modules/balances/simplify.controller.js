const { prisma } = require("../../config/db");

function addBalance(map, from, to, amount) {
  if (from === to) return;
  map[from] ??= {};
  map[from][to] = (map[from][to] || 0) + amount;
}

function calculateNetBalances(balances) {
  const net = {};

  for (const from in balances) {
    for (const to in balances[from]) {
      const amt = balances[from][to];
      net[from] = (net[from] || 0) - amt;
      net[to] = (net[to] || 0) + amt;
    }
  }
  return net;
}

function simplify(netBalances) {
  const debtors = [];
  const creditors = [];

  for (const userId in netBalances) {
    const amt = netBalances[userId];
    if (amt < 0) debtors.push({ userId, amt: -amt });
    else if (amt > 0) creditors.push({ userId, amt });
  }

  const result = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const settleAmt = Math.min(d.amt, c.amt);

    result.push({
      from: Number(d.userId),
      to: Number(c.userId),
      amount: Number(settleAmt.toFixed(2)),
    });

    d.amt -= settleAmt;
    c.amt -= settleAmt;

    if (d.amt === 0) i++;
    if (c.amt === 0) j++;
  }

  return result;
}

// GLOBAL SIMPLIFICATION
async function simplifyGlobal(req, res) {
  try {
    const expenses = await prisma.expense.findMany({
      include: { participants: true },
    });

    const settlements = await prisma.settlement.findMany();

    const balances = {};

    // Expenses
    expenses.forEach((exp) => {
      exp.participants.forEach((p) => {
        if (p.userId !== exp.paidById) {
          addBalance(balances, p.userId, exp.paidById, Number(p.share));
        }
      });
    });

    // Settlements
    settlements.forEach((s) => {
      addBalance(balances, s.paidById, s.paidToId, -Number(s.amount));
    });

    const netBalances = calculateNetBalances(balances);
    const simplified = simplify(netBalances);

    res.json(simplified);
  } catch (err) {
    console.error("simplifyGlobal error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// GROUP SIMPLIFICATION
async function simplifyGroup(req, res) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;

    // Validate membership
    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (!member) return res.status(403).json({ message: "Not group member" });

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { participants: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
    });

    const balances = {};

    expenses.forEach((exp) => {
      exp.participants.forEach((p) => {
        if (p.userId !== exp.paidById) {
          addBalance(balances, p.userId, exp.paidById, Number(p.share));
        }
      });
    });

    settlements.forEach((s) => {
      addBalance(balances, s.paidById, s.paidToId, -Number(s.amount));
    });

    const netBalances = calculateNetBalances(balances);
    const simplified = simplify(netBalances);

    res.json(simplified);
  } catch (err) {
    console.error("simplifyGroup error", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { simplifyGlobal, simplifyGroup };
