const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Product = require("../models/admin/product");
const User = require("../models/user/users");
const Order = require("../models/user/order"); // Added Order model
const { isSeller, authenticateToken } = require("../middlewares/middleware");

const JWT_SECRET = process.env.JWT_SECRET || "secretKey";

// Upload directory: use /tmp in serverless (Vercel) and a local uploads folder otherwise
const isServerless = !!process.env.VERCEL;
const uploadDir = isServerless
  ? "/tmp/uploads"
  : path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn("⚠️ Could not create upload directory:", uploadDir, err.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|webp|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error("Only images are allowed!"));
  },
});

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role?.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = user;
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Get all products (public) with seller information
router.get("/all", async (req, res) => {
  try {
    const products = await Product.find({
      status: "active",
      seller_id: { $ne: null }
    })
      .populate('seller_id', 'name username') // Populate seller info: name and username
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
  }
});

// Get seller's own products
router.get("/my-products", isSeller, async (req, res) => {
  try {
    const products = await Product.find({ seller_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error fetching my products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller_id', 'name username');
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch product", error: error.message });
  }
});

// Create product (seller only)
router.post("/create", isSeller, upload.array("images", 5), async (req, res) => {
  try {
    const {
      name, description, price, stock, category,
      wasteType, wasteQuantity, productOutputQuantity, unit,
      ecoPointsEligibility, ecoCertification
    } = req.body;

    if (!name || !price || stock === undefined) {
      return res.status(400).json({ success: false, message: "Name, price, and stock are required" });
    }

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `uploads/${file.filename}`);
    }

    // Use first image as main image for backward compatibility OR req.body.image if passed differently
    let mainImage = imagePaths.length > 0 ? imagePaths[0] : "";

    const product = new Product({
      name,
      description: description || "",
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || "",
      image: mainImage,
      images: imagePaths,
      // New Fields
      wasteType: wasteType || "",
      wasteQuantity: parseFloat(wasteQuantity) || 0,
      productOutputQuantity: parseFloat(productOutputQuantity) || 0,
      unit: unit || "pieces",
      ecoPointsEligibility: ecoPointsEligibility || "No",
      ecoCertification: ecoCertification || "None",

      seller_id: req.user._id,
      status: "active"
    });

    await product.save();
    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error) {
    console.error("Error creating product:", error);
    // Cleanup files if error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(path.join(uploadDir, file.filename))) {
          fs.unlinkSync(path.join(uploadDir, file.filename));
        }
      });
    }
    res.status(500).json({ success: false, message: "Failed to create product", error: error.message });
  }
});

// Update product (seller can only update their own products)
router.put("/:id", isSeller, upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, price, stock, category, status,
      wasteType, wasteQuantity, productOutputQuantity, unit,
      ecoPointsEligibility, ecoCertification
    } = req.body;

    // Check if product belongs to the seller
    const product = await Product.findOne({ _id: id, seller_id: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or you don't have permission to edit it" });
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock);
    if (category !== undefined) product.category = category;
    if (status) product.status = status;

    // Update new fields
    if (wasteType !== undefined) product.wasteType = wasteType;
    if (wasteQuantity !== undefined) product.wasteQuantity = parseFloat(wasteQuantity);
    if (productOutputQuantity !== undefined) product.productOutputQuantity = parseFloat(productOutputQuantity);
    if (unit !== undefined) product.unit = unit;
    if (ecoPointsEligibility !== undefined) product.ecoPointsEligibility = ecoPointsEligibility;
    if (ecoCertification !== undefined) product.ecoCertification = ecoCertification;

    // Handle Image Updates
    // Note: This logic APPENDS or REPLACES. For simplicity, if new images are sent, we replace the gallery.
    // In a more complex app, we might want to keep old ones.
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => `uploads/${file.filename}`);

      // Delete old images if replacing? (Optional, skipping for safety/history or complex logic)
      // For this implementation, we'll replace the text fields properly.

      product.images = newImagePaths;
      product.image = newImagePaths[0]; // Update main thumbnail
    }

    product.updatedAt = Date.now();
    await product.save();
    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, message: "Failed to update product", error: error.message });
  }
});

// Delete product (seller can only delete their own products)
router.delete("/:id", isSeller, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product belongs to the seller
    const product = await Product.findOne({ _id: id, seller_id: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or you don't have permission to delete it" });
    }

    if (product.image && fs.existsSync(path.join(__dirname, "../", product.image))) {
      fs.unlinkSync(path.join(__dirname, "../", product.image));
    }
    await Product.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Failed to delete product", error: error.message });
  }
});

// Create Product Review
router.post("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;

    // Verify if the user has purchased the product
    const hasBought = await Order.findOne({
      userId: userId,
      "items.productId": productId,
      status: { $ne: "cancelled" } // Can review if order is not cancelled
    });

    if (!hasBought) {
      return res.status(403).json({ success: false, message: "You can only review products you have purchased." });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: "Product already reviewed" });
    }

    const review = {
      name: req.user.name || req.user.username,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: "Review added" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ success: false, message: "Failed to add review", error: error.message });
  }
});

module.exports = router;

