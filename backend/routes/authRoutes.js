const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// 🔐 Create JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "nursery_secret", {
    expiresIn: "1d",
  });

// ================================
//         REGISTER USER
// ================================

// 🛠️ EMERGENCY SETUP ROUTE (Run this if Admin is missing)
router.get("/setup", async (req, res) => {
  try {
    const email = "admin@nursery.com";
    let user = await User.findOne({ email });

    if (user) {
      return res.json({ message: "✅ Admin already exists", email: user.email });
    }

    user = await User.create({
      name: "Admin User",
      email: email,
      password: "admin", // Hooks will hash this
    });

    res.json({ message: "🎉 Admin Created Successfully!", email: user.email, password: "admin" });
  } catch (err) {
    console.error("SETUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ error: "User already exists" });

    // 🔥 DO NOT HASH HERE — User model hashes automatically
    const user = await User.create({
      name,
      email,
      password, // raw password → model will hash it
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ================================
//           LOGIN USER
// ================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "User not found" });

    // Compare password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid password" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Catch-all route
router.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = router;
