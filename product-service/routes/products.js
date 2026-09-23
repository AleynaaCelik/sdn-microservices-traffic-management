const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Tüm ürünleri listele (opsiyonel kategori filtresi)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Ürünler getirilemedi", detail: err.message });
  }
});

// Tek ürün getir
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Geçersiz ürün ID", detail: err.message });
  }
});

// Yeni ürün oluştur
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: "Ürün oluşturulamadı", detail: err.message });
  }
});

// Ürün güncelle
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Ürün güncellenemedi", detail: err.message });
  }
});

// Ürün sil
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
    res.json({ message: "Ürün silindi" });
  } catch (err) {
    res.status(400).json({ error: "Ürün silinemedi", detail: err.message });
  }
});

// Stok düşürme — Order Service tarafından çağrılır (servisler arası çağrı)
router.post("/:id/decrease-stock", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Geçersiz miktar" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
    if (product.stock < quantity) {
      return res.status(409).json({ error: "Yetersiz stok" });
    }
    product.stock -= quantity;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Stok güncellenemedi", detail: err.message });
  }
});

module.exports = router;
