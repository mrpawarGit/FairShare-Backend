const { prisma } = require("../../config/db");

// CREATE SETTLEMENT
// POST /api/settlements
async function createSettlement(req, res) {
  try {
    const paidById = req.user.id;
    const { paidToId, amount, groupId } = req.body;

    if (!paidToId || !amount) {
      return res
        .status(400)
        .json({ message: "paidToId and amount are required" });
    }

    if (paidById === paidToId) {
      return res.status(400).json({ message: "Cannot settle with yourself" });
    }

    // If group settlement → validate both users are group members
    if (groupId) {
      const memberships = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { in: [paidById, paidToId] },
        },
      });

      if (memberships.length !== 2) {
        return res.status(403).json({
          message: "Both users must be members of the group",
        });
      }
    }

    const settlement = await prisma.settlement.create({
      data: {
        paidById,
        paidToId,
        amount,
        groupId: groupId || null,
      },
    });

    res.status(201).json(settlement);
  } catch (err) {
    console.error("createSettlement error", err);
    res.status(500).json({ message: "Server error" });
  }
}

// GET GROUP SETTLEMENT HISTORY
// GET /api/settlements/group/:groupId
async function getGroupSettlements(req, res) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;

    // Ensure requester is group member
    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!member) {
      return res.status(403).json({ message: "Not a group member" });
    }

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        paidTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(settlements);
  } catch (err) {
    console.error("getGroupSettlements error", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createSettlement,
  getGroupSettlements,
};
