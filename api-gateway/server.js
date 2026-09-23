require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:4003";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:4004";

app.use(cors());

app.use((req, res, next) => {
  console.log(`[api-gateway] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// ÖNEMLİ: Proxy'ler kök seviyede (app.use(proxy)) bağlanıyor, app.use("/api/x", proxy)
// şeklinde DEĞİL. Çünkü Express, ikinci yöntemde proxy'ye göndermeden önce
// path önekini siliyor ve hedef servis tam yolu bulamıyor. pathFilter
// kullanarak hem doğru servise yönlendirme hem de orijinal tam yolun
// korunmasını sağlıyoruz.
app.use(
  createProxyMiddleware({
    pathFilter: "/api/auth",
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/products",
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
  })
);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/cart",
    target: CART_SERVICE_URL,
    changeOrigin: true,
  })
);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/orders",
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use((req, res) => {
  res.status(404).json({ error: "Bilinmeyen rota", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`[api-gateway] ${PORT} portunda çalışıyor`);
  console.log(`[api-gateway] auth -> ${AUTH_SERVICE_URL}`);
  console.log(`[api-gateway] products -> ${PRODUCT_SERVICE_URL}`);
  console.log(`[api-gateway] cart -> ${CART_SERVICE_URL}`);
  console.log(`[api-gateway] orders -> ${ORDER_SERVICE_URL}`);
});