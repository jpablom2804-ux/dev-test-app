const express = require("express");

const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/auth");
const loginLimiter = require("../middleware/loginLimiter");

const router = express.Router();

router.post("/login", loginLimiter, authController.login);
router.get("/me", authenticateToken, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
