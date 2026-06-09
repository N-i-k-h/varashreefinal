const express = require("express");
const router = express.Router();
const Plant = require("../models/Plant"); // Sequelize model

// ✅ GET all plants
router.get("/", async (req, res) => {
  try {
    const plants = await Plant.find().sort({ createdAt: -1 });
    res.json(plants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// ✅ GET single plant by ID
router.get("/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });
    res.json(plant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving plant" });
  }
});

// ✅ CREATE a new plant
router.post("/", async (req, res) => {
  try {
    const newPlant = await Plant.create(req.body);
    res.status(201).json(newPlant);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create plant" });
  }
});

// ✅ UPDATE an existing plant
router.put("/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    Object.assign(plant, req.body);
    await plant.save();
    res.json(plant);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update plant" });
  }
});

// ✅ DELETE a plant
router.delete("/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    await plant.deleteOne();
    res.json({ message: "Plant deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete plant" });
  }
});

module.exports = router;
