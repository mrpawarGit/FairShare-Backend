const { prisma } = require("../../config/db");

// parse groupId from params
function parseId(value) {
  const id = parseInt(value, 10);
  if (isNaN(id)) return null;
  return id;
}

// check if current user is member and return their GroupMember record
async function getCurrentUserMembership(groupId, userId) {
  return prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
    },
  });
}

// POST /api/groups
// body: { name, description? }
async function createGroup(req, res) {
  try {
    const { name, description } = req.body;
    const currentUserId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description || null,
        createdById: currentUserId,
        members: {
          create: {
            userId: currentUserId,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    res.status(201).json(group);
  } catch (err) {
    console.error("createGroup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/groups
// list groups where current user is a member
async function getMyGroups(req, res) {
  try {
    const currentUserId = req.user.id;

    const memberships = await prisma.groupMember.findMany({
      where: { userId: currentUserId },
      include: {
        group: true,
      },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      createdById: m.group.createdById,
      role: m.role,
      joinedAt: m.createdAt,
    }));

    res.json(groups);
  } catch (err) {
    console.error("getMyGroups error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/groups/:groupId
async function getGroupById(req, res) {
  try {
    const currentUserId = req.user.id;
    const groupId = parseId(req.params.groupId);

    if (!groupId) {
      return res.status(400).json({ message: "Invalid groupId" });
    }

    // ensure user is member
    const membership = await getCurrentUserMembership(groupId, currentUserId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    console.error("getGroupById error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/groups/:groupId/members
async function getGroupMembers(req, res) {
  try {
    const currentUserId = req.user.id;
    const groupId = parseId(req.params.groupId);

    if (!groupId) {
      return res.status(400).json({ message: "Invalid groupId" });
    }

    const membership = await getCurrentUserMembership(groupId, currentUserId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.json(members);
  } catch (err) {
    console.error("getGroupMembers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/groups/:groupId/members
async function addMemberToGroup(req, res) {
  try {
    const currentUserId = req.user.id;
    const groupId = parseId(req.params.groupId);
    const { userId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: "Invalid groupId" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const targetUserId = parseInt(userId, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: "userId must be a number" });
    }

    // check current user is admin
    const membership = await getCurrentUserMembership(groupId, currentUserId);
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }
    if (membership.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // ensure target user exists
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return res.status(404).json({ message: "User to be added not found" });
    }

    // add membership
    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUserId,
        role: "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(newMember);
  } catch (err) {
    console.error("addMemberToGroup error:", err);
    if (err.code === "P2002") {
      // unique constraint - already member
      return res
        .status(400)
        .json({ message: "User is already a member of this group" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/groups/:groupId/members/:userId
async function removeMemberFromGroup(req, res) {
  try {
    const currentUserId = req.user.id;
    const groupId = parseId(req.params.groupId);
    const targetUserId = parseId(req.params.userId);

    if (!groupId || !targetUserId) {
      return res.status(400).json({ message: "Invalid groupId or userId" });
    }

    // Check current users membership and role
    const currentMembership = await getCurrentUserMembership(
      groupId,
      currentUserId
    );
    if (!currentMembership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }
    if (currentMembership.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only admins can remove members" });
    }

    // Check target membership
    const targetMembership = await getCurrentUserMembership(
      groupId,
      targetUserId
    );
    if (!targetMembership) {
      return res
        .status(404)
        .json({ message: "User is not a member of this group" });
    }

    await prisma.groupMember.delete({
      where: { id: targetMembership.id },
    });

    res.json({ message: "Member removed from group" });
  } catch (err) {
    console.error("removeMemberFromGroup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  getGroupMembers,
  addMemberToGroup,
  removeMemberFromGroup,
};
