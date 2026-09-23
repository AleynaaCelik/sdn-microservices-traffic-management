const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:4003";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:4005";

// Kullanıcının siparişlerini listele
router.get("/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Siparişler getirilemedi", detail: err.message });
  }
});

// Tek sipariş getir
router.get("/order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: "Geçersiz sipariş ID", detail: err.message });
  }
});

// Sipariş oluştur — bu tek endpoint, Cart, Product ve Payment servislerini
// sırayla çağırır. Tezinizdeki "tek kullanıcı isteğinin birden fazla
// servisi tetiklediği" senaryonun tam karşılığı budur.
router.post("/", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId zorunludur" });
  }

  try {
    // 1) Sepeti çek
    const cartResponse = await axios.get(`${CART_SERVICE_URL}/api/cart/${userId}`);
    const items = cartResponse.data.items;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Sepet boş, sipariş oluşturulamaz" });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 2) Sipariş kaydını "pending" durumda oluştur
    let order = await Order.create({
      userId,
      items,
      totalAmount,
      status: "pending",
    });

    // 3) Her ürün için stok düş — Product Service'e ayrı ayrı çağrılar
    try {
      for (const item of items) {
        await axios.post(
          `${PRODUCT_SERVICE_URL}/api/products/${item.productId}/decrease-stock`,
          { quantity: item.quantity }
        );
      }
    } catch (stockErr) {
      order.status = "failed";
      await order.save();
      return res.status(409).json({
        error: "Stok düşürme başarısız, sipariş iptal edildi",
        detail: stockErr.response?.data?.error || stockErr.message,
        order,
      });
    }

    // 4) Ödeme al
    let paymentResult;
    try {
      const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/charge`, {
        amount: totalAmount,
        userId,
      });
      paymentResult = paymentResponse.data;
    } catch (paymentErr) {
      order.status = "failed";
      await order.save();
      return res.status(402).json({
        error: "Ödeme başarısız",
        detail: paymentErr.response?.data?.message || paymentErr.message,
        order,
      });
    }

    // 5) Sipariş durumunu güncelle
    order.status = "paid";
    order.transactionId = paymentResult.transactionId;
    await order.save();

    // 6) Sepeti temizle
    await axios.delete(`${CART_SERVICE_URL}/api/cart/${userId}/clear`);

    res.status(201).json({ message: "Sipariş başarıyla oluşturuldu", order });
  } catch (err) {
    res.status(500).json({ error: "Sipariş oluşturulamadı", detail: err.message });
  }
});

module.exports = router;
