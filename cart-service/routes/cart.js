const express = require("express");
const router = express.Router();
const axios = require("axios");
const { redisClient } = require("../utils/redisClient");

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";

function cartKey(userId) {
  return `cart:${userId}`;
}

async function getCart(userId) {
  const raw = await redisClient.get(cartKey(userId));
  return raw ? JSON.parse(raw) : [];
}

async function saveCart(userId, items) {
  await redisClient.set(cartKey(userId), JSON.stringify(items));
}

// Sepeti getir
router.get("/:userId", async (req, res) => {
  try {
    const items = await getCart(req.params.userId);
    res.json({ userId: req.params.userId, items });
  } catch (err) {
    res.status(500).json({ error: "Sepet getirilemedi", detail: err.message });
  }
});

// Sepete ürün ekle — Product Service'e sorup ürünün geçerliliğini ve
// güncel fiyatını teyit ediyoruz (servisler arası çağrı burada)
router.post("/:userId/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "productId ve geçerli bir quantity gerekli" });
    }

    let product;
    try {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
      product = response.data;
    } catch (err) {
      return res.status(404).json({ error: "Ürün Product Service üzerinde bulunamadı" });
    }

    if (product.stock < quantity) {
      return res.status(409).json({ error: "Yetersiz stok", availableStock: product.stock });
    }

    const items = await getCart(req.params.userId);
    const existing = items.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    await saveCart(req.params.userId, items);
    res.status(201).json({ userId: req.params.userId, items });
  } catch (err) {
    res.status(500).json({ error: "Sepete eklenemedi", detail: err.message });
  }
});

// Sepetten ürün çıkar
router.post("/:userId/remove", async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId gerekli" });
    }

    let items = await getCart(req.params.userId);
    items = items.filter((item) => item.productId !== productId);

    await saveCart(req.params.userId, items);
    res.json({ userId: req.params.userId, items });
  } catch (err) {
    res.status(500).json({ error: "Sepetten çıkarılamadı", detail: err.message });
  }
});

// Sepeti tamamen temizle — Order Service, sipariş tamamlandığında bunu çağıracak
router.delete("/:userId/clear", async (req, res) => {
  try {
    await redisClient.del(cartKey(req.params.userId));
    res.json({ message: "Sepet temizlendi", userId: req.params.userId });
  } catch (err) {
    res.status(500).json({ error: "Sepet temizlenemedi", detail: err.message });
  }
});

module.exports = router;
