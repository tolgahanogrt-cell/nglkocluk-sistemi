# 🎓 Öğrenci Koçluk ve YKS Başarı Takip Sistemi

Taşınabilir, kurulum gerektirmeyen, internetli veya internetsiz her bilgisayarda çalışan ve **Google Sites / GitHub Pages** gibi ücretsiz platformlara anında entegre edilebilen profesyonel bir öğrenci koçluk web uygulamasıdır.

---

## 🚀 Öne Çıkan Özellikler

1. **Çoklu Öğrenci Portföyü:**
   - Sayısal, Eşit Ağırlık, Sözel ve Dil alanlarında öğrenci tanımlama.
   - Hedef üniversite, hedef bölüm, hedef TYT ve AYT netleri belirleme.
   - Tek tıkla öğrenciler arasında geçiş yapma.

2. **TYT & AYT Deneme Takibi:**
   - **TYT:** Türkçe (40), Temel Matematik (40), Sosyal Bilimler (20), Fen Bilimleri (20).
   - **AYT:** Sayısal (Matematik, Fizik, Kimya, Biyoloji) ve Eşit Ağırlık (Matematik, Edebiyat, Tarih-1, Coğrafya-1).
   - Otomatik net hesaplama: `Net = Doğru - (Yanlış / 4)`.
   - Otomatik ÖSYM katsayılı yaklaşık puan simülasyonu.
   - Sınav zorluk derecesi (1-5 yıldız) ve koç gözlem notu.

3. **Günlük & Haftalık Soru Takip Çizelgesi:**
   - Ders bazında çözülen soru, doğru, yanlış ve çalışma süresi girişi.
   - Haftalık soru kotası ilerleme çubuğu (% başarı oranı).
   - Çözüm doğruluğu ve ders dağılım istatistikleri.

4. **Devamsızlık & Koçluk Seansları:**
   - Haftalık görüşme seansları, etüt ve deneme kampı katılımları (Katıldı, İzinli, Devamsız).
   - Öğrenci haftalık motivasyon puanı (1-10) ve haftalık ödev listesi.

5. **Akıllı İlerleme / Gerileme Analiz Motoru:**
   - Son sınavlar ile genel ortalamayı karşılaştırarak otomatik durum belirleme:
     - 🚀 *Belirgin İlerleme*
     - 📈 *Pozitif Gelişim*
     - ⚖️ *Dengeli / Sabit*
     - ⚠️ *Hafif Düşüş*
     - ❌ *Ciddi Gerileme Uyarısı (Acil Müdahale)*
   - En güçlü ve gelişime açık (riskli) derslerin tespiti.
   - Koç için dinamik tavsiye ve haftalık aksiyon planı önerileri.

6. **İnteraktif Grafikler (Chart.js):**
   - TYT Net Trend Çizgi Grafiği (Hedef net çizgisiyle karşılaştırmalı).
   - AYT Net Trend Grafiği.
   - Ders Başarı Radarı (% Net dağılımı).
   - Toplam Soru Çözüm Dağılım Sütun Grafiği.

7. **Resmi Öğrenci Karnesi (PDF & Yazdırılabilir A4 Raporu):**
   - Antetli, profesyonel öğrenci karnesi.
   - Öğrenci bilgileri, hedefler, son 5 deneme performansı, soru karnesi, koç değerlendirmesi ve imza alanları.
   - Tek tıkla tarayıcı üzerinden A4 formatında **PDF** olarak kaydetme veya yazdırma.

8. **Tam Taşınabilirlik (Portability):**
   - Sıfır sunucu, sıfır veritabanı kurulumu.
   - `LocalStorage` ile otomatik anlık kaydetme.
   - **Tüm Veriyi Yedekle (.json):** Tek tuşla tüm öğrenci verilerini indirip USB bellek ile başka bir bilgisayara taşıyabilirsiniz.
   - **Yedekten Geri Yükle (.json):** Başka bir bilgisayarda dosyayı seçip saniyeler içinde kaldığınız yerden devam edebilirsiniz.

---

## 💻 Kullanım Yöntemleri

### Yöntem 1: Doğrudan Bilgisayarda Açma (USB / Yerel Disk)
1. `kocluk-sistemi` klasörünün içindeki `index.html` dosyasına çift tıklayın.
2. Varsayılan tarayıcınızda (Chrome, Edge, Firefox vb.) anında açılacaktır. İnternet bağlantısına bile ihtiyaç duymaz!

### Yöntem 2: Google Sites'a Ekleme (Ücretsiz ve Canlı Yayın)
1. Bu klasörü **GitHub** hesabınızda yeni bir repo oluşturup yükleyin ve `GitHub Pages`'i aktif edin (veya **Netlify** / **Vercel** üzerine klasörü sürükleyip bırakarak ücretsiz bir `https://...` linki elde edin).
2. [Google Sites](https://sites.google.com/) sayfanızı düzenleme modunda açın.
3. Sağdaki araç panelinden **"Göm" (Embed)** butonuna tıklayın.
4. **"URL İle"** seçeneğini seçip aldığınız web sitesi bağlantısını yapıştırın.
5. Sayfa boyutunu tam genişliğe ayarlayın ve **"Yayınla"** butonuna basın. Artık Google Sites sitenizde tüm cihazlardan çalışan bir koçluk sisteminiz hazır!

---

## 📄 Dosya Yapısı

```
kocluk-sistemi/
├── index.html        # Ana sayfa ve tüm arayüz bileşenleri
├── README.md         # Kullanım kılavuzu ve açıklamalar
├── css/
│   └── style.css     # Modern tema, karanlık mod ve @media print antetli karne stilleri
├── js/
│   ├── models.js     # Veri modelleri ve hazır YKS demo verileri
│   ├── store.js      # LocalStorage yönetimi, JSON dışa/içe aktarma
│   ├── analytics.js  # Net hesaplama, ilerleme/gerileme motoru, koç tavsiyeleri
│   ├── charts.js     # Chart.js grafik yöneticisi
│   └── app.js        # UI olayları, sekme geçişleri, modallar ve karne kontrolü
└── lib/
    └── chart.umd.min.js # Çevrimdışı grafik kütüphanesi (205 KB)
```
