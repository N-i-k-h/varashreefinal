const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const exists = await User.findOne({ where: { email } });

    if (exists) return res.status(400).json({ error: "Email already exists" });

    const user = await User.create({ name, email, password });

    res.json({
      message: "Registered successfully",
      user: { id: user.id, name: user.name, email: user.email },
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    // check password using instance method
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
