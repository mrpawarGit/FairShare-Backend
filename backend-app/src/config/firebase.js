const admin = require("firebase-admin");
const serviceAccount = require("../../fairshare-backend-firebase-adminsdk-fbsvc-e6bb7d7196.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

module.exports = { admin, auth };
