// Öğrenci Koçluk Sistemi - Analiz, İlerleme/Gerileme Motoru ve Akıllı Koç Önerileri

class AnalyticsEngine {
  // Net hesaplama: Doğru - (Yanlış / 4)
  static calcNet(correct, wrong) {
    const c = Math.max(0, Number(correct) || 0);
    const w = Math.max(0, Number(wrong) || 0);
    const net = c - (w / 4);
    return Math.max(0, Number(net.toFixed(2)));
  }

  // Tahmini TYT Puanı (ÖSYM yaklaşık katsayıları: Taban 100 + Türkçe*3.3 + Mat*3.3 + Fen*3.4 + Sosyal*3.4)
  static estimateTytScore(tytObj) {
    if (!tytObj) return 0;
    const base = 100;
    const turkce = (tytObj.turkce?.net || 0) * 3.3;
    const mat = (tytObj.matematik?.net || 0) * 3.3;
    const fen = (tytObj.fen?.net || 0) * 3.4;
    const sosyal = (tytObj.sosyal?.net || 0) * 3.4;
    const total = base + turkce + mat + fen + sosyal;
    return Math.min(500, Number(total.toFixed(1)));
  }

  // Tahmini AYT Puanı (Alan bazlı)
  static estimateAytScore(aytObj, field = "Sayısal") {
    if (!aytObj) return 0;
    const base = 100;
    let score = base;

    if (field === "Sayısal") {
      const mat = (aytObj.matematik?.net || 0) * 3.0;
      const fiz = (aytObj.fizik?.net || 0) * 2.8;
      const kim = (aytObj.kimya?.net || 0) * 3.0;
      const biyo = (aytObj.biyoloji?.net || 0) * 3.0;
      score += mat + fiz + kim + biyo;
    } else if (field === "Eşit Ağırlık") {
      const mat = (aytObj.matematik?.net || 0) * 3.0;
      const edb = (aytObj.edebiyat?.net || 0) * 3.0;
      const tar1 = (aytObj.tarih1?.net || 0) * 2.8;
      const cog1 = (aytObj.cografya1?.net || 0) * 3.0;
      score += mat + edb + tar1 + cog1;
    } else if (field === "Sözel") {
      const edb = (aytObj.edebiyat?.net || 0) * 3.0;
      const tar1 = (aytObj.tarih1?.net || 0) * 2.8;
      const cog1 = (aytObj.cografya1?.net || 0) * 2.8;
      const tar2 = (aytObj.tarih2?.net || 0) * 2.9;
      const cog2 = (aytObj.cografya2?.net || 0) * 2.9;
      const fel = (aytObj.felsefe?.net || 0) * 3.0;
      const din = (aytObj.din?.net || 0) * 3.0;
      score += edb + tar1 + cog1 + tar2 + cog2 + fel + din;
    } else {
      // Dil
      const dil = (aytObj.dil?.net || 0) * 3.0;
      score += dil;
    }

    return Math.min(500, Number(score.toFixed(1)));
  }

  // Öğrencinin genel istatistikleri
  static getStudentStats(student) {
    if (!student) return null;

    const tytExams = (student.exams || []).filter(e => e.type === "TYT");
    const aytExams = (student.exams || []).filter(e => e.type === "AYT");

    // TYT Metrikleri
    const tytNets = tytExams.map(e => e.totalNet);
    const lastTyt = tytNets.length > 0 ? tytNets[tytNets.length - 1] : 0;
    const maxTyt = tytNets.length > 0 ? Math.max(...tytNets) : 0;
    const avgTyt = tytNets.length > 0 ? Number((tytNets.reduce((a, b) => a + b, 0) / tytNets.length).toFixed(2)) : 0;

    // AYT Metrikleri
    const aytNets = aytExams.map(e => e.totalNet);
    const lastAyt = aytNets.length > 0 ? aytNets[aytNets.length - 1] : 0;
    const maxAyt = aytNets.length > 0 ? Math.max(...aytNets) : 0;
    const avgAyt = aytNets.length > 0 ? Number((aytNets.reduce((a, b) => a + b, 0) / aytNets.length).toFixed(2)) : 0;

    // Soru Çözüm Metrikleri (Son 7 gün ve toplam)
    const logs = student.questionLogs || [];
    const totalQuestions = logs.reduce((sum, l) => sum + (Number(l.count) || 0), 0);
    const totalCorrect = logs.reduce((sum, l) => sum + (Number(l.correct) || 0), 0);
    const totalWrong = logs.reduce((sum, l) => sum + (Number(l.wrong) || 0), 0);
    const accuracyRate = totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(1)) : 0;

    // Son 7 gün soruları
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
    const weeklyQuestions = last7DaysLogs.reduce((sum, l) => sum + (Number(l.count) || 0), 0);
    const weeklyProgressPct = student.targetWeeklyQuestions > 0 
      ? Math.min(100, Math.round((weeklyQuestions / student.targetWeeklyQuestions) * 100))
      : 0;

    // Devamsızlık Oranı
    const attendance = student.attendance || [];
    const attendedCount = attendance.filter(a => a.status === "Katıldı").length;
    const attendanceRate = attendance.length > 0 ? Math.round((attendedCount / attendance.length) * 100) : 100;

    return {
      tytCount: tytExams.length,
      aytCount: aytExams.length,
      lastTyt,
      maxTyt,
      avgTyt,
      tytTargetDiff: Number((lastTyt - student.targetTytNet).toFixed(2)),
      lastAyt,
      maxAyt,
      avgAyt,
      aytTargetDiff: Number((lastAyt - student.targetAytNet).toFixed(2)),
      totalQuestions,
      weeklyQuestions,
      weeklyProgressPct,
      accuracyRate,
      attendanceRate,
      attendanceTotal: attendance.length,
      attendedCount
    };
  }

  // İlerleme & Gerileme Analiz Raporu
  static analyzeProgress(student) {
    if (!student || !student.exams || student.exams.length === 0) {
      return {
        status: "Henüz Veri Yetersiz",
        statusType: "neutral",
        trendTyt: "stabil",
        trendAyt: "stabil",
        deltaTyt: 0,
        deltaAyt: 0,
        details: ["Öğrencinin ilerleme analizini görebilmek için en az 2 deneme sınavı giriniz."],
        strengths: [],
        weaknesses: [],
        recommendations: ["İlk deneme verilerini girerek koçluk yol haritasını başlatın."]
      };
    }

    const tytExams = student.exams.filter(e => e.type === "TYT");
    const aytExams = student.exams.filter(e => e.type === "AYT");

    let deltaTyt = 0;
    let trendTyt = "stabil";
    if (tytExams.length >= 2) {
      const prev = tytExams[tytExams.length - 2].totalNet;
      const curr = tytExams[tytExams.length - 1].totalNet;
      deltaTyt = Number((curr - prev).toFixed(2));
      if (deltaTyt >= 3) trendTyt = "yukselis";
      else if (deltaTyt <= -3) trendTyt = "dusus";
    }

    let deltaAyt = 0;
    let trendAyt = "stabil";
    if (aytExams.length >= 2) {
      const prev = aytExams[aytExams.length - 2].totalNet;
      const curr = aytExams[aytExams.length - 1].totalNet;
      deltaAyt = Number((curr - prev).toFixed(2));
      if (deltaAyt >= 2.5) trendAyt = "yukselis";
      else if (deltaAyt <= -2.5) trendAyt = "dusus";
    }

    // Genel durum sınıflandırması
    let status = "Dengeli ve Kararlı";
    let statusType = "info"; // success, warning, danger, info
    if (deltaTyt > 4 || deltaAyt > 3.5) {
      status = "Belirgin İlerleme / Yükseliş Trendi";
      statusType = "success";
    } else if (deltaTyt >= 1.5 || deltaAyt >= 1) {
      status = "Pozitif İlerleme";
      statusType = "success";
    } else if (deltaTyt <= -4 || deltaAyt <= -3.5) {
      status = "Ciddi Gerileme Uyarısı (Acil Müdahale)";
      statusType = "danger";
    } else if (deltaTyt <= -1.5 || deltaAyt <= -1) {
      status = "Hafif Düşüş / Dikkat Edilmeli";
      statusType = "warning";
    }

    // Ders bazlı güçlü ve zayıf alan tespiti
    const { strengths, weaknesses } = this.detectSubjectPerformances(student);

    // Otomatik Koç Tavsiyeleri Üretme
    const recommendations = this.generateCoachingAdvice(student, deltaTyt, deltaAyt, weaknesses, strengths);

    return {
      status,
      statusType,
      trendTyt,
      trendAyt,
      deltaTyt,
      deltaAyt,
      strengths,
      weaknesses,
      recommendations
    };
  }

  // Ders bazlı güçlü / zayıf analizi
  static detectSubjectPerformances(student) {
    const strengths = [];
    const weaknesses = [];

    const lastTyt = [...(student.exams || [])].filter(e => e.type === "TYT").pop();
    if (lastTyt && lastTyt.tyt) {
      const tyt = lastTyt.tyt;
      // Türkçe (40)
      if (tyt.turkce) {
        const rate = (tyt.turkce.net / 40) * 100;
        if (rate >= 80) strengths.push({ subject: "TYT Türkçe", net: tyt.turkce.net, rate: rate.toFixed(0) });
        else if (rate < 60) weaknesses.push({ subject: "TYT Türkçe", net: tyt.turkce.net, rate: rate.toFixed(0) });
      }
      // Matematik (40)
      if (tyt.matematik) {
        const rate = (tyt.matematik.net / 40) * 100;
        if (rate >= 75) strengths.push({ subject: "TYT Matematik", net: tyt.matematik.net, rate: rate.toFixed(0) });
        else if (rate < 50) weaknesses.push({ subject: "TYT Matematik", net: tyt.matematik.net, rate: rate.toFixed(0) });
      }
      // Sosyal (20)
      if (tyt.sosyal) {
        const rate = (tyt.sosyal.net / 20) * 100;
        if (rate >= 75) strengths.push({ subject: "TYT Sosyal", net: tyt.sosyal.net, rate: rate.toFixed(0) });
        else if (rate < 50) weaknesses.push({ subject: "TYT Sosyal", net: tyt.sosyal.net, rate: rate.toFixed(0) });
      }
      // Fen (20)
      if (tyt.fen) {
        const rate = (tyt.fen.net / 20) * 100;
        if (rate >= 70) strengths.push({ subject: "TYT Fen", net: tyt.fen.net, rate: rate.toFixed(0) });
        else if (rate < 45) weaknesses.push({ subject: "TYT Fen", net: tyt.fen.net, rate: rate.toFixed(0) });
      }
    }

    const lastAyt = [...(student.exams || [])].filter(e => e.type === "AYT").pop();
    if (lastAyt && lastAyt.ayt) {
      const ayt = lastAyt.ayt;
      if (ayt.matematik) {
        const rate = (ayt.matematik.net / 40) * 100;
        if (rate >= 70) strengths.push({ subject: "AYT Matematik", net: ayt.matematik.net, rate: rate.toFixed(0) });
        else if (rate < 45) weaknesses.push({ subject: "AYT Matematik", net: ayt.matematik.net, rate: rate.toFixed(0) });
      }
      if (ayt.fizik) {
        const rate = (ayt.fizik.net / 14) * 100;
        if (rate >= 70) strengths.push({ subject: "AYT Fizik", net: ayt.fizik.net, rate: rate.toFixed(0) });
        else if (rate < 45) weaknesses.push({ subject: "AYT Fizik", net: ayt.fizik.net, rate: rate.toFixed(0) });
      }
      if (ayt.edebiyat) {
        const rate = (ayt.edebiyat.net / 24) * 100;
        if (rate >= 75) strengths.push({ subject: "AYT Edebiyat", net: ayt.edebiyat.net, rate: rate.toFixed(0) });
        else if (rate < 50) weaknesses.push({ subject: "AYT Edebiyat", net: ayt.edebiyat.net, rate: rate.toFixed(0) });
      }
    }

    return { strengths, weaknesses };
  }

  // Koçluk tavsiyeleri oluşturucu
  static generateCoachingAdvice(student, deltaTyt, deltaAyt, weaknesses, strengths) {
    const advice = [];
    const stats = this.getStudentStats(student);

    // TYT Değerlendirmesi
    if (deltaTyt > 3) {
      advice.push(`🚀 TYT'de son denemede +${deltaTyt} netlik harika bir artış yakalandı! Mevcut çalışma temposu ve deneme analiz rutini aynen korunmalı.`);
    } else if (deltaTyt < -3) {
      advice.push(`⚠️ TYT son denemede ${deltaTyt} netlik bir gerileme görüldü. Hatalı soru analizi ve süre yönetimi (özellikle Türkçe-Matematik paylaşımı) acilen gözden geçirilmeli.`);
    }

    // AYT Değerlendirmesi
    if (deltaAyt > 2) {
      advice.push(`🎯 AYT'de +${deltaAyt} netlik pozitif ivme var. AYT puan katsayısının TYT'den daha yüksek olduğu vurgulanarak bu alandaki motivasyon desteklenmeli.`);
    } else if (deltaAyt < -2) {
      advice.push(`🔍 AYT'de ${deltaAyt} netlik düşüş var. Konu eksiği olan alanlarda soru çözümünden önce 1-2 günlük konu fasikülü taraması önerilir.`);
    }

    // Soru Kotası Durumu
    if (stats.weeklyProgressPct < 60) {
      advice.push(`📉 Haftalık soru hedefi %${stats.weeklyProgressPct} seviyesinde kaldı. Günlük çözülmesi gereken soru sayısı parçalara bölünmeli (örn. sabah 50, akşam 100).`);
    } else if (stats.weeklyProgressPct >= 95) {
      advice.push(`⭐ Haftalık soru hedefine tam ulaşıldı (%${stats.weeklyProgressPct}). Şimdi odak soru sayısından ziyade 'hata yapılan soruların tekrar çözümüne' çevrilmeli.`);
    }

    // Zayıf derslere özel yönlendirmeler
    if (weaknesses.length > 0) {
      const weakNames = weaknesses.map(w => w.subject).join(", ");
      advice.push(`📌 Öncelikli Gelişim Alanı: ${weakNames} derslerinde başarı oranı düşük. Bir sonraki haftanın ödev programında bu derslere ağırlık verilmeli.`);
    }

    if (advice.length === 0) {
      advice.push("Düzenli deneme çözümü ve günlük soru hedeflerine uyum başarıyla devam ediyor. Koçluk görüşmesinde moral-motivasyon desteği sağlanmalıdır.");
    }

    return advice;
  }
}

window.AnalyticsEngine = AnalyticsEngine;
