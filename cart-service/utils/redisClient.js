const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => {
  console.error("[cart-service] Redis hatası:", err.message);
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("[cart-service] Redis bağlantısı başarılı");
  }
}

module.exports = { redisClient, connectRedis };
