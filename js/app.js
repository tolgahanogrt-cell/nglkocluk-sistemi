// Öğrenci Koçluk Sistemi - Ana UI ve Uygulama Kontrolcüsü (App)

class App {
  constructor() {
    this.currentTab = "dashboard";
    this.initTheme();
    this.bindEvents();
    this.refreshAll();
  }

  // --- Tema Yönetimi ---
  initTheme() {
    const savedTheme = localStorage.getItem("kocluk_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeButton(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("kocluk_theme", next);
    this.updateThemeButton(next);
  }

  updateThemeButton(theme) {
    const icon = document.getElementById("themeIcon");
    if (icon) {
      icon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  // --- Olay Dinleyicileri ---
  bindEvents() {
    // Sekme Değişimi
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Tema Değiştirme
    document.getElementById("btnToggleTheme")?.addEventListener("click", () => this.toggleTheme());

    // Öğrenci Seçici Değişimi
    document.getElementById("studentSelect")?.addEventListener("change", (e) => {
      window.store.setActiveStudent(e.target.value);
      this.refreshAll();
      this.showToast("Öğrenci profili değiştirildi: " + window.store.getActiveStudent().name, "info");
    });

    // Hızlı Eylem Butonları
    document.getElementById("btnQuickAddExam")?.addEventListener("click", () => this.openModal("modalExam"));
    document.getElementById("btnQuickAddQuestion")?.addEventListener("click", () => this.openModal("modalQuestion"));
    document.getElementById("btnQuickKarne")?.addEventListener("click", () => this.switchTab("karne"));

    // Modal Açma Butonları
    document.getElementById("btnOpenNewStudentModal")?.addEventListener("click", () => this.openModal("modalStudent"));
    document.getElementById("btnOpenNewExamModal")?.addEventListener("click", () => this.openModal("modalExam"));
    document.getElementById("btnOpenNewQuestionModal")?.addEventListener("click", () => this.openModal("modalQuestion"));
    document.getElementById("btnOpenNewAttendanceModal")?.addEventListener("click", () => this.openModal("modalAttendance"));
    document.getElementById("btnOpenNewCoachingNoteModal")?.addEventListener("click", () => this.openModal("modalCoachingNote"));

    // Modal Kapatma Butonları
    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close");
        this.closeModal(modalId);
      });
    });

    // Modal Dışına Tıklama
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.closeModal(overlay.id);
      });
    });

    // Form Kayıt Butonları
    document.getElementById("btnSaveStudent")?.addEventListener("click", () => this.handleSaveStudent());
    document.getElementById("btnSaveExam")?.addEventListener("click", () => this.handleSaveExam());
    document.getElementById("btnSaveQuestion")?.addEventListener("click", () => this.handleSaveQuestion());
    document.getElementById("btnSaveAttendance")?.addEventListener("click", () => this.handleSaveAttendance());
    document.getElementById("btnSaveCoachingNote")?.addEventListener("click", () => this.handleSaveCoachingNote());

    // Sınav Türü Değişimi (TYT / AYT)
    document.getElementById("examTypeSelect")?.addEventListener("change", (e) => {
      this.handleExamTypeChange(e.target.value);
    });

    // Sınav Netlerini Canlı Hesaplama
    document.querySelectorAll(".calc-net").forEach(inp => {
      inp.addEventListener("input", () => this.calculateExamLiveNets());
    });

    // Dışa / İçe Aktarma Butonları
    document.getElementById("btnExportJson")?.addEventListener("click", () => {
      window.store.exportToJson();
      this.showToast("Veritabanı yedeği JSON olarak indirildi!", "success");
    });

    document.getElementById("jsonFileInput")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        window.store.importFromJson(file, (success, msg) => {
          if (success) {
            this.showToast(msg, "success");
            this.refreshAll();
          } else {
            this.showToast(msg, "danger");
          }
        });
      }
    });

    document.getElementById("btnResetDemo")?.addEventListener("click", () => {
      if (confirm("Mevcut veriler sıfırlanıp hazır demo veriler yüklensin mi?")) {
        window.store.resetToDemo();
        this.refreshAll();
        this.showToast("Örnek demo verileri başarıyla yüklendi!", "success");
      }
    });
  }

  // --- Sekme Değiştirici ---
  switchTab(tabId) {
    this.currentTab = tabId;

    // Menü aktif sınıfı
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    // Sayfa konteynerleri
    document.querySelectorAll(".page-container").forEach(page => {
      page.classList.remove("active");
    });
    const targetPage = document.getElementById("page-" + tabId);
    if (targetPage) targetPage.classList.add("active");

    // Başlık güncelleme
    const titles = {
      dashboard: { title: "Genel Bakış", sub: "Öğrenci gelişim ve koçluk paneli" },
      exams: { title: "Deneme Sınavları", sub: "TYT ve AYT sonuçları, ders netleri ve puan takibi" },
      questions: { title: "Soru Takip Çizelgesi", sub: "Ders bazlı soru çözüm hedefleri ve günlüğü" },
      attendance: { title: "Devamsızlık & Seanslar", sub: "Koçluk görüşmeleri, etüt katılımı ve ödevler" },
      analysis: { title: "İlerleme Analizi & Koç Zekası", sub: "Gelişim/gerileme tespiti, güçlü ve zayıf konular" },
      karne: { title: "Öğrenci Karnesi", sub: "Resmi gelişim karnesi ve yazdırılabilir rapor" },
      backup: { title: "Yedekle / Taşı", sub: "JSON veri yedekleme, Google Sites entegrasyonu" }
    };
    if (titles[tabId]) {
      document.getElementById("topbarTitle").textContent = titles[tabId].title;
      document.getElementById("topbarSubtitle").textContent = titles[tabId].sub;
    }

    // İlgili sekmeye özel render tetikleme
    if (tabId === "dashboard") {
      this.renderCharts();
    } else if (tabId === "analysis") {
      this.renderAnalysisDetails();
    } else if (tabId === "karne") {
      this.renderKarne();
    }
  }

  // --- Tüm Ekranı Yenileme ---
  refreshAll() {
    this.renderStudentSelector();
    const student = window.store.getActiveStudent();
    if (!student) {
      this.renderEmptyState();
      return;
    }

    this.renderHeroCard(student);
    this.renderKpis(student);
    this.renderExamsTable(student);
    this.renderQuestionsTable(student);
    this.renderAttendanceTable(student);
    this.renderCoachingNotes(student);
    this.renderCharts();
    this.renderAnalysisDetails();
    this.renderKarne();
  }

  // Öğrenci Açılır Menüsü
  renderStudentSelector() {
    const select = document.getElementById("studentSelect");
    if (!select) return;
    select.innerHTML = "";
    const students = window.store.getStudents();
    students.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.field})`;
      if (s.id === window.store.activeStudentId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // Hero Kartı
  renderHeroCard(student) {
    document.getElementById("heroName").textContent = student.name;
    document.getElementById("heroField").textContent = student.field;
    document.getElementById("heroGrade").textContent = student.grade;
    document.getElementById("heroTarget").textContent = `${student.targetUniversity} - ${student.targetDepartment}`;
    document.getElementById("heroTargetNets").textContent = `Hedef: TYT ${student.targetTytNet} Net | AYT ${student.targetAytNet} Net`;

    const tytCount = (student.exams || []).filter(e => e.type === "TYT").length;
    const aytCount = (student.exams || []).filter(e => e.type === "AYT").length;
    document.getElementById("heroExamCount").textContent = `${tytCount} TYT / ${aytCount} AYT`;

    const avatar = document.getElementById("heroAvatar");
    avatar.style.background = student.avatarColor || "#4f46e5";
    const initials = student.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    avatar.textContent = initials;
  }

  // KPI Kartları ve İlerleme Özeti
  renderKpis(student) {
    const stats = AnalyticsEngine.getStudentStats(student);
    const analysis = AnalyticsEngine.analyzeProgress(student);

    // Banner
    const badgeEl = document.getElementById("dashAnalysisBadge");
    const tipEl = document.getElementById("dashAnalysisMainTip");
    if (badgeEl && tipEl) {
      let badgeClass = "badge-info";
      if (analysis.statusType === "success") badgeClass = "badge-success";
      else if (analysis.statusType === "danger") badgeClass = "badge-danger";
      else if (analysis.statusType === "warning") badgeClass = "badge-warning";

      badgeEl.innerHTML = `<span class="badge ${badgeClass}">${analysis.status}</span>`;
      tipEl.textContent = analysis.recommendations[0] || "Deneme verilerini düzenli girmeye devam ediniz.";
    }

    // TYT KPI
    document.getElementById("kpiLastTyt").textContent = stats.lastTyt > 0 ? stats.lastTyt : "-";
    const tytTrendEl = document.getElementById("kpiTytTrend");
    if (stats.lastTyt > 0) {
      const diff = stats.tytTargetDiff;
      const sign = diff >= 0 ? "+" : "";
      const colorClass = diff >= 0 ? "trend-up" : "trend-down";
      tytTrendEl.innerHTML = `<span class="${colorClass}">${sign}${diff} Net</span> <span style="color:var(--text-muted);">(Hedefe Göre)</span>`;
    } else {
      tytTrendEl.innerHTML = `<span style="color:var(--text-muted);">Sınav bekleniyor</span>`;
    }

    // AYT KPI
    document.getElementById("kpiLastAyt").textContent = stats.lastAyt > 0 ? stats.lastAyt : "-";
    const aytTrendEl = document.getElementById("kpiAytTrend");
    if (stats.lastAyt > 0) {
      const diff = stats.aytTargetDiff;
      const sign = diff >= 0 ? "+" : "";
      const colorClass = diff >= 0 ? "trend-up" : "trend-down";
      aytTrendEl.innerHTML = `<span class="${colorClass}">${sign}${diff} Net</span> <span style="color:var(--text-muted);">(Hedefe Göre)</span>`;
    } else {
      aytTrendEl.innerHTML = `<span style="color:var(--text-muted);">Sınav bekleniyor</span>`;
    }

    // Soru KPI
    document.getElementById("kpiWeeklyQuestions").textContent = `${stats.weeklyQuestions} / ${student.targetWeeklyQuestions}`;
    const fill = document.getElementById("kpiWeeklyProgressFill");
    if (fill) {
      fill.style.width = `${stats.weeklyProgressPct}%`;
      fill.style.background = stats.weeklyProgressPct >= 80 ? "var(--secondary)" : "var(--accent)";
    }
    document.getElementById("kpiWeeklyPct").textContent = `%${stats.weeklyProgressPct} Tamamlandı (${stats.totalQuestions} Toplam)`;

    // Devamsızlık KPI
    document.getElementById("kpiAttendanceRate").textContent = `%${stats.attendanceRate}`;
    document.getElementById("kpiAttendanceDetails").textContent = `${stats.attendedCount}/${stats.attendanceTotal} Seansa Katıldı`;
  }

  // Grafikleri Çizme
  renderCharts() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    ChartManager.renderTytChart("chartTytDashboard", student.exams, student.targetTytNet);
    ChartManager.renderAytChart("chartAytDashboard", student.exams, student.targetAytNet);
    ChartManager.renderSubjectRadar("chartRadarDashboard", student);
    ChartManager.renderWeeklyQuestionsChart("chartQuestionsDashboard", student.questionLogs);
  }

  // Deneme Sınavları Tablosu
  renderExamsTable(student) {
    const tbody = document.getElementById("examsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const exams = student.exams || [];
    if (exams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:24px;">Henüz kaydedilmiş deneme sınavı bulunmuyor.</td></tr>`;
      return;
    }

    exams.forEach(ex => {
      let subjectSummary = "";
      if (ex.type === "TYT" && ex.tyt) {
        subjectSummary = `Tr: ${ex.tyt.turkce?.net || 0} | Mat: ${ex.tyt.matematik?.net || 0} | Sos: ${ex.tyt.sosyal?.net || 0} | Fen: ${ex.tyt.fen?.net || 0}`;
      } else if (ex.type === "AYT" && ex.ayt) {
        const parts = [];
        if (ex.ayt.matematik) parts.push(`Mat: ${ex.ayt.matematik.net}`);
        if (ex.ayt.fizik) parts.push(`Fiz: ${ex.ayt.fizik.net}`);
        if (ex.ayt.kimya) parts.push(`Kim: ${ex.ayt.kimya.net}`);
        if (ex.ayt.biyoloji) parts.push(`Biyo: ${ex.ayt.biyoloji.net}`);
        if (ex.ayt.edebiyat) parts.push(`Edb: ${ex.ayt.edebiyat.net}`);
        if (ex.ayt.tarih1) parts.push(`Tar1: ${ex.ayt.tarih1.net}`);
        if (ex.ayt.cografya1) parts.push(`Coğ1: ${ex.ayt.cografya1.net}`);
        subjectSummary = parts.join(" | ");
      }

      const badgeType = ex.type === "TYT" ? "badge-primary" : "badge-success";
      const stars = "⭐".repeat(ex.difficulty || 3);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ex.date}</td>
        <td><span class="badge ${badgeType}">${ex.type}</span></td>
        <td><strong>${ex.name}</strong></td>
        <td>${stars}</td>
        <td style="font-size:12px; color:var(--text-muted);">${subjectSummary}</td>
        <td><strong style="color:var(--primary); font-size:14px;">${ex.totalNet} Net</strong></td>
        <td><span class="badge badge-outline">${ex.estimatedScore} Puan</span></td>
        <td style="font-size:12px; color:var(--text-muted);">${ex.notes || "-"}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="app.deleteExam('${ex.id}')">Sil</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Soru Takip Tablosu
  renderQuestionsTable(student) {
    const tbody = document.getElementById("questionsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const stats = AnalyticsEngine.getStudentStats(student);
    document.getElementById("qTargetCount").textContent = `${student.targetWeeklyQuestions} Soru`;
    document.getElementById("qSolvedCount").textContent = `${stats.weeklyQuestions} soru çözüldü`;
    document.getElementById("qAccuracyRate").textContent = `%${stats.accuracyRate} Doğruluk Oranı`;
    document.getElementById("qTargetProgressFill").style.width = `${stats.weeklyProgressPct}%`;

    const logs = student.questionLogs || [];
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:24px;">Henüz soru çözümü kaydı girilmedi.</td></tr>`;
      return;
    }

    logs.forEach(l => {
      const correct = Number(l.correct) || 0;
      const total = Number(l.count) || 0;
      const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.date}</td>
        <td><strong>${l.subject}</strong></td>
        <td>${l.count}</td>
        <td style="color:var(--secondary); font-weight:600;">${l.correct || 0}</td>
        <td style="color:var(--danger); font-weight:600;">${l.wrong || 0}</td>
        <td><span class="badge ${rate >= 75 ? 'badge-success' : 'badge-warning'}">%${rate}</span></td>
        <td>${l.duration ? l.duration + ' Dk' : '-'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="app.deleteQuestionLog('${l.id}')">Sil</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Devamsızlık Tablosu
  renderAttendanceTable(student) {
    const tbody = document.getElementById("attendanceTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const attendance = student.attendance || [];
    if (attendance.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">Henüz seans veya devamsızlık kaydı yok.</td></tr>`;
      return;
    }

    attendance.forEach(a => {
      let statusBadge = "badge-success";
      if (a.status === "İzinli") statusBadge = "badge-warning";
      else if (a.status === "Devamsız") statusBadge = "badge-danger";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.date}</td>
        <td><strong>${a.title}</strong></td>
        <td><span class="badge badge-outline">${a.type}</span></td>
        <td><span class="badge ${statusBadge}">${a.status}</span></td>
        <td style="font-size:12px; color:var(--text-muted);">${a.notes || "-"}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="app.deleteAttendance('${a.id}')">Sil</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Koçluk Notları Kartları
  renderCoachingNotes(student) {
    const container = document.getElementById("coachingNotesContainer");
    if (!container) return;
    container.innerHTML = "";

    const notes = student.coachingNotes || [];
    if (notes.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">Henüz haftalık koçluk notu eklenmedi.</p>`;
      return;
    }

    notes.forEach(n => {
      const card = document.createElement("div");
      card.style.cssText = "background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:16px; margin-bottom:12px;";
      
      const assignmentsHtml = (n.assignments || []).map(a => `<li style="margin-left:18px; margin-top:4px;">${a}</li>`).join("");

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <strong style="font-size:14px;">Görüşme Tarihi: ${n.date}</strong>
            <span class="badge badge-primary" style="margin-left:8px;">Motivasyon: ${n.studentMotivation}/10</span>
          </div>
          <span class="badge badge-outline">Koç Değerlendirmesi: ${n.coachMood || 'İyi'}</span>
        </div>
        <p style="font-size:13px; color:var(--text-main); margin-bottom:10px;">${n.summary}</p>
        ${assignmentsHtml ? `
          <div style="font-size:12px; color:var(--text-muted);">
            <strong>Verilen Ödev ve Hedefler:</strong>
            <ul style="margin-top:4px;">${assignmentsHtml}</ul>
          </div>
        ` : ''}
      `;
      container.appendChild(card);
    });
  }

  // İlerleme Analizi Sayfası Detayları
  renderAnalysisDetails() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    const analysis = AnalyticsEngine.analyzeProgress(student);

    // Durum rozeti
    const badgeDetail = document.getElementById("analysisStatusBadgeDetail");
    if (badgeDetail) {
      let bClass = "badge-info";
      if (analysis.statusType === "success") bClass = "badge-success";
      else if (analysis.statusType === "danger") bClass = "badge-danger";
      else if (analysis.statusType === "warning") bClass = "badge-warning";
      badgeDetail.innerHTML = `<span class="badge ${bClass}" style="font-size:14px; padding:6px 14px;">${analysis.status}</span>`;
    }

    // Güçlü Dersler Listesi
    const sList = document.getElementById("strengthsList");
    if (sList) {
      sList.innerHTML = "";
      if (analysis.strengths.length === 0) {
        sList.innerHTML = `<span style="color:var(--text-muted);">Henüz %70 üzeri barajı geçen ders verisi yok.</span>`;
      } else {
        analysis.strengths.forEach(s => {
          sList.innerHTML += `<div><strong>${s.subject}:</strong> ${s.net} Net (%${s.rate} Başarı)</div>`;
        });
      }
    }

    // Zayıf Dersler Listesi
    const wList = document.getElementById("weaknessesList");
    if (wList) {
      wList.innerHTML = "";
      if (analysis.weaknesses.length === 0) {
        wList.innerHTML = `<span style="color:var(--text-muted);">Kritik düşüş gösteren ders bulunmuyor.</span>`;
      } else {
        analysis.weaknesses.forEach(w => {
          wList.innerHTML += `<div><strong>${w.subject}:</strong> ${w.net} Net (%${w.rate} Başarı) - <em>Acil Tekrar</em></div>`;
        });
      }
    }

    // Koç Tavsiyeleri
    const tipsList = document.getElementById("coachingTipsList");
    if (tipsList) {
      tipsList.innerHTML = "";
      analysis.recommendations.forEach(tip => {
        const item = document.createElement("div");
        item.className = "analysis-tip-item";
        item.innerHTML = `<span>💡</span><div>${tip}</div>`;
        tipsList.appendChild(item);
      });
    }
  }

  // Öğrenci Karnesi Render (Resmi Format)
  renderKarne() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    const stats = AnalyticsEngine.getStudentStats(student);
    const analysis = AnalyticsEngine.analyzeProgress(student);

    document.getElementById("karneReportDate").textContent = new Date().toLocaleDateString("tr-TR");
    document.getElementById("karneStudentName").textContent = student.name;
    document.getElementById("karneSignStudentName").textContent = student.name;
    document.getElementById("karneStudentField").textContent = `${student.grade} / ${student.field}`;
    document.getElementById("karneStudentTarget").textContent = `${student.targetUniversity} - ${student.targetDepartment}`;
    document.getElementById("karneStudentTargetNets").textContent = `TYT: ${student.targetTytNet} | AYT: ${student.targetAytNet} Net`;

    document.getElementById("karneTytSummary").textContent = `${stats.lastTyt} / ${stats.maxTyt} Net`;
    document.getElementById("karneAytSummary").textContent = `${stats.lastAyt} / ${stats.maxAyt} Net`;
    document.getElementById("karneTotalQuestions").textContent = `${stats.totalQuestions} Soru (%${stats.accuracyRate} Doğru)`;
    document.getElementById("karneAttendanceSummary").textContent = `%${stats.attendanceRate} (${stats.attendedCount}/${stats.attendanceTotal} Katılım)`;

    // Son 5 Sınav Tablosu
    const tbody = document.getElementById("karneExamsTableBody");
    if (tbody) {
      tbody.innerHTML = "";
      const last5 = (student.exams || []).slice(-5).reverse();
      if (last5.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Henüz sınav kaydı girilmedi.</td></tr>`;
      } else {
        last5.forEach((ex, idx) => {
          let summary = "";
          if (ex.type === "TYT" && ex.tyt) {
            summary = `Tr: ${ex.tyt.turkce?.net || 0} | Mat: ${ex.tyt.matematik?.net || 0} | Sos: ${ex.tyt.sosyal?.net || 0} | Fen: ${ex.tyt.fen?.net || 0}`;
          } else if (ex.type === "AYT" && ex.ayt) {
            const arr = [];
            if (ex.ayt.matematik) arr.push(`Mat: ${ex.ayt.matematik.net}`);
            if (ex.ayt.fizik) arr.push(`Fiz: ${ex.ayt.fizik.net}`);
            if (ex.ayt.edebiyat) arr.push(`Edb: ${ex.ayt.edebiyat.net}`);
            summary = arr.join(" | ");
          }

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${ex.date}</td>
            <td><strong>${ex.type}</strong></td>
            <td>${ex.name}</td>
            <td style="font-size:11px;">${summary}</td>
            <td><strong>${ex.totalNet} Net</strong></td>
            <td>${ex.estimatedScore}</td>
            <td>${idx === 0 ? 'Son Sınav (' + analysis.status + ')' : 'Stabil'}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // Koç Görüşü & Ödev Raporu
    const reviewBox = document.getElementById("karneCoachReviewText");
    if (reviewBox) {
      const latestNote = (student.coachingNotes || [])[0];
      const noteSummary = latestNote ? latestNote.summary : "Öğrenci genel olarak planlanan çalışma disiplinine uyum göstermektedir.";
      const tipsHtml = analysis.recommendations.map(r => `<li>${r}</li>`).join("");

      reviewBox.innerHTML = `
        <p style="margin-bottom:8px;"><strong>Koçluk Değerlendirmesi:</strong> ${noteSummary}</p>
        <p style="margin-bottom:6px;"><strong>Öncelikli Eylem ve Ödev Planı:</strong></p>
        <ul style="margin-left: 20px;">
          ${tipsHtml}
        </ul>
      `;
    }
  }

  // --- Modal Yönetimi ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");

    // Modal açıldığında varsayılan tarihleri bugüne ayarla
    const today = new Date().toISOString().split("T")[0];
    if (modalId === "modalExam") {
      document.getElementById("examDate").value = today;
      this.handleExamTypeChange(document.getElementById("examTypeSelect").value);
    } else if (modalId === "modalQuestion") {
      document.getElementById("qDate").value = today;
    } else if (modalId === "modalAttendance") {
      document.getElementById("attDate").value = today;
    } else if (modalId === "modalCoachingNote") {
      document.getElementById("cnDate").value = today;
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  // Sınav Türü Seçilince Alanları Güncelle
  handleExamTypeChange(type) {
    const tytBox = document.getElementById("tytFieldsBox");
    const aytBox = document.getElementById("aytFieldsBox");
    const aytSayisal = document.getElementById("aytSayisalFields");
    const aytEa = document.getElementById("aytEaFields");

    const student = window.store.getActiveStudent();
    const field = student ? student.field : "Sayısal";

    if (type === "TYT") {
      tytBox.style.display = "block";
      aytBox.style.display = "none";
    } else {
      tytBox.style.display = "none";
      aytBox.style.display = "block";
      if (field === "Eşit Ağırlık" || field === "Sözel") {
        aytSayisal.style.display = "none";
        aytEa.style.display = "block";
      } else {
        aytSayisal.style.display = "block";
        aytEa.style.display = "none";
      }
    }
    this.calculateExamLiveNets();
  }

  // Form Canlı Net Hesaplayıcı
  calculateExamLiveNets() {
    const type = document.getElementById("examTypeSelect").value;
    let totalNet = 0;

    if (type === "TYT") {
      const turkD = document.getElementById("tytTurkceD").value;
      const turkY = document.getElementById("tytTurkceY").value;
      const turkNet = AnalyticsEngine.calcNet(turkD, turkY);
      document.getElementById("tytTurkceNet").value = turkNet + " Net";

      const matD = document.getElementById("tytMatD").value;
      const matY = document.getElementById("tytMatY").value;
      const matNet = AnalyticsEngine.calcNet(matD, matY);
      document.getElementById("tytMatNet").value = matNet + " Net";

      const sosD = document.getElementById("tytSosD").value;
      const sosY = document.getElementById("tytSosY").value;
      const sosNet = AnalyticsEngine.calcNet(sosD, sosY);
      document.getElementById("tytSosNet").value = sosNet + " Net";

      const fenD = document.getElementById("tytFenD").value;
      const fenY = document.getElementById("tytFenY").value;
      const fenNet = AnalyticsEngine.calcNet(fenD, fenY);
      document.getElementById("tytFenNet").value = fenNet + " Net";

      totalNet = turkNet + matNet + sosNet + fenNet;
    } else {
      // AYT
      const matD = document.getElementById("aytMatD").value;
      const matY = document.getElementById("aytMatY").value;
      const matNet = AnalyticsEngine.calcNet(matD, matY);
      document.getElementById("aytMatNet").value = matNet + " Net";
      totalNet += matNet;

      const student = window.store.getActiveStudent();
      const field = student ? student.field : "Sayısal";

      if (field === "Sayısal") {
        const fizD = document.getElementById("aytFizD").value;
        const fizY = document.getElementById("aytFizY").value;
        const fizNet = AnalyticsEngine.calcNet(fizD, fizY);
        document.getElementById("aytFizNet").value = fizNet + " Net";

        const kimD = document.getElementById("aytKimD").value;
        const kimY = document.getElementById("aytKimY").value;
        const kimNet = AnalyticsEngine.calcNet(kimD, kimY);
        document.getElementById("aytKimNet").value = kimNet + " Net";

        const biyD = document.getElementById("aytBiyD").value;
        const biyY = document.getElementById("aytBiyY").value;
        const biyNet = AnalyticsEngine.calcNet(biyD, biyY);
        document.getElementById("aytBiyNet").value = biyNet + " Net";

        totalNet += fizNet + kimNet + biyNet;
      } else {
        const edbD = document.getElementById("aytEdbD").value;
        const edbY = document.getElementById("aytEdbY").value;
        const edbNet = AnalyticsEngine.calcNet(edbD, edbY);
        document.getElementById("aytEdbNet").value = edbNet + " Net";

        const tar1D = document.getElementById("aytTar1D").value;
        const tar1Y = document.getElementById("aytTar1Y").value;
        const tar1Net = AnalyticsEngine.calcNet(tar1D, tar1Y);
        document.getElementById("aytTar1Net").value = tar1Net + " Net";

        const cog1D = document.getElementById("aytCog1D").value;
        const cog1Y = document.getElementById("aytCog1Y").value;
        const cog1Net = AnalyticsEngine.calcNet(cog1D, cog1Y);
        document.getElementById("aytCog1Net").value = cog1Net + " Net";

        totalNet += edbNet + tar1Net + cog1Net;
      }
    }

    document.getElementById("examTotalNetPreview").value = totalNet.toFixed(2) + " Net";
  }

  // --- Form Kayıt İşlemleri ---
  handleSaveStudent() {
    const name = document.getElementById("stdName").value.trim();
    if (!name) {
      alert("Lütfen öğrenci adını giriniz.");
      return;
    }

    const newStudent = window.store.addStudent({
      name: name,
      field: document.getElementById("stdField").value,
      grade: document.getElementById("stdGrade").value,
      targetUniversity: document.getElementById("stdTargetUni").value,
      targetDepartment: document.getElementById("stdTargetDept").value,
      targetTytNet: document.getElementById("stdTargetTyt").value,
      targetAytNet: document.getElementById("stdTargetAyt").value,
      targetWeeklyQuestions: document.getElementById("stdTargetWeeklyQuestions").value
    });

    this.closeModal("modalStudent");
    document.getElementById("formStudent").reset();
    this.refreshAll();
    this.showToast(`Yeni öğrenci (${newStudent.name}) başarıyla eklendi!`, "success");
  }

  handleSaveExam() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    const name = document.getElementById("examName").value.trim();
    const date = document.getElementById("examDate").value;
    if (!name || !date) {
      alert("Lütfen sınav adı ve tarihini doldurunuz.");
      return;
    }

    const type = document.getElementById("examTypeSelect").value;
    const difficulty = Number(document.getElementById("examDifficulty").value) || 3;
    const notes = document.getElementById("examNotes").value;

    let examData = {
      type,
      name,
      date,
      difficulty,
      notes
    };

    if (type === "TYT") {
      const turkD = Number(document.getElementById("tytTurkceD").value) || 0;
      const turkY = Number(document.getElementById("tytTurkceY").value) || 0;
      const matD = Number(document.getElementById("tytMatD").value) || 0;
      const matY = Number(document.getElementById("tytMatY").value) || 0;
      const sosD = Number(document.getElementById("tytSosD").value) || 0;
      const sosY = Number(document.getElementById("tytSosY").value) || 0;
      const fenD = Number(document.getElementById("tytFenD").value) || 0;
      const fenY = Number(document.getElementById("tytFenY").value) || 0;

      const tytObj = {
        turkce: { d: turkD, y: turkY, net: AnalyticsEngine.calcNet(turkD, turkY) },
        matematik: { d: matD, y: matY, net: AnalyticsEngine.calcNet(matD, matY) },
        sosyal: { d: sosD, y: sosY, net: AnalyticsEngine.calcNet(sosD, sosY) },
        fen: { d: fenD, y: fenY, net: AnalyticsEngine.calcNet(fenD, fenY) }
      };

      const totalNet = Number((tytObj.turkce.net + tytObj.matematik.net + tytObj.sosyal.net + tytObj.fen.net).toFixed(2));
      const estimatedScore = AnalyticsEngine.estimateTytScore(tytObj);

      examData.tyt = tytObj;
      examData.totalNet = totalNet;
      examData.estimatedScore = estimatedScore;
    } else {
      // AYT
      const aytObj = {};
      const matD = Number(document.getElementById("aytMatD").value) || 0;
      const matY = Number(document.getElementById("aytMatY").value) || 0;
      aytObj.matematik = { d: matD, y: matY, net: AnalyticsEngine.calcNet(matD, matY) };

      let totalNet = aytObj.matematik.net;

      if (student.field === "Sayısal") {
        const fizD = Number(document.getElementById("aytFizD").value) || 0;
        const fizY = Number(document.getElementById("aytFizY").value) || 0;
        const kimD = Number(document.getElementById("aytKimD").value) || 0;
        const kimY = Number(document.getElementById("aytKimY").value) || 0;
        const biyD = Number(document.getElementById("aytBiyD").value) || 0;
        const biyY = Number(document.getElementById("aytBiyY").value) || 0;

        aytObj.fizik = { d: fizD, y: fizY, net: AnalyticsEngine.calcNet(fizD, fizY) };
        aytObj.kimya = { d: kimD, y: kimY, net: AnalyticsEngine.calcNet(kimD, kimY) };
        aytObj.biyoloji = { d: biyD, y: biyY, net: AnalyticsEngine.calcNet(biyD, biyY) };
        totalNet += aytObj.fizik.net + aytObj.kimya.net + aytObj.biyoloji.net;
      } else {
        const edbD = Number(document.getElementById("aytEdbD").value) || 0;
        const edbY = Number(document.getElementById("aytEdbY").value) || 0;
        const tar1D = Number(document.getElementById("aytTar1D").value) || 0;
        const tar1Y = Number(document.getElementById("aytTar1Y").value) || 0;
        const cog1D = Number(document.getElementById("aytCog1D").value) || 0;
        const cog1Y = Number(document.getElementById("aytCog1Y").value) || 0;

        aytObj.edebiyat = { d: edbD, y: edbY, net: AnalyticsEngine.calcNet(edbD, edbY) };
        aytObj.tarih1 = { d: tar1D, y: tar1Y, net: AnalyticsEngine.calcNet(tar1D, tar1Y) };
        aytObj.cografya1 = { d: cog1D, y: cog1Y, net: AnalyticsEngine.calcNet(cog1D, cog1Y) };
        totalNet += aytObj.edebiyat.net + aytObj.tarih1.net + aytObj.cografya1.net;
      }

      examData.ayt = aytObj;
      examData.totalNet = Number(totalNet.toFixed(2));
      examData.estimatedScore = AnalyticsEngine.estimateAytScore(aytObj, student.field);
    }

    window.store.addExam(student.id, examData);
    this.closeModal("modalExam");
    document.getElementById("formExam").reset();
    this.refreshAll();
    this.showToast(`${examData.name} deneme sonucu (${examData.totalNet} Net) kaydedildi!`, "success");
  }

  handleSaveQuestion() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    const count = Number(document.getElementById("qCount").value);
    if (!count || count <= 0) {
      alert("Lütfen çözülen soru sayısını giriniz.");
      return;
    }

    const logData = {
      date: document.getElementById("qDate").value,
      subject: document.getElementById("qSubject").value,
      count: count,
      correct: Number(document.getElementById("qCorrect").value) || 0,
      wrong: Number(document.getElementById("qWrong").value) || 0,
      duration: Number(document.getElementById("qDuration").value) || 0
    };

    window.store.addQuestionLog(student.id, logData);
    this.closeModal("modalQuestion");
    document.getElementById("formQuestion").reset();
    this.refreshAll();
    this.showToast(`${logData.subject} dersinden ${logData.count} soru kaydedildi!`, "success");
  }

  handleSaveAttendance() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    const attData = {
      date: document.getElementById("attDate").value,
      type: document.getElementById("attType").value,
      title: document.getElementById("attTitle").value || "Görüşme",
      status: document.getElementById("attStatus").value,
      notes: document.getElementById("attNotes").value
    };

    window.store.addAttendance(student.id, attData);
    this.closeModal("modalAttendance");
    document.getElementById("formAttendance").reset();
    this.refreshAll();
    this.showToast("Seans / yoklama kaydı kaydedildi!", "success");
  }

  handleSaveCoachingNote() {
    const student = window.store.getActiveStudent();
    if (!student) return;

    const rawAssignments = document.getElementById("cnAssignments").value;
    const assignments = rawAssignments.split("\n").map(s => s.trim()).filter(s => s.length > 0);

    const noteData = {
      date: document.getElementById("cnDate").value,
      studentMotivation: document.getElementById("cnMotivation").value,
      summary: document.getElementById("cnSummary").value,
      assignments: assignments
    };

    window.store.addCoachingNote(student.id, noteData);
    this.closeModal("modalCoachingNote");
    document.getElementById("formCoachingNote").reset();
    this.refreshAll();
    this.showToast("Haftalık koçluk değerlendirmesi ve ödevler eklendi!", "success");
  }

  // --- Silme İşlemleri ---
  deleteExam(examId) {
    if (confirm("Bu deneme sınavı kaydını silmek istediğinize emin misiniz?")) {
      const student = window.store.getActiveStudent();
      window.store.deleteExam(student.id, examId);
      this.refreshAll();
      this.showToast("Deneme sınavı silindi.", "info");
    }
  }

  deleteQuestionLog(logId) {
    if (confirm("Bu soru kaydını silmek istediğinize emin misiniz?")) {
      const student = window.store.getActiveStudent();
      window.store.deleteQuestionLog(student.id, logId);
      this.refreshAll();
      this.showToast("Soru kaydı silindi.", "info");
    }
  }

  deleteAttendance(attId) {
    if (confirm("Bu seans kaydını silmek istediğinize emin misiniz?")) {
      const student = window.store.getActiveStudent();
      window.store.deleteAttendance(student.id, attId);
      this.refreshAll();
      this.showToast("Seans kaydı silindi.", "info");
    }
  }

  // Toast Bildirim Gösterici
  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    let bg = "var(--primary)";
    let icon = "ℹ️";
    if (type === "success") { bg = "var(--secondary)"; icon = "✅"; }
    else if (type === "danger") { bg = "var(--danger)"; icon = "⚠️"; }
    else if (type === "warning") { bg = "var(--warning)"; icon = "🔔"; }

    toast.style.background = bg;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  renderEmptyState() {
    document.getElementById("heroName").textContent = "Henüz Öğrenci Yok";
    document.getElementById("heroTarget").textContent = "Lütfen '+ Ekle' butonundan öğrenci tanımlayınız.";
  }
}

// Uygulamayı Başlat
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
