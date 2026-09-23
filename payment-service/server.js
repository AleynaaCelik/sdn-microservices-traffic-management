require("dotenv").config();
const express = require("express");
const cors = require("cors");
const paymentRoutes = require("./routes/payments");

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[payment-service] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.use("/api/payments", paymentRoutes);

app.listen(PORT, () => {
  console.log(`[payment-service] ${PORT} portunda çalışıyor`);
});
