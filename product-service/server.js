require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const productRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/productdb";

app.use(cors());
app.use(express.json());

// Basit istek loglama — SDN/izleme tarafında hangi servisin ne zaman
// çağrıldığını görmek için faydalı olacak
app.use((req, res, next) => {
  console.log(`[product-service] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "product-service" });
});

app.use("/api/products", productRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[product-service] MongoDB bağlantısı başarılı");
    app.listen(PORT, () => {
      console.log(`[product-service] ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("[product-service] MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });
