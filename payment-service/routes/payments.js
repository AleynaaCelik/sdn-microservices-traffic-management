const express = require("express");
const router = express.Router();

// Gerçek bir ödeme sağlayıcısı yok — burada amaç sadece Order Service'in
// bu servise ağ üzerinden istek atması ve gecikmeli bir yanıt alması.
// Yapay bir işlem süresi ekliyoruz (100-500ms), bu SDN/izleme tarafında
// gerçekçi bir gecikme dağılımı görmenizi sağlar.
router.post("/charge", async (req, res) => {
  const { amount, userId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Geçersiz tutar" });
  }

  const simulatedDelayMs = 100 + Math.random() * 400;

  await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs));

  // %95 ihtimalle başarılı, %5 ihtimalle reddedilmiş ödeme simüle ediyoruz
  const isSuccessful = Math.random() > 0.05;

  if (!isSuccessful) {
    return res.status(402).json({
      status: "declined",
      message: "Ödeme reddedildi (simülasyon)",
    });
  }

  res.json({
    status: "approved",
    transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    amount,
    userId: userId || null,
    processedInMs: Math.round(simulatedDelayMs),
  });
});

module.exports = router;
