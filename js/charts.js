// Öğrenci Koçluk Sistemi - Grafik Yöneticisi (Chart.js)

class ChartManager {
  static instances = {};

  static destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  }

  static MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  // Dönem seçeneklerini (Genel + Ocak..Aralık) doldurur
  static populatePeriodSelect(el) {
    if (!el) return;
    const prev = el.value;
    el.innerHTML = '<option value="all">Genel (Tümü)</option>' +
      this.MONTH_NAMES.map((n, i) => `<option value="m${i + 1}">${n}</option>`).join("");
    el.value = [...el.options].some(o => o.value === prev) ? prev : "all";
  }

  // Tarih Filtresi Yardımcısı (Genel / Ay bazlı)
  static filterByPeriod(items, period, dateField = "date") {
    if (!items || items.length === 0) return [];
    if (!period || period === "all") return items;

    const mm = /^m(\d{1,2})$/.exec(period);
    if (mm) {
      const month = parseInt(mm[1], 10) - 1;
      return items.filter(item => {
        if (!item || !item[dateField]) return false;
        const d = new Date(item[dateField]);
        return !isNaN(d.getTime()) && d.getMonth() === month;
      });
    }

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

  static getSavedVisibility(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  }

  static saveVisibility(key, map) {
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {}
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

    // Toplu Öğrenci Seçili ise denemeleri birleştir ve ortalamaları hesapla
    let finalTyt = tytExams;
    if (window.store?.getActiveStudent()?.isAggregate) {
      const grouped = {};
      tytExams.forEach(e => {
        const k = e.name || e.date;
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(e);
      });
      finalTyt = Object.keys(grouped).map(k => {
        const grp = grouped[k];
        const len = grp.length;
        const totalNet = Number((grp.reduce((s, x) => s + (x.totalNet || 0), 0) / len).toFixed(2));
        const turkNet = Number((grp.reduce((s, x) => s + (x.tyt?.turkce?.net || 0), 0) / len).toFixed(2));
        const matNet = Number((grp.reduce((s, x) => s + (x.tyt?.matematik?.net || 0), 0) / len).toFixed(2));
        const fenNet = Number((grp.reduce((s, x) => s + (x.tyt?.fen?.net || 0), 0) / len).toFixed(2));
        const sosNet = Number((grp.reduce((s, x) => s + (x.tyt?.sosyal?.net || 0), 0) / len).toFixed(2));
        return {
          name: `${k} (Ort.)`,
          date: grp[0].date,
          totalNet,
          tyt: {
            turkce: { net: turkNet },
            matematik: { net: matNet },
            fen: { net: fenNet },
            sosyal: { net: sosNet }
          }
        };
      });
    }

    const labels = finalTyt.map(e => e.name || e.date);
    const dataNets = finalTyt.map(e => e.totalNet);
    const turkceNets = finalTyt.map(e => e.tyt?.turkce?.net || 0);
    const matNets = finalTyt.map(e => e.tyt?.matematik?.net || 0);
    const fenNets = finalTyt.map(e => e.tyt?.fen?.net || 0);
    const sosyalNets = finalTyt.map(e => e.tyt?.sosyal?.net || 0);

    const savedVis = this.getSavedVisibility("ngfl_tyt_visibility") || {};
    const filterSelect = document.getElementById("tytChartSubjectFilter");
    if (filterSelect && localStorage.getItem("ngfl_tyt_filter_val")) {
      filterSelect.value = localStorage.getItem("ngfl_tyt_filter_val");
    }
    const filterVal = filterSelect?.value || "summary";
    const isHidden = (key, label) => {
      if (savedVis[label] !== undefined) return !savedVis[label];
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
            hidden: isHidden("turkce", "TYT Türkçe"),
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
            hidden: isHidden("matematik", "TYT Matematik"),
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
            hidden: isHidden("fen", "TYT Fen Bilimleri"),
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
            hidden: isHidden("sosyal", "TYT Sosyal Bilimler"),
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
            },
            onClick: (e, legendItem, legend) => {
              Chart.defaults.plugins.legend.onClick(e, legendItem, legend);
              const chart = legend.chart;
              const map = ChartManager.getSavedVisibility("ngfl_tyt_visibility") || {};
              chart.data.datasets.forEach((ds, i) => {
                map[ds.label] = chart.isDatasetVisible(i);
              });
              ChartManager.saveVisibility("ngfl_tyt_visibility", map);
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

    // Toplu Öğrenci Seçili ise denemeleri birleştir ve ortalamaları hesapla
    let finalAyt = aytExams;
    if (window.store?.getActiveStudent()?.isAggregate) {
      const grouped = {};
      aytExams.forEach(e => {
        const k = e.name || e.date;
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(e);
      });
      finalAyt = Object.keys(grouped).map(k => {
        const grp = grouped[k];
        const len = grp.length;
        const totalNet = Number((grp.reduce((s, x) => s + (x.totalNet || 0), 0) / len).toFixed(2));
        const matNet = Number((grp.reduce((s, x) => s + (x.ayt?.matematik?.net || 0), 0) / len).toFixed(2));
        const fizNet = Number((grp.reduce((s, x) => s + (x.ayt?.fizik?.net || 0), 0) / len).toFixed(2));
        const kimNet = Number((grp.reduce((s, x) => s + (x.ayt?.kimya?.net || 0), 0) / len).toFixed(2));
        const biyNet = Number((grp.reduce((s, x) => s + (x.ayt?.biyoloji?.net || 0), 0) / len).toFixed(2));
        const edbNet = Number((grp.reduce((s, x) => s + (x.ayt?.edebiyat?.net || 0), 0) / len).toFixed(2));
        const tarNet = Number((grp.reduce((s, x) => s + (x.ayt?.tarih1?.net || 0), 0) / len).toFixed(2));
        const cogNet = Number((grp.reduce((s, x) => s + (x.ayt?.cografya1?.net || 0), 0) / len).toFixed(2));
        return {
          name: `${k} (Ort.)`,
          date: grp[0].date,
          totalNet,
          ayt: {
            matematik: { net: matNet },
            fizik: { net: fizNet },
            kimya: { net: kimNet },
            biyoloji: { net: biyNet },
            edebiyat: { net: edbNet },
            tarih1: { net: tarNet },
            cografya1: { net: cogNet }
          }
        };
      });
    }

    const labels = finalAyt.map(e => e.name || e.date);
    const dataNets = finalAyt.map(e => e.totalNet);
    const matNets = finalAyt.map(e => e.ayt?.matematik?.net || 0);

    const isEa = field === "Eşit Ağırlık" || finalAyt.some(e => e.ayt?.edebiyat !== undefined);

    const savedVis = this.getSavedVisibility("ngfl_ayt_visibility") || {};
    const filterSelect = document.getElementById("aytChartSubjectFilter");
    if (filterSelect && localStorage.getItem("ngfl_ayt_filter_val")) {
      filterSelect.value = localStorage.getItem("ngfl_ayt_filter_val");
    }
    const filterVal = filterSelect?.value || "summary";
    const isHidden = (key, label) => {
      if (savedVis[label] !== undefined) return !savedVis[label];
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
        hidden: isHidden("matematik", "AYT Matematik"),
        pointRadius: 4
      }
    ];

    if (isEa) {
      datasets.push(
        {
          label: "Edebiyat",
          data: finalAyt.map(e => e.ayt?.edebiyat?.net || 0),
          borderColor: "#d97706",
          backgroundColor: "#d97706",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("fizik", "Edebiyat"),
          pointRadius: 4
        },
        {
          label: "Tarih-1",
          data: finalAyt.map(e => e.ayt?.tarih1?.net || 0),
          borderColor: "#dc2626",
          backgroundColor: "#dc2626",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("kimya", "Tarih-1"),
          pointRadius: 4
        },
        {
          label: "Coğrafya-1",
          data: finalAyt.map(e => e.ayt?.cografya1?.net || 0),
          borderColor: "#14b8a6",
          backgroundColor: "#14b8a6",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("biyoloji", "Coğrafya-1"),
          pointRadius: 4
        }
      );
    } else {
      // Sayısal (Varsayılan Fen Lisesi)
      datasets.push(
        {
          label: "AYT Fizik",
          data: finalAyt.map(e => e.ayt?.fizik?.net || 0),
          borderColor: "#d97706",
          backgroundColor: "#d97706",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("fizik", "AYT Fizik"),
          pointRadius: 4
        },
        {
          label: "AYT Kimya",
          data: finalAyt.map(e => e.ayt?.kimya?.net || 0),
          borderColor: "#dc2626",
          backgroundColor: "#dc2626",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("kimya", "AYT Kimya"),
          pointRadius: 4
        },
        {
          label: "AYT Biyoloji",
          data: finalAyt.map(e => e.ayt?.biyoloji?.net || 0),
          borderColor: "#14b8a6",
          backgroundColor: "#14b8a6",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          hidden: isHidden("biyoloji", "AYT Biyoloji"),
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
            },
            onClick: (e, legendItem, legend) => {
              Chart.defaults.plugins.legend.onClick(e, legendItem, legend);
              const chart = legend.chart;
              const map = ChartManager.getSavedVisibility("ngfl_ayt_visibility") || {};
              chart.data.datasets.forEach((ds, i) => {
                map[ds.label] = chart.isDatasetVisible(i);
              });
              ChartManager.saveVisibility("ngfl_ayt_visibility", map);
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
    try {
      localStorage.setItem("ngfl_tyt_filter_val", filterType);
    } catch (e) {}

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

    const map = this.getSavedVisibility("ngfl_tyt_visibility") || {};
    chart.data.datasets.forEach((ds, i) => {
      map[ds.label] = !ds.hidden;
    });
    this.saveVisibility("ngfl_tyt_visibility", map);
    chart.update();
  }

  // AYT Ders Filtresi Dinamik Tetikleyici
  static filterAytDatasets(filterType) {
    try {
      localStorage.setItem("ngfl_ayt_filter_val", filterType);
    } catch (e) {}

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

    const map = this.getSavedVisibility("ngfl_ayt_visibility") || {};
    chart.data.datasets.forEach((ds, i) => {
      map[ds.label] = !ds.hidden;
    });
    this.saveVisibility("ngfl_ayt_visibility", map);
    chart.update();
  }

  // Ders Bazlı Dağılım Radar / Bar Grafiği
  static renderSubjectRadar(canvasId, student, period = null) {
    this.destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const currentPeriod = period || document.getElementById("radarPeriodSelect")?.value || document.getElementById("filterDashboardPeriod")?.value || "all";
    const labels = ["Türkçe (% Net)", "Temel Mat (% Net)", "Sosyal (% Net)", "Fen (% Net)"];
    let percentages = [0, 0, 0, 0];

    if (student.isAggregate) {
      const students = window.store?.getFilteredStudents ? window.store.getFilteredStudents(window.store.filterGrade, window.store.filterSection) : [];
      let count = 0, sumTr = 0, sumMat = 0, sumSos = 0, sumFen = 0;
      students.forEach(s => {
        const sTyt = (s.exams || []).filter(e => e.type === "TYT");
        const filtered = this.filterByPeriod(sTyt, currentPeriod);
        const last = [...filtered].pop();
        if (last && last.tyt) {
          sumTr += Math.round(((last.tyt.turkce?.net || 0) / 40) * 100);
          sumMat += Math.round(((last.tyt.matematik?.net || 0) / 40) * 100);
          sumSos += Math.round(((last.tyt.sosyal?.net || 0) / 20) * 100);
          sumFen += Math.round(((last.tyt.fen?.net || 0) / 20) * 100);
          count++;
        }
      });
      if (count === 0) {
        this.renderEmptyState(canvasId, "Seçili dönemde TYT denemesi bulunamadı.");
        return;
      }
      percentages = [
        Math.min(100, Math.round(sumTr / count)),
        Math.min(100, Math.round(sumMat / count)),
        Math.min(100, Math.round(sumSos / count)),
        Math.min(100, Math.round(sumFen / count))
      ];
    } else {
      const allTyt = (student.exams || []).filter(e => e.type === "TYT");
      const filteredTyt = this.filterByPeriod(allTyt, currentPeriod);
      const lastTyt = [...filteredTyt].pop();
      if (!lastTyt || !lastTyt.tyt) {
        this.renderEmptyState(canvasId, "Seçili dönemde TYT denemesi bulunamadı.");
        return;
      }
      const tyt = lastTyt.tyt;
      percentages = [
        Math.round(((tyt.turkce?.net || 0) / 40) * 100),
        Math.round(((tyt.matematik?.net || 0) / 40) * 100),
        Math.round(((tyt.sosyal?.net || 0) / 20) * 100),
        Math.round(((tyt.fen?.net || 0) / 20) * 100)
      ];
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: student.isAggregate ? "Sınıf Ortalaması Başarı (%)" : "Son TYT Başarı Yüzdesi (%)",
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
    let labels = [];
    let percentages = [];

    if (student.isAggregate) {
      const students = window.store?.getFilteredStudents ? window.store.getFilteredStudents(window.store.filterGrade, window.store.filterSection) : [];
      let count = 0, sumMat = 0, sumFiz = 0, sumKim = 0, sumBiy = 0;
      students.forEach(s => {
        const sAyt = (s.exams || []).filter(e => e.type === "AYT");
        const filtered = this.filterByPeriod(sAyt, currentPeriod);
        const last = [...filtered].pop();
        if (last && last.ayt) {
          sumMat += Math.round(((last.ayt.matematik?.net || 0) / 40) * 100);
          sumFiz += Math.round(((last.ayt.fizik?.net || 0) / 14) * 100);
          sumKim += Math.round(((last.ayt.kimya?.net || 0) / 13) * 100);
          sumBiy += Math.round(((last.ayt.biyoloji?.net || 0) / 13) * 100);
          count++;
        }
      });
      if (count === 0) {
        this.renderEmptyState(canvasId, "Seçili dönemde AYT denemesi bulunamadı.");
        return;
      }
      labels = ["AYT Matematik (% Net)", "Fizik (% Net)", "Kimya (% Net)", "Biyoloji (% Net)"];
      percentages = [
        Math.min(100, Math.round(sumMat / count)),
        Math.min(100, Math.round(sumFiz / count)),
        Math.min(100, Math.round(sumKim / count)),
        Math.min(100, Math.round(sumBiy / count))
      ];
    } else {
      const allAyt = (student.exams || []).filter(e => e.type === "AYT");
      const filteredAyt = this.filterByPeriod(allAyt, currentPeriod);
      const lastAyt = [...filteredAyt].pop();
      if (!lastAyt || !lastAyt.ayt) {
        this.renderEmptyState(canvasId, "Seçili dönemde AYT denemesi bulunamadı.");
        return;
      }
      const ayt = lastAyt.ayt;
      if (student.field === "Eşit Ağırlık" || (ayt.edebiyat && !ayt.fizik)) {
        labels = ["AYT Matematik (% Net)", "Edebiyat (% Net)", "Tarih-1 (% Net)", "Coğrafya-1 (% Net)"];
        percentages = [
          Math.min(100, Math.max(0, Math.round(((ayt.matematik?.net || 0) / 40) * 100))),
          Math.min(100, Math.max(0, Math.round(((ayt.edebiyat?.net || 0) / 24) * 100))),
          Math.min(100, Math.max(0, Math.round(((ayt.tarih1?.net || 0) / 10) * 100))),
          Math.min(100, Math.max(0, Math.round(((ayt.cografya1?.net || 0) / 6) * 100)))
        ];
      } else {
        labels = ["AYT Matematik (% Net)", "Fizik (% Net)", "Kimya (% Net)", "Biyoloji (% Net)"];
        percentages = [
          Math.min(100, Math.max(0, Math.round(((ayt.matematik?.net || 0) / 40) * 100))),
          Math.min(100, Math.max(0, Math.round(((ayt.fizik?.net || 0) / 14) * 100))),
          Math.min(100, Math.max(0, Math.round(((ayt.kimya?.net || 0) / 13) * 100))),
          Math.min(100, Math.max(0, Math.round(((ayt.biyoloji?.net || 0) / 13) * 100)))
        ];
      }
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
