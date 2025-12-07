const router = require("express").Router();
const { authMiddleware } = require("../../middlewares/auth");
const { simplifyGlobal, simplifyGroup } = require("./simplify.controller");

router.use(authMiddleware);

// Global debt simplification
router.get("/simplified", simplifyGlobal);

// Group-level debt simplification
router.get("/simplified/group/:groupId", simplifyGroup);

module.exports = router;
