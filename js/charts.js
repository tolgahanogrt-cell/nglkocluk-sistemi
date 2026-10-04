// Öğrenci Koçluk Sistemi - Grafik Yöneticisi (Chart.js)

class ChartManager {
  static instances = {};

  static destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  }

  // Tarih Filtresi Yardımcısı (Genel / Aylık)
  static filterByPeriod(items, period, dateField = "date") {
    if (!items || items.length === 0) return [];
    if (!period || period === "all") return items;

    let maxDate = null;
    items.forEach(item => {
      if (item && item[dateField]) {
        const d = new Date(item[dateField]);
        if (!isNaN(d.getTime())) {
          if (!maxDate || d > maxDate) maxDate = d;
        }
      }
    });

    if (!maxDate) return items;

    const cutoff = new Date(maxDate);
    cutoff.setDate(cutoff.getDate() - 30);

    const filtered = items.filter(item => {
      if (!item || !item[dateField]) return false;
      const d = new Date(item[dateField]);
      return !isNaN(d.getTime()) && d >= cutoff;
    });

    return filtered.length > 0 ? filtered : items.slice(-3);
  }

  // TYT Net Gelişim Çizgi Grafiği (Tüm TYT Dersleri Dahil)
  static renderTytChart(canvasId, exams, targetNet, period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("tytPeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const allTyt = (exams || []).filter(e => e.type === "TYT");
    const tytExams = this.filterByPeriod(allTyt, currentPeriod);

    if (tytExams.length === 0) {
      this.renderEmptyState(canvasId, "Seçili dönemde TYT deneme verisi bulunmuyor.");
      return;
    }

    const labels = tytExams.map(e => e.name || e.date);
    const dataNets = tytExams.map(e => e.totalNet);
    const turkceNets = tytExams.map(e => e.tyt?.turkce?.net || 0);
    const matNets = tytExams.map(e => e.tyt?.matematik?.net || 0);
    const fenNets = tytExams.map(e => e.tyt?.fen?.net || 0);
    const sosyalNets = tytExams.map(e => e.tyt?.sosyal?.net || 0);

    const filterVal = document.getElementById("tytChartSubjectFilter")?.value || "summary";
    const isHidden = (key) => {
      if (filterVal === "all") return false;
      if (filterVal === "summary") return true;
      return filterVal !== key;
    };

    this.instances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Toplam TYT Neti",
            data: dataNets,
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79, 70, 229, 0.12)",
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#4f46e5",
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: "Hedef Net (" + targetNet + ")",
            data: Array(labels.length).fill(targetNet),
            borderColor: "#ef4444",
            borderDash: [6, 6],
            borderWidth: 2,
            fill: false,
            pointRadius: 0
          },
          {
            label: "TYT Türkçe",
            data: turkceNets,
            borderColor: "#10b981",
            backgroundColor: "#10b981",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            hidden: isHidden("turkce"),
            pointRadius: 4
          },
          {
            label: "TYT Matematik",
            data: matNets,
            borderColor: "#0284c7",
            backgroundColor: "#0284c7",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            hidden: isHidden("matematik"),
            pointRadius: 4
          },
          {
            label: "TYT Fen Bilimleri",
            data: fenNets,
            borderColor: "#8b5cf6",
            backgroundColor: "#8b5cf6",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            hidden: isHidden("fen"),
            pointRadius: 4
          },
          {
            label: "TYT Sosyal Bilimler",
            data: sosyalNets,
            borderColor: "#f59e0b",
            backgroundColor: "#f59e0b",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            hidden: isHidden("sosyal"),
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              boxWidth: 14,
              font: { family: "Inter, sans-serif", size: 12 },
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y} Net`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 120,
            grid: { color: "rgba(150, 150, 150, 0.1)" },
            ticks: { stepSize: 20 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // AYT Net Gelişim Çizgi Grafiği
  static renderAytChart(canvasId, exams, targetNet, field = "Sayısal", period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("aytPeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const allAyt = (exams || []).filter(e => e.type === "AYT");
    const aytExams = this.filterByPeriod(allAyt, currentPeriod);

    if (aytExams.length === 0) {
      this.renderEmptyState(canvasId, "Seçili dönemde AYT deneme verisi bulunmuyor.");
      return;
    }

    const labels = aytExams.map(e => e.name || e.date);
    const dataNets = aytExams.map(e => e.totalNet);
    const matNets = aytExams.map(e => e.ayt?.matematik?.net || 0);

    const isEa = field === "Eşit Ağırlık" || aytExams.some(e => e.ayt?.edebiyat !== undefined);

    const filterVal = document.getElementById("aytChartSubjectFilter")?.value || "summary";
    const isHidden = (key) => {
      if (filterVal === "all") return false;
      if (filterVal === "summary") return true;
      return filterVal !== key;
    };

    const datasets = [
      {
        label: "Toplam AYT Neti",
        data: dataNets,
        borderColor: "#059669",
        backgroundColor: "rgba(5, 150, 105, 0.12)",
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#059669",
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: "Hedef Net (" + targetNet + ")",
        data: Array(labels.length).fill(targetNet),
        borderColor: "#ef4444",
        borderDash: [6, 6],
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      },
      {
        label: "AYT Matematik",
        data: matNets,
        borderColor: "#0284c7",
        backgroundColor: "#0284c7",
        borderWidth: 2,
        fill: false,
        tension: 0.2,
        hidden: isHidden("matematik"),
        pointRadius: 4
      }
    ];

    if (isEa) {
      datasets.push(
        {
          label: "Edebiyat",
          data: aytExams.map(e => e.ayt?.edebiyat?.net || 0),
          borderColor: "#d97706",
          backgroundColor: "#d97706",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("fizik"), // Dropdown'daki 1. alan
          pointRadius: 4
        },
        {
          label: "Tarih-1",
          data: aytExams.map(e => e.ayt?.tarih1?.net || 0),
          borderColor: "#dc2626",
          backgroundColor: "#dc2626",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("kimya"), // Dropdown'daki 2. alan
          pointRadius: 4
        },
        {
          label: "Coğrafya-1",
          data: aytExams.map(e => e.ayt?.cografya1?.net || 0),
          borderColor: "#14b8a6",
          backgroundColor: "#14b8a6",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("biyoloji"), // Dropdown'daki 3. alan
          pointRadius: 4
        }
      );
    } else {
      // Sayısal (Varsayılan Fen Lisesi)
      datasets.push(
        {
          label: "AYT Fizik",
          data: aytExams.map(e => e.ayt?.fizik?.net || 0),
          borderColor: "#f59e0b",
          backgroundColor: "#f59e0b",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("fizik"),
          pointRadius: 4
        },
        {
          label: "AYT Kimya",
          data: aytExams.map(e => e.ayt?.kimya?.net || 0),
          borderColor: "#ec4899",
          backgroundColor: "#ec4899",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("kimya"),
          pointRadius: 4
        },
        {
          label: "AYT Biyoloji",
          data: aytExams.map(e => e.ayt?.biyoloji?.net || 0),
          borderColor: "#8b5cf6",
          backgroundColor: "#8b5cf6",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("biyoloji"),
          pointRadius: 4
        }
      );
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              boxWidth: 14,
              font: { family: "Inter, sans-serif", size: 12 },
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y} Net`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 80,
            grid: { color: "rgba(150, 150, 150, 0.1)" },
            ticks: { stepSize: 10 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // TYT Ders Filtresi Dinamik Tetikleyici
  static filterTytDatasets(filterType) {
    const chart = this.instances["chartTytDashboard"];
    if (!chart) return;

    chart.data.datasets.forEach((ds, idx) => {
      if (idx === 0 || idx === 1) {
        ds.hidden = false;
        return;
      }
      if (filterType === "all") {
        ds.hidden = false;
      } else if (filterType === "summary") {
        ds.hidden = true;
      } else if (filterType === "turkce") {
        ds.hidden = !ds.label.includes("Türkçe");
      } else if (filterType === "matematik") {
        ds.hidden = !ds.label.includes("Matematik");
      } else if (filterType === "fen") {
        ds.hidden = !ds.label.includes("Fen");
      } else if (filterType === "sosyal") {
        ds.hidden = !ds.label.includes("Sosyal");
      }
    });
    chart.update();
  }

  // AYT Ders Filtresi Dinamik Tetikleyici
  static filterAytDatasets(filterType) {
    const chart = this.instances["chartAytDashboard"];
    if (!chart) return;

    chart.data.datasets.forEach((ds, idx) => {
      if (idx === 0 || idx === 1) {
        ds.hidden = false;
        return;
      }
      if (filterType === "all") {
        ds.hidden = false;
      } else if (filterType === "summary") {
        ds.hidden = true;
      } else if (filterType === "matematik") {
        ds.hidden = !ds.label.includes("Matematik");
      } else if (filterType === "fizik") {
        ds.hidden = !(ds.label.includes("Fizik") || ds.label.includes("Edebiyat"));
      } else if (filterType === "kimya") {
        ds.hidden = !(ds.label.includes("Kimya") || ds.label.includes("Tarih"));
      } else if (filterType === "biyoloji") {
        ds.hidden = !(ds.label.includes("Biyoloji") || ds.label.includes("Coğrafya"));
      }
    });
    chart.update();
  }

  // Ders Bazlı Dağılım Radar / Bar Grafiği
  static renderSubjectRadar(canvasId, student, period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("radarPeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const allTyt = (student.exams || []).filter(e => e.type === "TYT");
    const filteredTyt = this.filterByPeriod(allTyt, currentPeriod);

    const lastTyt = [...filteredTyt].pop();
    if (!lastTyt || !lastTyt.tyt) {
      this.renderEmptyState(canvasId, "Seçili dönemde TYT denemesi bulunamadı.");
      return;
    }

    const tyt = lastTyt.tyt;
    const labels = ["Türkçe (% Net)", "Temel Mat (% Net)", "Sosyal (% Net)", "Fen (% Net)"];
    const percentages = [
      Math.round(((tyt.turkce?.net || 0) / 40) * 100),
      Math.round(((tyt.matematik?.net || 0) / 40) * 100),
      Math.round(((tyt.sosyal?.net || 0) / 20) * 100),
      Math.round(((tyt.fen?.net || 0) / 20) * 100)
    ];

    this.instances[canvasId] = new Chart(ctx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Son TYT Başarı Yüzdesi (%)",
            data: percentages,
            borderColor: "#7c3aed",
            backgroundColor: "rgba(124, 58, 237, 0.2)",
            borderWidth: 2,
            pointBackgroundColor: "#7c3aed",
            pointRadius: 5
          },
          {
            label: "%100 Başarı Kotası",
            data: [100, 100, 100, 100],
            borderColor: "rgba(200, 200, 200, 0.4)",
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, display: false },
            grid: { color: "rgba(150, 150, 150, 0.15)" }
          }
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } }
        }
      }
    });
  }

  // AYT Branş Başarı Dağılımı Radar Grafiği
  static renderAytSubjectRadar(canvasId, student, period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("aytRadarPeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const allAyt = (student.exams || []).filter(e => e.type === "AYT");
    const filteredAyt = this.filterByPeriod(allAyt, currentPeriod);

    const lastAyt = [...filteredAyt].pop();
    if (!lastAyt || !lastAyt.ayt) {
      this.renderEmptyState(canvasId, "Seçili dönemde AYT denemesi bulunamadı.");
      return;
    }

    const ayt = lastAyt.ayt;
    let labels = [];
    let percentages = [];

    if (student.field === "Eşit Ağırlık" || (ayt.edebiyat && !ayt.fizik)) {
      labels = ["AYT Matematik (% Net)", "Edebiyat (% Net)", "Tarih-1 (% Net)", "Coğrafya-1 (% Net)"];
      percentages = [
        Math.min(100, Math.max(0, Math.round(((ayt.matematik?.net || 0) / 40) * 100))),
        Math.min(100, Math.max(0, Math.round(((ayt.edebiyat?.net || 0) / 24) * 100))),
        Math.min(100, Math.max(0, Math.round(((ayt.tarih1?.net || 0) / 10) * 100))),
        Math.min(100, Math.max(0, Math.round(((ayt.cografya1?.net || 0) / 6) * 100)))
      ];
    } else {
      // Sayısal (Varsayılan Fen Lisesi)
      labels = ["AYT Matematik (% Net)", "Fizik (% Net)", "Kimya (% Net)", "Biyoloji (% Net)"];
      percentages = [
        Math.min(100, Math.max(0, Math.round(((ayt.matematik?.net || 0) / 40) * 100))),
        Math.min(100, Math.max(0, Math.round(((ayt.fizik?.net || 0) / 14) * 100))),
        Math.min(100, Math.max(0, Math.round(((ayt.kimya?.net || 0) / 13) * 100))),
        Math.min(100, Math.max(0, Math.round(((ayt.biyoloji?.net || 0) / 13) * 100)))
      ];
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Son AYT Başarı Yüzdesi (%)",
            data: percentages,
            borderColor: "#059669",
            backgroundColor: "rgba(5, 150, 105, 0.2)",
            borderWidth: 2,
            pointBackgroundColor: "#059669",
            pointRadius: 5
          },
          {
            label: "%100 Başarı Kotası",
            data: labels.map(() => 100),
            borderColor: "rgba(200, 200, 200, 0.4)",
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, display: false },
            grid: { color: "rgba(150, 150, 150, 0.15)" }
          }
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } }
        }
      }
    });
  }

  // Haftalık Soru Çözüm Dağılımı (Bar Chart)
  static renderWeeklyQuestionsChart(canvasId, questionLogs, period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("questionsPeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const logs = this.filterByPeriod(questionLogs || [], currentPeriod);

    if (!logs || logs.length === 0) {
      this.renderEmptyState(canvasId, "Seçili dönemde soru çözüm verisi bulunamadı.");
      return;
    }

    // Ders bazlı soru sayılarını topla
    const subjectMap = {};
    logs.forEach(l => {
      const sub = l.subject || "Diğer";
      subjectMap[sub] = (subjectMap[sub] || 0) + (Number(l.count) || 0);
    });

    const labels = Object.keys(subjectMap);
    const dataCounts = Object.values(subjectMap);

    const colors = [
      "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
      "#8b5cf6", "#64748b", "#14b8a6", "#f97316"
    ];

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Toplam Çözülen Soru",
            data: dataCounts,
            backgroundColor: colors.slice(0, labels.length),
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y} Soru`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(150, 150, 150, 0.1)" }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // Ders Devamsızlık Dağılımı (Saat) Bar Grafiği
  static renderAttendanceChart(canvasId, courseAttendance, period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("attendancePeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const records = this.filterByPeriod(courseAttendance || [], currentPeriod);

    let ozursuz = 0;
    let ozurlu = 0;
    let izinli = 0;

    records.forEach(r => {
      const h = Number(r.hours) || 0;
      const t = (r.type || "").toLowerCase();
      if (t.includes("özürsüz") || t.includes("ozursuz") || t.includes("mazeretsiz")) {
        ozursuz += h;
      } else if (t.includes("özürlü") || t.includes("rapor") || t.includes("sevk")) {
        ozurlu += h;
      } else {
        izinli += h;
      }
    });

    const totalHours = ozursuz + ozurlu + izinli;
    if (totalHours === 0) {
      this.renderEmptyState(canvasId, "Kayıtlı devamsızlık bulunmuyor (Tam Devam).");
      return;
    }

    const labels = ["Özürsüz", "Özürlü / Raporlu", "İzinli / Görevli"];
    const dataValues = [ozursuz, ozurlu, izinli];

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Devamsızlık (Ders Saati)",
            data: dataValues,
            backgroundColor: ["#ef4444", "#f59e0b", "#0284c7"],
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y} Saat Devamsızlık`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(150, 150, 150, 0.1)" },
            ticks: { stepSize: 2 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  static renderEmptyState(canvasId, message) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const parent = ctx.parentElement;
    const existing = parent.querySelector(".chart-empty-msg");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.className = "chart-empty-msg";
    div.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:14px;pointer-events:none;";
    div.innerText = message;
    parent.style.position = "relative";
    parent.appendChild(div);
  }
}

window.ChartManager = ChartManager;
