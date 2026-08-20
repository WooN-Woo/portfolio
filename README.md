# Kişisel site — Yiğit Eren

Portfolyo ve CV. Next.js 16, statik çıktı, sunucu gerektirmez.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # out/ klasörüne statik site üretir
```

## İçerik nasıl değişir

`npm run dev` çalışırken **http://localhost:3000/duzenle** adresini aç. Menüde de
"İçerik" bağlantısı çıkar. Panelde altı sekme var:

| Sekme | Ne yapar |
|---|---|
| Profil | Ad, unvan, iletişim, ana sayfadaki büyük cümle, tanıtım, CV hedef metni, durum satırı |
| Oyunlar | Oyun ekle/sil, sırala; kapak görseli, ad, yıl, rol, motor, durum, açıklama, bağlantılar |
| Projeler | Oyun dışı işler; ad, yıl, rol, durum, açıklama, kullanılanlar, bağlantılar |
| Deneyim | İş geçmişi — boşsa bölüm sitede hiç görünmez |
| Eğitim | Okul bilgileri |
| Yetkinlikler | Başlık grupları ve maddeleri |
| Diller ve ilgi alanları | Dil, seviye ve hobiler |

**Kapak görseli**: Oyunlar sekmesinde "Görsel seç" ile bilgisayarından seçiyorsun; dosya
`public/oyunlar/` klasörüne kopyalanıyor ve oyuna bağlanıyor. png, jpg, webp ve gif kabul
ediliyor, en fazla 6 MB. Kapak koymazsan oyunun adından bir kapak üretiliyor, boşluk kalmıyor.

**Kaydet**'e bastığında değişiklik `src/content/site.json` dosyasına yazılır, site
anında yenilenir. Her kayıtta bir öncekinin kopyası `.icerik-yedek/` klasörüne düşer
(son 20 kayıt tutulur), yanlış bir şey olursa oradan geri alırsın.

Panel yalnızca kendi bilgisayarında açılır — yayına alınan siteye dahil edilmez.
Değişikliklerin internete çıkması için kaydettikten sonra deploy etmen gerekir.

İstersen `src/content/site.json` dosyasını elle de düzenleyebilirsin; panel de site de
aynı dosyayı okur.

## Renk ve yazı tipi

Hepsi `src/app/globals.css` en üstteki `:root` bloğunda. Bir değeri değiştirdiğinde site
baştan aşağı ona uyar. Karanlık tema hemen altındaki blokta, ziyaretçinin sistem
ayarına göre kendiliğinden açılıyor.

## CV

`/cv` sayfası ekranda da yazdırmada da aynı içeriği gösteriyor. "Yazdır / PDF olarak
kaydet" düğmesi tarayıcının yazdırma penceresini açar; oradan **PDF olarak kaydet**
seçilince A4 çıktı alınır. Menü, alt bilgi ve düğmenin kendisi çıktıya girmez.

## Yayına alma

`npm run build` sonrası `out/` klasörü hazır statik sitedir; herhangi bir yere
konabilir. Vercel'e almak için depoyu bağlaman yeterli, ek ayar gerekmiyor.

## Dosya düzeni

```
src/content/site.json     bütün içerik burada
src/content/site.ts       içeriğin tipleri
src/app/                  sayfalar: / , /cv , /duzenle
src/components/           arayüz parçaları + düzenleme paneli
src/app/globals.css       renkler, yazı tipleri, bütün stiller
tools/editor.mjs          panelin kaydet düğmesini karşılayan yerel araç
tools/dev.mjs             siteyi ve aracı birlikte başlatır
```
