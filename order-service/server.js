require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const orderRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 4004;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/orderdb";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[order-service] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

app.use("/api/orders", orderRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[order-service] MongoDB bağlantısı başarılı");
    app.listen(PORT, () => {
      console.log(`[order-service] ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("[order-service] MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });
