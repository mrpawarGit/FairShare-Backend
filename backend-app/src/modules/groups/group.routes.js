const express = require("express");
const { authMiddleware } = require("../../middlewares/auth");
const {
  createGroup,
  getMyGroups,
  getGroupById,
  getGroupMembers,
  addMemberToGroup,
  removeMemberFromGroup,
} = require("./group.controller");

const router = express.Router();

// All group routes are protected
router.use(authMiddleware);

// POST /api/groups
router.post("/", createGroup);

// GET /api/groups
router.get("/", getMyGroups);

// GET /api/groups/:groupId
router.get("/:groupId", getGroupById);

// GET /api/groups/:groupId/members
router.get("/:groupId/members", getGroupMembers);

// POST /api/groups/:groupId/members
router.post("/:groupId/members", addMemberToGroup);

// DELETE /api/groups/:groupId/members/:userId
router.delete("/:groupId/members/:userId", removeMemberFromGroup);

module.exports = router;
