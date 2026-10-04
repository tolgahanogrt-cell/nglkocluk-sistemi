// Öğrenci Koçluk Sistemi - Veri Modelleri ve Demo Veriler

const INITIAL_DEMO_DATA = {
  students: [
    {
      id: "std-1",
      name: "Zeynep Kaya",
      field: "Sayısal", // Sayısal, Eşit Ağırlık, Sözel, Dil
      grade: "12. Sınıf",
      targetUniversity: "Boğaziçi Üniversitesi",
      targetDepartment: "Bilgisayar Mühendisliği",
      targetTytNet: 105,
      targetAytNet: 72,
      targetWeeklyQuestions: 1400,
      avatarColor: "#4f46e5",
      notes: "Matematik geometride hızlanması gerekiyor. Fizik mekanik tekrarı yapıldı.",
      createdAt: "2026-09-01",
      exams: [
        {
          id: "ex-1",
          type: "TYT",
          name: "Özdebir TYT-1",
          date: "2026-09-05",
          difficulty: 3,
          tyt: {
            turkce: { d: 34, y: 5, b: 1, net: 32.75 },
            matematik: { d: 29, y: 4, b: 7, net: 28.00 },
            sosyal: { d: 15, y: 3, b: 2, net: 14.25 },
            fen: { d: 14, y: 4, b: 2, net: 13.00 }
          },
          totalNet: 88.00,
          estimatedScore: 412.5,
          notes: "Zaman yönetiminde Türkçe biraz uzadı."
        },
        {
          id: "ex-2",
          type: "TYT",
          name: "Limit TYT Türkiye Geneli",
          date: "2026-09-12",
          difficulty: 4,
          tyt: {
            turkce: { d: 35, y: 3, b: 2, net: 34.25 },
            matematik: { d: 32, y: 3, b: 5, net: 31.25 },
            sosyal: { d: 16, y: 2, b: 2, net: 15.50 },
            fen: { d: 15, y: 3, b: 2, net: 14.25 }
          },
          totalNet: 95.25,
          estimatedScore: 432.8,
          notes: "Matematikte problem çözme hızı arttı."
        },
        {
          id: "ex-3",
          type: "TYT",
          name: "3D TYT Simülasyon-1",
          date: "2026-09-19",
          difficulty: 4,
          tyt: {
            turkce: { d: 36, y: 4, b: 0, net: 35.00 },
            matematik: { d: 34, y: 2, b: 4, net: 33.50 },
            sosyal: { d: 14, y: 4, b: 2, net: 13.00 },
            fen: { d: 16, y: 2, b: 2, net: 15.50 }
          },
          totalNet: 97.00,
          estimatedScore: 440.1,
          notes: "Fen netleri beklenen seviyeye ulaştı."
        },
        {
          id: "ex-4",
          type: "TYT",
          name: "Bilgi Sarmal TYT-2",
          date: "2026-09-26",
          difficulty: 3,
          tyt: {
            turkce: { d: 37, y: 2, b: 1, net: 36.50 },
            matematik: { d: 35, y: 3, b: 2, net: 34.25 },
            sosyal: { d: 17, y: 2, b: 1, net: 16.50 },
            fen: { d: 17, y: 2, b: 1, net: 16.50 }
          },
          totalNet: 103.75,
          estimatedScore: 461.4,
          notes: "En iyi TYT derecesi, hedef nete çok yaklaşıldı!"
        },
        {
          id: "ex-5",
          type: "AYT",
          name: "Özdebir AYT-1 Sayısal",
          date: "2026-09-08",
          difficulty: 3,
          ayt: {
            matematik: { d: 28, y: 4, b: 8, net: 27.00 },
            fizik: { d: 9, y: 3, b: 2, net: 8.25 },
            kimya: { d: 10, y: 2, b: 1, net: 9.50 },
            biyoloji: { d: 11, y: 2, b: 0, net: 10.50 }
          },
          totalNet: 55.25,
          estimatedScore: 418.0,
          notes: "Fizikte elektrik ve manyetizma zayıf kaldı."
        },
        {
          id: "ex-6",
          type: "AYT",
          name: "3D AYT Simülasyon Sayısal",
          date: "2026-09-22",
          difficulty: 4,
          ayt: {
            matematik: { d: 33, y: 3, b: 4, net: 32.25 },
            fizik: { d: 11, y: 2, b: 1, net: 10.50 },
            kimya: { d: 11, y: 1, b: 1, net: 10.75 },
            biyoloji: { d: 12, y: 1, b: 0, net: 11.75 }
          },
          totalNet: 65.25,
          estimatedScore: 452.6,
          notes: "Matematik ve biyolojide belirgin sıçrama var."
        }
      ],
      questionLogs: [
        { id: "ql-1", date: "2026-09-28", subject: "Matematik", count: 85, correct: 74, wrong: 9, duration: 90 },
        { id: "ql-2", date: "2026-09-28", subject: "Fizik", count: 50, correct: 42, wrong: 6, duration: 60 },
        { id: "ql-3", date: "2026-09-29", subject: "Türkçe", count: 70, correct: 63, wrong: 5, duration: 55 },
        { id: "ql-4", date: "2026-09-29", subject: "Kimya", count: 60, correct: 54, wrong: 4, duration: 65 },
        { id: "ql-5", date: "2026-09-30", subject: "Matematik", count: 90, correct: 80, wrong: 7, duration: 100 },
        { id: "ql-6", date: "2026-09-30", subject: "Biyoloji", count: 65, correct: 59, wrong: 5, duration: 60 },
        { id: "ql-7", date: "2026-10-01", subject: "Geometri", count: 60, correct: 48, wrong: 8, duration: 75 },
        { id: "ql-8", date: "2026-10-01", subject: "Fizik", count: 55, correct: 45, wrong: 7, duration: 65 },
        { id: "ql-9", date: "2026-10-02", subject: "Matematik", count: 100, correct: 88, wrong: 8, duration: 110 },
        { id: "ql-10", date: "2026-10-03", subject: "Türkçe (Paragraf)", count: 80, correct: 72, wrong: 6, duration: 60 },
        { id: "ql-11", date: "2026-10-03", subject: "Kimya", count: 50, correct: 46, wrong: 3, duration: 50 },
        { id: "ql-12", date: "2026-10-04", subject: "Genel Deneme Tekrarı", count: 120, correct: 105, wrong: 11, duration: 130 }
      ],
      attendance: [
        { id: "at-1", date: "2026-09-08", title: "Haftalık Koçluk Seansı 1", type: "Koçluk", status: "Katıldı", notes: "Aylık plan oluşturuldu." },
        { id: "at-2", date: "2026-09-15", title: "Haftalık Koçluk Seansı 2", type: "Koçluk", status: "Katıldı", notes: "Limit TYT analizi yapıldı." },
        { id: "at-3", date: "2026-09-22", title: "Haftalık Koçluk Seansı 3", type: "Koçluk", status: "Katıldı", notes: "AYT fizik eksikleri listelendi." },
        { id: "at-4", date: "2026-09-29", title: "Haftalık Koçluk Seansı 4", type: "Koçluk", status: "Katıldı", notes: "Soru hedefi 1400'e çıkarıldı." },
        { id: "at-5", date: "2026-10-01", title: "Kurum Matematik Etüdü", type: "Etüt", status: "Katıldı", notes: "Türev-İntegral hazırlık." },
        { id: "at-6", date: "2026-10-03", title: "Hafta Sonu Kampı", type: "Etüt", status: "İzinli", notes: "Ailevi mazeret bildirildi." }
      ],
      coachingNotes: [
        {
          id: "cn-1",
          date: "2026-09-29",
          coachMood: "Çok İyi",
          studentMotivation: 9,
          summary: "Zeynep son 3 haftada TYT'de 88 netten 103 nete çıkarak müthiş bir sıçrama yaptı. Özellikle Matematikte problem teknikleri oturdu.",
          assignments: [
            "Haftalık minimum 1400 soru tamamlanacak",
            "Fizik Elektrik ve Manyetizma fasikülü bitirilecek",
            "Hergün 30 Paragraf + 20 Problem rutini aksatılmayacak"
          ]
        }
      ]
    },
    {
      id: "std-2",
      name: "Emir Demir",
      field: "Eşit Ağırlık",
      grade: "Mezun",
      targetUniversity: "Koç Üniversitesi",
      targetDepartment: "Hukuk Fakültesi",
      targetTytNet: 92,
      targetAytNet: 64,
      targetWeeklyQuestions: 1200,
      avatarColor: "#059669",
      notes: "Edebiyatta yazar-eser ezberleri iyi gidiyor, AYT matematikte geometriye ağırlık verilmeli.",
      createdAt: "2026-09-02",
      exams: [
        {
          id: "ex-201",
          type: "TYT",
          name: "Hız ve Renk TYT",
          date: "2026-09-07",
          difficulty: 3,
          tyt: {
            turkce: { d: 33, y: 5, b: 2, net: 31.75 },
            matematik: { d: 24, y: 5, b: 11, net: 22.75 },
            sosyal: { d: 17, y: 2, b: 1, net: 16.50 },
            fen: { d: 7, y: 5, b: 8, net: 5.75 }
          },
          totalNet: 76.75,
          estimatedScore: 382.4,
          notes: "Fen sorularında zorlandı."
        },
        {
          id: "ex-202",
          type: "TYT",
          name: "Bilgi Sarmal TYT",
          date: "2026-09-21",
          difficulty: 3,
          tyt: {
            turkce: { d: 35, y: 3, b: 2, net: 34.25 },
            matematik: { d: 27, y: 4, b: 9, net: 26.00 },
            sosyal: { d: 18, y: 2, b: 0, net: 17.50 },
            fen: { d: 9, y: 3, b: 8, net: 8.25 }
          },
          totalNet: 86.00,
          estimatedScore: 409.8,
          notes: "Sosyal ve Türkçe oldukça kuvvetli."
        },
        {
          id: "ex-203",
          type: "AYT",
          name: "Karakök AYT EA",
          date: "2026-09-14",
          difficulty: 4,
          ayt: {
            matematik: { d: 24, y: 4, b: 12, net: 23.00 },
            edebiyat: { d: 20, y: 3, b: 1, net: 19.25 },
            tarih1: { d: 8, y: 2, b: 0, net: 7.50 },
            cografya1: { d: 5, y: 1, b: 0, net: 4.75 }
          },
          totalNet: 54.50,
          estimatedScore: 401.2,
          notes: "Edebiyatta dönemler tamamlandı."
        },
        {
          id: "ex-204",
          type: "AYT",
          name: "Limit AYT EA",
          date: "2026-09-28",
          difficulty: 4,
          ayt: {
            matematik: { d: 28, y: 3, b: 9, net: 27.25 },
            edebiyat: { d: 22, y: 2, b: 0, net: 21.50 },
            tarih1: { d: 9, y: 1, b: 0, net: 8.75 },
            cografya1: { d: 6, y: 0, b: 0, net: 6.00 }
          },
          totalNet: 63.50,
          estimatedScore: 431.5,
          notes: "Hedefe sadece 0.5 net kaldı!"
        }
      ],
      questionLogs: [
        { id: "ql-201", date: "2026-09-28", subject: "Edebiyat", count: 100, correct: 92, wrong: 6, duration: 75 },
        { id: "ql-202", date: "2026-09-29", subject: "Matematik", count: 80, correct: 66, wrong: 9, duration: 90 },
        { id: "ql-203", date: "2026-09-30", subject: "Tarih", count: 60, correct: 54, wrong: 4, duration: 45 },
        { id: "ql-204", date: "2026-10-01", subject: "Türkçe", count: 70, correct: 65, wrong: 4, duration: 50 },
        { id: "ql-205", date: "2026-10-02", subject: "Coğrafya", count: 50, correct: 46, wrong: 3, duration: 40 },
        { id: "ql-206", date: "2026-10-03", subject: "Matematik", count: 90, correct: 75, wrong: 8, duration: 100 }
      ],
      attendance: [
        { id: "at-201", date: "2026-09-09", title: "Haftalık Koçluk 1", type: "Koçluk", status: "Katıldı", notes: "Başlangıç planı." },
        { id: "at-202", date: "2026-09-16", title: "Haftalık Koçluk 2", type: "Koçluk", status: "Katıldı", notes: "Matematik geometri denemesi." },
        { id: "at-203", date: "2026-09-23", title: "Haftalık Koçluk 3", type: "Koçluk", status: "Katıldı", notes: "Edebiyat tekrarları." },
        { id: "at-204", date: "2026-09-30", title: "Haftalık Koçluk 4", type: "Koçluk", status: "Katıldı", notes: "Genel motivasyon." }
      ],
      coachingNotes: [
        {
          id: "cn-201",
          date: "2026-09-30",
          coachMood: "Harika",
          studentMotivation: 8.5,
          summary: "Emir mezun psikolojisini tamamen aştı ve disiplinli bir şekilde devam ediyor. AYT Edebiyat ve Coğrafya fulle yakın.",
          assignments: [
            "AYT Matematikte Analitik Geometri ve Trigonometri testleri",
            "Haftada 2 adet TYT Sosyal branş denemesi",
            "Tarih-1 Inkılap Tarihi kronoloji tekrarı"
          ]
        }
      ]
    }
  ]
};
