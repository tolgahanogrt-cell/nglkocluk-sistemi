// Öğrenci Koçluk Sistemi - Analiz, Gelişim Motoru ve Rehberlik Algoritması

class AnalyticsEngine {
  // Net hesaplama: Doğru - (Yanlış / 4)
  static calcNet(correct, wrong) {
    const c = Math.max(0, Number(correct) || 0);
    const w = Math.max(0, Number(wrong) || 0);
    const net = c - (w / 4);
    return Math.max(0, Number(net.toFixed(2)));
  }

  // Tahmini TYT Puanı (ÖSYM yaklaşık standart katsayıları)
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
      score += edb + tar1 + cog1;
    } else {
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

    // Soru Çözüm Metrikleri
    const logs = student.questionLogs || [];
    const totalQuestions = logs.reduce((sum, l) => sum + (Number(l.count) || 0), 0);
    const totalCorrect = logs.reduce((sum, l) => sum + (Number(l.correct) || 0), 0);
    const accuracyRate = totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(1)) : 0;

    // Son 7 gün soruları
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
    const weeklyQuestions = last7DaysLogs.reduce((sum, l) => sum + (Number(l.count) || 0), 0);
    const weeklyProgressPct = student.targetWeeklyQuestions > 0 
      ? Math.min(100, Math.round((weeklyQuestions / student.targetWeeklyQuestions) * 100))
      : 0;

    // Ders Devamsızlıkları
    const courseAttendance = student.courseAttendance || [];
    const totalAbsentHours = courseAttendance.reduce((sum, a) => sum + (Number(a.hours) || 0), 0);
    const totalAbsentDays = courseAttendance.length;

    // Koçluk Görüşmeleri Katılımı
    const sessions = student.coachingSessions || [];
    const attendedSessions = sessions.filter(s => s.status === "Katıldı").length;
    const sessionRate = sessions.length > 0 ? Math.round((attendedSessions / sessions.length) * 100) : 100;

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
      totalAbsentDays,
      totalAbsentHours,
      sessionRate,
      sessionsTotal: sessions.length,
      attendedSessions
    };
  }

  // Tamamen Dinamik İlerleme ve Gerileme Analiz Motoru
  static analyzeProgress(student) {
    if (!student || !student.exams || student.exams.length === 0) {
      return {
        status: "Henüz Veri Yetersiz",
        statusType: "neutral",
        trendTyt: "stabil",
        trendAyt: "stabil",
        deltaTyt: 0,
        deltaAyt: 0,
        strengths: [],
        weaknesses: [],
        recommendations: ["Öğrencinin analizinin çıkarılması için en az 1 deneme sınavı giriniz."]
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

    // Durum Belirleme Algoritması
    let status = "Dengeli ve Kararlı";
    let statusType = "info";
    if (deltaTyt > 4 || deltaAyt > 3.5) {
      status = "Belirgin İlerleme (Yükseliş Eğilimi)";
      statusType = "success";
    } else if (deltaTyt >= 1.5 || deltaAyt >= 1) {
      status = "Pozitif İlerleme";
      statusType = "success";
    } else if (deltaTyt <= -4 || deltaAyt <= -3.5) {
      status = "Ciddi Gerileme Uyarısı (Acil Müdahale)";
      statusType = "danger";
    } else if (deltaTyt <= -1.5 || deltaAyt <= -1) {
      status = "Hafif Düşüş (Takip Edilmeli)";
      statusType = "warning";
    }

    // Branş Başarı Oranları
    const { strengths, weaknesses } = this.detectSubjectPerformances(student);

    // Dinamik Aksiyon ve Tavsiye Üretimi
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

  static detectSubjectPerformances(student) {
    const strengths = [];
    const weaknesses = [];

    const lastTyt = [...(student.exams || [])].filter(e => e.type === "TYT").pop();
    if (lastTyt && lastTyt.tyt) {
      const tyt = lastTyt.tyt;
      if (tyt.turkce) {
        const rate = (tyt.turkce.net / 40) * 100;
        if (rate >= 80) strengths.push({ subject: "TYT Türkçe", net: tyt.turkce.net, rate: rate.toFixed(0) });
        else if (rate < 60) weaknesses.push({ subject: "TYT Türkçe", net: tyt.turkce.net, rate: rate.toFixed(0) });
      }
      if (tyt.matematik) {
        const rate = (tyt.matematik.net / 40) * 100;
        if (rate >= 75) strengths.push({ subject: "TYT Matematik", net: tyt.matematik.net, rate: rate.toFixed(0) });
        else if (rate < 50) weaknesses.push({ subject: "TYT Matematik", net: tyt.matematik.net, rate: rate.toFixed(0) });
      }
      if (tyt.sosyal) {
        const rate = (tyt.sosyal.net / 20) * 100;
        if (rate >= 75) strengths.push({ subject: "TYT Sosyal", net: tyt.sosyal.net, rate: rate.toFixed(0) });
        else if (rate < 50) weaknesses.push({ subject: "TYT Sosyal", net: tyt.sosyal.net, rate: rate.toFixed(0) });
      }
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

  static generateCoachingAdvice(student, deltaTyt, deltaAyt, weaknesses, strengths) {
    const advice = [];
    const stats = this.getStudentStats(student);

    // 1. TYT Değerlendirmesi
    if (deltaTyt > 3) {
      advice.push(`TYT sınavında son denemede +${deltaTyt} net artış kaydedildi. Öğrencinin deneme süresi dağılımı ve soru çözüm temposu korunmalıdır.`);
    } else if (deltaTyt < -3) {
      advice.push(`TYT son denemede ${deltaTyt} netlik gerileme gözlendi. Deneme analizinde boş bırakılan ve hatalı yapılan sorular konu bazında taranmalıdır.`);
    }

    // 2. AYT Değerlendirmesi
    if (deltaAyt > 2) {
      advice.push(`AYT denemesinde +${deltaAyt} netlik pozitif ivme mevcut. Alan katsayısı yüksek olduğundan çalışma programında bu ivme pekiştirilmelidir.`);
    } else if (deltaAyt < -2) {
      advice.push(`AYT'de ${deltaAyt} netlik düşüş yaşandı. Konu eksikleri için soru bankası taramasından önce 2 günlük özet konu fasikülü tekrarı önerilir.`);
    }

    // 3. Haftalık Soru Kotası
    if (stats.weeklyProgressPct < 60) {
      advice.push(`Haftalık soru çözme hedefinin %${stats.weeklyProgressPct} kadarı tamamlanabildi. Öğrenci için günlük kota parçalı hedeflere (sabah/akşam) bölünmelidir.`);
    } else if (stats.weeklyProgressPct >= 95) {
      advice.push(`Haftalık soru tamamlama oranı %${stats.weeklyProgressPct} ile başarıyla gerçekleşti. Şimdi yanlış çıkan soru tiplerinin analizine odaklanılmalıdır.`);
    }

    // 4. Devamsızlık Uyarısı
    if (stats.totalAbsentDays > 3) {
      advice.push(`Öğrencinin ${stats.totalAbsentDays} gün (${stats.totalAbsentHours} ders saati) devamsızlığı bulunuyor. Ders kaçırma durumunun deneme netlerine etkisi takip edilmelidir.`);
    }

    // 5. Zayıf Alan Odaklanması
    if (weaknesses.length > 0) {
      const names = weaknesses.map(w => w.subject).join(", ");
      advice.push(`Öncelikli Gelişim İhtiyacı: ${names} derslerinde net yüzdesi düşük. Gelecek haftanın çalışma programında bu derslere ek branş etütleri planlanmalıdır.`);
    }

    if (advice.length === 0) {
      advice.push("Öğrencinin haftalık çalışma rutini ve deneme performansı dengeli ilerlemektedir. Bir sonraki seansa kadar program aynı kararlılıkla sürdürülmelidir.");
    }

    return advice;
  }
}

window.AnalyticsEngine = AnalyticsEngine;
