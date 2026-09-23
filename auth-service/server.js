require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/authdb";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[auth-service] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.use("/api/auth", authRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[auth-service] MongoDB bağlantısı başarılı");
    app.listen(PORT, () => {
      console.log(`[auth-service] ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("[auth-service] MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });
