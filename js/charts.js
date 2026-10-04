// Öğrenci Koçluk Sistemi - Grafik Yöneticisi (Chart.js)

class ChartManager {
  static instances = {};

  static destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  }

  // TYT Net Gelişim Çizgi Grafiği
  static renderTytChart(canvasId, exams, targetNet) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const tytExams = (exams || []).filter(e => e.type === "TYT");
    if (tytExams.length === 0) {
      this.renderEmptyState(canvasId, "Henüz TYT deneme verisi girilmedi.");
      return;
    }

    const labels = tytExams.map(e => e.name || e.date);
    const dataNets = tytExams.map(e => e.totalNet);
    const turkceNets = tytExams.map(e => e.tyt?.turkce?.net || 0);
    const matNets = tytExams.map(e => e.tyt?.matematik?.net || 0);
    const fenNets = tytExams.map(e => e.tyt?.fen?.net || 0);
    const sosyalNets = tytExams.map(e => e.tyt?.sosyal?.net || 0);

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
            label: "TYT Matematik",
            data: matNets,
            borderColor: "#0284c7",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            hidden: true,
            pointRadius: 4
          },
          {
            label: "TYT Türkçe",
            data: turkceNets,
            borderColor: "#10b981",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            hidden: true,
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
            labels: { boxWidth: 14, font: { family: "Inter, sans-serif", size: 12 } }
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
  static renderAytChart(canvasId, exams, targetNet) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const aytExams = (exams || []).filter(e => e.type === "AYT");
    if (aytExams.length === 0) {
      this.renderEmptyState(canvasId, "Henüz AYT deneme verisi girilmedi.");
      return;
    }

    const labels = aytExams.map(e => e.name || e.date);
    const dataNets = aytExams.map(e => e.totalNet);

    this.instances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
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
            labels: { boxWidth: 14, font: { family: "Inter, sans-serif", size: 12 } }
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

  // Ders Bazlı Dağılım Radar / Bar Grafiği
  static renderSubjectRadar(canvasId, student) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const lastTyt = [...(student.exams || [])].filter(e => e.type === "TYT").pop();
    if (!lastTyt || !lastTyt.tyt) {
      this.renderEmptyState(canvasId, "Ders dağılımı için TYT denemesi bulunamadı.");
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

  // Haftalık Soru Çözüm Dağılımı (Bar Chart)
  static renderWeeklyQuestionsChart(canvasId, questionLogs) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (!questionLogs || questionLogs.length === 0) {
      this.renderEmptyState(canvasId, "Soru çözüm verisi bulunamadı.");
      return;
    }

    // Ders bazlı soru sayılarını topla
    const subjectMap = {};
    questionLogs.forEach(l => {
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
