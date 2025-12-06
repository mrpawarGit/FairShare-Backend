const { auth } = require("../config/firebase");
const { prisma } = require("../config/db");

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Missing or invalid Authorization header" });
    }

    const idToken = header.split(" ")[1];

    // Verify Firebase ID token
    const decoded = await auth.verifyIdToken(idToken);

    const firebaseUid = decoded.uid;
    const email = decoded.email || null;
    const name = decoded.name || null;

    // Find / create user
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          name,
        },
      });
    } else {
      // email/name in sync
      const needsUpdate = user.email !== email || user.name !== name;
      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email, name },
        });
      }
    }

    // Attach to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware };
