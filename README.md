# E-Ticaret Mikroservis Platformu

Kırıkkale Üniversitesi yüksek lisans tezi kapsamında geliştirilen, mikroservis
tabanlı bir e-ticaret referans uygulaması. Bu uygulama, SDN tabanlı trafik
yönetimi ve performans optimizasyonu çalışmalarında test ortamı olarak
kullanılmak üzere tasarlanmıştır.

## Servisler

| Servis           | Port | Veritabanı      | Görevi                                    |
|-------------------|------|------------------|--------------------------------------------|
| api-gateway       | 3000 | -                | Tüm isteklerin tek giriş noktası (proxy)  |
| auth-service      | 4001 | MongoDB (mongo-auth)    | Kayıt, giriş, JWT üretimi          |
| product-service   | 4002 | MongoDB (mongo-product) | Ürün kataloğu, stok yönetimi       |
| cart-service      | 4003 | Redis (redis-cart)      | Kullanıcı sepeti                   |
| order-service     | 4004 | MongoDB (mongo-order)   | Sipariş orkestrasyonu              |
| payment-service   | 4005 | -                | Mock ödeme işlemleri                      |

## Servisler arası çağrı akışı (east-west trafik)

```
Sipariş oluşturma isteği:
  Client -> api-gateway -> order-service
                              |-> cart-service (sepeti al)
                              |-> product-service (her ürün için stok düş)
                              |-> payment-service (ödeme al)
                              |-> cart-service (sepeti temizle)

Sepete ekleme isteği:
  Client -> api-gateway -> cart-service -> product-service (ürünü doğrula)
```

## Çalıştırma

```bash
docker compose up --build
```

Tüm servisler ayağa kalktıktan sonra tek giriş noktası:
`http://localhost:3000`

Örnek uçtan uca akış:
1. `POST /api/auth/register` — kullanıcı oluştur
2. `POST /api/auth/login` — token al
3. `POST /api/products` — ürün ekle (admin işlemi, şimdilik korumasız)
4. `POST /api/cart/:userId/add` — sepete ürün ekle
5. `POST /api/orders` — siparişi tamamla

## Sonraki adımlar (tez için)

- Kubernetes manifestleri (Deployment, Service, Ingress) hazırlanacak
- Mininet ile emüle edilen ağ topolojisine bağlanacak
- Prometheus/Grafana ile servisler arası gecikme, throughput, paket kaybı
  ölçülecek
- Ryu SDN denetleyicisi, toplanan ölçütlere göre akış kurallarını dinamik
  olarak güncelleyecek
