const express = require("express");
const router = express.Router();
const Plant = require("../models/Plant");
const multer = require("multer");
const path = require("path");
const xlsx = require("xlsx");
const fs = require("fs");

// 🖼️ Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder where images will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});
const upload = multer({ storage });

// 🌿 Get all plants (with full image URL)
router.get("/", async (req, res) => {
  try {
    const plants = await Plant.find().sort({ createdAt: -1 });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const withFullUrl = plants.map((plant) => ({
      ...plant.toJSON(),
      image: plant.image ? `${baseUrl}${plant.image}` : null,
    }));

    res.status(200).json(withFullUrl);
  } catch (err) {
    console.error("❌ Error fetching plants:", err);
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// 🌱 Get one plant by ID
router.get("/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({
      ...plant.toJSON(),
      image: plant.image ? `${baseUrl}${plant.image}` : null,
    });
  } catch (err) {
    console.error("❌ Error fetching plant:", err);
    res.status(500).json({ error: "Failed to fetch plant" });
  }
});

// ➕ Add new plant (with image)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      plantName,
      botanicalName,
      description,
      price,
      stock,
      size,
      light,
      water,
      category,
    } = req.body;

    if (!plantName || !price) {
      return res
        .status(400)
        .json({ error: "Plant name and price are required" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newPlant = await Plant.create({
      plantName,
      botanicalName,
      description,
      price,
      stock,
      size,
      light,
      water,
      category,
      image: imagePath,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fullPlant = {
      ...newPlant.toJSON(),
      image: newPlant.image ? `${baseUrl}${newPlant.image}` : null,
    };

    res.status(201).json(fullPlant);
  } catch (err) {
    console.error("❌ Error creating plant:", err);
    res.status(400).json({ error: "Error creating plant" });
  }
});

// ✏️ Update plant by ID (with optional image)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    const {
      plantName,
      botanicalName,
      description,
      price,
      stock,
      size,
      light,
      water,
      category,
    } = req.body;

    const imagePath = req.file ? `/uploads/${req.file.filename}` : plant.image;

    Object.assign(plant, {
      plantName,
      botanicalName,
      description,
      price,
      stock,
      size,
      light,
      water,
      category,
      image: imagePath,
    });
    await plant.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({
      ...plant.toJSON(),
      image: plant.image ? `${baseUrl}${plant.image}` : null,
    });
  } catch (err) {
    console.error("❌ Error updating plant:", err);
    res.status(400).json({ error: "Error updating plant" });
  }
});

// 🗑️ Delete plant by ID
router.delete("/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    await plant.deleteOne();
    res.json({ message: "Plant deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting plant:", err);
    res.status(500).json({ error: "Failed to delete plant" });
  }
});

// 📥 Bulk import plants from Excel
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No Excel file uploaded" });
    }

    let mapping = {};
    if (req.body.mapping) {
      try {
        mapping = JSON.parse(req.body.mapping);
      } catch (e) {
        console.error("Failed to parse mapping JSON:", e);
      }
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const plantsToCreate = [];

    for (const row of rows) {
      let name = "";
      let price = 0;
      let stock = 0;
      let botanicalName = "";
      let description = "";
      let category = "";
      let size = "";
      let light = "";
      let water = "";
      let status = "Active";

      if (mapping && Object.keys(mapping).length > 0) {
        if (mapping.plantName && row[mapping.plantName] !== undefined) name = String(row[mapping.plantName]).trim();
        if (mapping.price && row[mapping.price] !== undefined) price = parseFloat(row[mapping.price]) || 0;
        if (mapping.stock && row[mapping.stock] !== undefined) stock = parseInt(row[mapping.stock], 10) || 0;
        if (mapping.botanicalName && row[mapping.botanicalName] !== undefined) botanicalName = String(row[mapping.botanicalName]).trim();
        if (mapping.description && row[mapping.description] !== undefined) description = String(row[mapping.description]).trim();
        if (mapping.category && row[mapping.category] !== undefined) category = String(row[mapping.category]).trim();
        if (mapping.size && row[mapping.size] !== undefined) size = String(row[mapping.size]).trim();
        if (mapping.light && row[mapping.light] !== undefined) light = String(row[mapping.light]).trim();
        if (mapping.water && row[mapping.water] !== undefined) water = String(row[mapping.water]).trim();
      } else {
        // Fallback to original auto-mapping clean key logic
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase().replace(/[\s\._-]/g, "");

          if (cleanKey === "plantname" || cleanKey === "name" || cleanKey === "particulars") {
            name = String(row[key]).trim();
          } else if (cleanKey === "price" || cleanKey === "rate" || cleanKey === "price(rs)" || cleanKey === "price(rs.)") {
            price = parseFloat(row[key]) || 0;
          } else if (cleanKey === "stock" || cleanKey === "quantity" || cleanKey === "qty") {
            stock = parseInt(row[key], 10) || 0;
          } else if (cleanKey === "botanicalname" || cleanKey === "botanical") {
            botanicalName = String(row[key]).trim();
          } else if (cleanKey === "description" || cleanKey === "desc") {
            description = String(row[key]).trim();
          } else if (cleanKey === "category") {
            category = String(row[key]).trim();
          } else if (cleanKey === "size") {
            size = String(row[key]).trim();
          } else if (cleanKey === "light" || cleanKey === "sunlight") {
            light = String(row[key]).trim();
          } else if (cleanKey === "water" || cleanKey === "watering") {
            water = String(row[key]).trim();
          } else if (cleanKey === "status") {
            const val = String(row[key]).trim().toLowerCase();
            status = val === "inactive" ? "Inactive" : "Active";
          }
        }
      }

      if (!name) continue;

      plantsToCreate.push({
        plantName: name,
        botanicalName,
        description,
        price,
        stock,
        size,
        light,
        water,
        category,
        status,
      });
    }

    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete temp file:", err);
    }

    if (plantsToCreate.length === 0) {
      return res.status(400).json({ error: "No valid plants found in Excel file" });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const plantData of plantsToCreate) {
      const existingPlant = await Plant.findOne({ plantName: plantData.plantName });
      if (existingPlant) {
        existingPlant.price = plantData.price;
        existingPlant.stock += plantData.stock;
        if (plantData.botanicalName) existingPlant.botanicalName = plantData.botanicalName;
        if (plantData.category) existingPlant.category = plantData.category;
        if (plantData.description) existingPlant.description = plantData.description;
        if (plantData.size) existingPlant.size = plantData.size;
        if (plantData.light) existingPlant.light = plantData.light;
        if (plantData.water) existingPlant.water = plantData.water;
        await existingPlant.save();
        updatedCount++;
      } else {
        await Plant.create(plantData);
        createdCount++;
      }
    }

    res.status(200).json({
      message: `Plants imported successfully. Created: ${createdCount}, Updated: ${updatedCount}`,
      created: createdCount,
      updated: updatedCount,
    });
  } catch (err) {
    console.error("❌ Excel Import Error:", err);
    res.status(500).json({ error: "Failed to parse Excel file" });
  }
});

// 🖼️ Serve images statically
router.use("/uploads", express.static("uploads"));

module.exports = router;
