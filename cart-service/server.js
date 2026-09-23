require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectRedis } = require("./utils/redisClient");
const cartRoutes = require("./routes/cart");

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[cart-service] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "cart-service" });
});

app.use("/api/cart", cartRoutes);

connectRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[cart-service] ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("[cart-service] Redis bağlantı hatası:", err.message);
    process.exit(1);
  });
