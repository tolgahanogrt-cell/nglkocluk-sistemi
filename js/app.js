// Nafi Güral Fen Lisesi - Öğrenci Koçluk ve Başarı Takip Sistemi (Ana Kontrolcü)

class App {
  constructor() {
    this.currentTab = "dashboard";
    this.examFilterPeriod = "all";
    this.questionFilterPeriod = "weekly";
    this.questionFilterSubject = null;
    this.bindEvents();
    this.checkAuth();
  }

  // --- Oturum ve Rol Yetki Kontrolü ---
  checkAuth() {
    const authWrapper = document.getElementById("authWrapper");
    if (!window.store.isAuthenticated()) {
      if (authWrapper) authWrapper.classList.remove("hidden");
      document.body.classList.remove("role-admin", "role-teacher", "role-student");
      document.querySelectorAll(".page-container").forEach(page => page.classList.remove("active"));
      this.currentTab = "dashboard";
      const defaultPage = document.getElementById("page-dashboard");
      if (defaultPage) defaultPage.classList.add("active");
      this.refreshAll();
      return;
    }

    if (authWrapper) authWrapper.classList.add("hidden");
    this.applyRoleRestrictions();
    this.refreshAll();
  }

  applyRoleRestrictions() {
    const role = window.store.getRole();

    document.body.classList.remove("role-admin", "role-teacher", "role-student");
    document.body.classList.add(`role-${role}`);

    this.updateSidebarUserInfo();

    if (role === "teacher") {
      // Öğretmen admin sekmesinde ASLA kalamaz!
      if (this.currentTab === "admin") {
        this.switchTab("dashboard");
      }
    } else if (role === "student") {
      // Öğrenci doğrudan dashboard'a gelsin
      if (this.currentTab === "admin" || this.currentTab === "students") {
        this.switchTab("dashboard");
      }
    }
  }

  // Sol alttaki kullanıcı bilgisini tüm sayfalarda ve rollerde güncelleyen metod
  updateSidebarUserInfo() {
    const role = window.store.getRole();
    const user = window.store.getCurrentUser();
    const userNameEl = document.getElementById("sidebarUserName");
    const roleBadgeEl = document.getElementById("sidebarRoleBadge");
    const avatarEl = document.getElementById("sidebarUserAvatar");
    const titleEl = document.getElementById("sidebarUserTitle");

    if (!role || !user) {
      if (userNameEl) userNameEl.textContent = "Misafir Kullanıcı";
      if (roleBadgeEl) {
        roleBadgeEl.className = "badge badge-outline";
        roleBadgeEl.textContent = "Giriş Yapılmadı";
      }
      return;
    }

    if (role === "admin") {
      if (titleEl) titleEl.textContent = user.title || "Yönetici Hesabı";
      if (userNameEl) userNameEl.textContent = user.name || "Sistem Yöneticisi";
      if (avatarEl) {
        avatarEl.style.background = "var(--primary)";
        avatarEl.textContent = (user.name || "SY").split(" ").map(w => w[0]).join("").toLocaleUpperCase("tr").slice(0, 2);
      }
      if (roleBadgeEl) {
        roleBadgeEl.className = "badge badge-primary";
        roleBadgeEl.textContent = "⚙️ Sistem Yöneticisi";
      }
    } else if (role === "teacher") {
      if (titleEl) titleEl.textContent = "Öğretmen / Koç";
      if (userNameEl) userNameEl.textContent = user.name || "Öğretmen";
      if (avatarEl) {
        avatarEl.style.background = "var(--secondary)";
        const initials = (user.name || "Öğretmen").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        avatarEl.textContent = initials || "ÖĞ";
      }
      if (roleBadgeEl) {
        roleBadgeEl.className = "badge badge-success";
        roleBadgeEl.textContent = user.branch ? `👨‍🏫 ${user.branch}` : "👨‍🏫 Öğretmen / Koç";
      }
    } else if (role === "student") {
      const student = window.store.getActiveStudent() || user;
      if (titleEl) titleEl.textContent = "Giriş Yapan Öğrenci";
      if (userNameEl) userNameEl.textContent = student.name || user.name || "Öğrenci";
      if (avatarEl) {
        avatarEl.style.background = student.avatarColor || "var(--primary)";
        const initials = (student.name || user.name || "Öğrenci").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        avatarEl.textContent = initials || "ÖĞ";
      }
      if (roleBadgeEl) {
        roleBadgeEl.className = "badge badge-info";
        roleBadgeEl.textContent = student.field ? `🎓 ${student.field}` : "🎓 Öğrenci Portalı";
      }
    }
  }

  // --- Olay Dinleyicileri ---
  bindEvents() {
    // 1. Giriş Rol Sekmeleri
    document.getElementById("tabBtnTeacher")?.addEventListener("click", () => this.switchAuthTab("teacher"));
    document.getElementById("tabBtnStudent")?.addEventListener("click", () => this.switchAuthTab("student"));
    document.getElementById("tabBtnAdmin")?.addEventListener("click", () => this.switchAuthTab("admin"));

    // 2. Giriş Formları
    document.getElementById("formTeacherLogin")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("teacherUsernameInput").value;
      const p = document.getElementById("teacherPasswordInput").value;
      const res = window.store.loginTeacher(u, p);
      if (res.success) {
        this.checkAuth();
        this.switchTab("dashboard");
        this.showToast(`Hoş geldiniz, ${res.user.name}!`, "success");
      } else {
        alert(res.message);
      }
    });

    document.getElementById("formStudentLogin")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("studentUsernameInput").value;
      const p = document.getElementById("studentPasswordInput").value;
      const res = window.store.loginStudent(u, p);
      if (res.success) {
        this.checkAuth();
        this.switchTab("dashboard");
        this.showToast(`Hoş geldin, ${res.student.name}!`, "success");
      } else {
        alert(res.message);
      }
    });

    document.getElementById("formAdminLogin")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("adminUsernameInput").value;
      const p = document.getElementById("adminPasswordInput").value;
      const res = window.store.loginAdmin(u, p);
      if (res.success) {
        this.checkAuth();
        this.switchTab("dashboard");
        this.showToast("Sistem Yöneticisi Girişi Başarılı!", "success");
      } else {
        alert(res.message);
      }
    });

    // 3. Çıkış Butonları (Sidebar ve Topbar)
    document.getElementById("btnSidebarLogout")?.addEventListener("click", () => this.handleLogout());
    document.getElementById("btnTopbarLogout")?.addEventListener("click", () => this.handleLogout());

    // 4. Sekme Değişimi
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // 5. Öğrenci Seçiciler ve İki Yönlü Filtreleme Senkronizasyonu
    const syncFiltersAndPopulate = (source) => {
      let grade = "";
      let section = "";

      if (source === "sidebar") {
        grade = document.getElementById("sidebarGradeSelect")?.value || "";
        section = document.getElementById("sidebarSectionSelect")?.value || "";
        const dashGrade = document.getElementById("filterGrade");
        const dashSection = document.getElementById("filterSection");
        if (dashGrade) dashGrade.value = grade;
        if (dashSection) dashSection.value = section;
      } else {
        grade = document.getElementById("filterGrade")?.value || "";
        section = document.getElementById("filterSection")?.value || "";
        const sideGrade = document.getElementById("sidebarGradeSelect");
        const sideSection = document.getElementById("sidebarSectionSelect");
        if (sideGrade) sideGrade.value = grade;
        if (sideSection) sideSection.value = section;
      }

      window.store.setFilter(grade, section);
      this.renderStudentSelector();
      this.refreshAll();
    };

    document.getElementById("sidebarGradeSelect")?.addEventListener("change", () => syncFiltersAndPopulate("sidebar"));
    document.getElementById("sidebarSectionSelect")?.addEventListener("change", () => syncFiltersAndPopulate("sidebar"));
    document.getElementById("filterGrade")?.addEventListener("change", () => syncFiltersAndPopulate("dashboard"));
    document.getElementById("filterSection")?.addEventListener("change", () => syncFiltersAndPopulate("dashboard"));

    document.getElementById("studentSelect")?.addEventListener("change", (e) => {
      const val = e.target.value;
      const dashSelect = document.getElementById("dashStudentSelect");
      if (dashSelect) dashSelect.value = val;
      window.store.setActiveStudent(val);
      this.refreshAll();
      const active = window.store.getActiveStudent();
      if (active) this.showToast(val === "ALL" ? "Toplu sınıf/şube görünümü seçildi." : "Öğrenci profili seçildi: " + active.name, "info");
    });

    document.getElementById("dashStudentSelect")?.addEventListener("change", (e) => {
      const val = e.target.value;
      const sideSelect = document.getElementById("studentSelect");
      if (sideSelect) sideSelect.value = val;
      window.store.setActiveStudent(val);
      this.refreshAll();
      const active = window.store.getActiveStudent();
      if (active) this.showToast(val === "ALL" ? "Toplu sınıf/şube görünümü seçildi." : "Öğrenci profili seçildi: " + active.name, "info");
    });

    // 5b. Grafik Ders Filtre Dinleyicileri
    document.getElementById("tytChartSubjectFilter")?.addEventListener("change", (e) => {
      ChartManager.filterTytDatasets(e.target.value);
    });

    document.getElementById("aytChartSubjectFilter")?.addEventListener("change", (e) => {
      ChartManager.filterAytDatasets(e.target.value);
    });

    // 5c. Grafik Dönem (Genel / Ay bazlı) Filtre Dinleyicileri
    [
      "filterDashboardPeriod", "tytPeriodSelect", "aytPeriodSelect", "questionsPeriodSelect",
      "radarPeriodSelect", "aytRadarPeriodSelect", "attendancePeriodSelect"
    ].forEach(id => ChartManager.populatePeriodSelect(document.getElementById(id)));

    document.getElementById("filterDashboardPeriod")?.addEventListener("change", (e) => {
      const val = e.target.value;
      const selects = [
        "tytPeriodSelect", "aytPeriodSelect", "questionsPeriodSelect",
        "radarPeriodSelect", "aytRadarPeriodSelect", "attendancePeriodSelect"
      ];
      selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });
      this.renderCharts();
    });

    document.getElementById("tytPeriodSelect")?.addEventListener("change", () => {
      const s = window.store.getActiveStudent();
      if (s) ChartManager.renderTytChart("chartTytDashboard", s.exams, s.targetTytNet);
    });

    document.getElementById("aytPeriodSelect")?.addEventListener("change", () => {
      const s = window.store.getActiveStudent();
      if (s) ChartManager.renderAytChart("chartAytDashboard", s.exams, s.targetAytNet, s.field);
    });

    document.getElementById("questionsPeriodSelect")?.addEventListener("change", () => {
      const s = window.store.getActiveStudent();
      if (s) ChartManager.renderWeeklyQuestionsChart("chartQuestionsDashboard", s.questionLogs);
    });

    document.getElementById("radarPeriodSelect")?.addEventListener("change", () => {
      const s = window.store.getActiveStudent();
      if (s) ChartManager.renderSubjectRadar("chartRadarDashboard", s);
    });

    document.getElementById("aytRadarPeriodSelect")?.addEventListener("change", () => {
      const s = window.store.getActiveStudent();
      if (s) ChartManager.renderAytSubjectRadar("chartAytRadarDashboard", s);
    });

    document.getElementById("attendancePeriodSelect")?.addEventListener("change", () => {
      const s = window.store.getActiveStudent();
      if (s) ChartManager.renderAttendanceChart("chartAttendanceDashboard", s.courseAttendance);
    });

    // 6. Hızlı Butonlar
    document.getElementById("btnQuickAddStudent")?.addEventListener("click", () => this.openModal("modalStudent"));
    document.getElementById("btnQuickAddExam")?.addEventListener("click", () => this.openModal("modalExam"));
    document.getElementById("btnQuickAddQuestion")?.addEventListener("click", () => this.openModal("modalQuestion"));
    document.getElementById("btnQuickKarne")?.addEventListener("click", () => this.switchTab("karne"));

    // 7. Modal Açma Butonları
    document.getElementById("btnOpenNewTeacherModal")?.addEventListener("click", () => this.openModal("modalTeacher"));
    document.getElementById("btnOpenNewStudentModal")?.addEventListener("click", () => this.openModal("modalStudent"));
    document.getElementById("btnOpenNewStudentModalFromPage")?.addEventListener("click", () => this.openModal("modalStudent"));
    document.getElementById("btnOpenNewExamModal")?.addEventListener("click", () => this.openModal("modalExam"));
    document.getElementById("btnOpenNewQuestionModal")?.addEventListener("click", () => this.openModal("modalQuestion"));
    document.getElementById("btnOpenBulkCourseAttendanceModal")?.addEventListener("click", () => this.openModal("modalBulkCourseAttendance"));
    document.getElementById("btnOpenNewSessionModal")?.addEventListener("click", () => this.openModal("modalSession"));

    // 8. Modal Kapatma
    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.closeModal(btn.getAttribute("data-close"));
      });
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.closeModal(overlay.id);
      });
    });

    // 9. Form Kayıt Butonları
    document.getElementById("btnSaveTeacher")?.addEventListener("click", () => this.handleSaveTeacher());
    document.getElementById("btnSaveStudent")?.addEventListener("click", () => this.handleSaveStudent());
    document.getElementById("btnSaveEditTeacherCredentials")?.addEventListener("click", () => this.handleSaveTeacherCredentials());
    document.getElementById("btnSaveEditStudentCredentials")?.addEventListener("click", () => this.handleSaveStudentCredentials());
    document.getElementById("btnSaveExam")?.addEventListener("click", () => this.handleSaveExam());
    document.getElementById("btnSaveQuestion")?.addEventListener("click", () => this.handleSaveQuestion());
    document.getElementById("btnSaveBulkAttendance")?.addEventListener("click", () => this.handleSaveBulkAttendance());
    document.getElementById("btnSaveSession")?.addEventListener("click", () => this.handleSaveSession());

    // 10. Sınav Türü Değişimi
    document.getElementById("examTypeSelect")?.addEventListener("change", (e) => {
      this.handleExamTypeChange(e.target.value);
    });

    document.querySelectorAll(".calc-net").forEach(inp => {
      inp.addEventListener("input", () => this.calculateExamLiveNets());
    });

    document.getElementById("formAdminProfile")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSaveAdminProfile();
    });

    // 11. PDF / Yazdır ve Karne Dönem Filtresi
    document.getElementById("btnPrintKarneAction")?.addEventListener("click", () => this.printKarne());
    document.getElementById("karnePeriodSelect")?.addEventListener("change", () => this.renderKarne());
    document.getElementById("examFilterPeriod")?.addEventListener("change", (e) => {
      this.examFilterPeriod = e.target.value;
      const student = window.store.getActiveStudent();
      this.renderExamsTable(student);
    });

    // 12. Soru Takip Çizelgesi Dönem ve Branş Filtresi
    document.querySelectorAll("#questionPeriodBtnGroup .btn-period").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const period = e.currentTarget.getAttribute("data-q-period");
        this.questionFilterPeriod = period;
        document.querySelectorAll("#questionPeriodBtnGroup .btn-period").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.renderQuestionsTable();
      });
    });

    document.getElementById("btnClearSubjectFilter")?.addEventListener("click", () => {
      this.questionFilterSubject = null;
      this.renderQuestionsTable();
    });
  }

  renderAdminProfile() {
    const a = window.store.getAdminProfile();
    document.getElementById("profileName").value = a.name || "";
    const titleSelect = document.getElementById("profileTitle");
    if (titleSelect) {
      if (a.title === "Müdür" || a.title === "Müdür Yardımcısı") {
        titleSelect.value = a.title;
      } else {
        titleSelect.value = "Müdür Yardımcısı";
      }
    }
    document.getElementById("profileUsername").value = a.username || "";
    document.getElementById("profilePassword").value = a.password || "";
  }

  handleSaveAdminProfile() {
    const v = (id) => document.getElementById(id).value.trim();
    if (!v("profileName") || !v("profileTitle") || !v("profileUsername") || !v("profilePassword")) {
      this.showToast("Lütfen tüm profil alanlarını doldurunuz.", "error");
      return;
    }
    const res = window.store.updateAdminProfile({
      name: v("profileName"), title: v("profileTitle"),
      username: v("profileUsername"), password: v("profilePassword")
    });
    if (res.success) {
      this.updateSidebarUserInfo();
      this.showToast("Profil bilgileri güncellendi.", "success");
    } else {
      this.showToast(res.message, "error");
    }
  }

  switchAuthTab(tab) {
    const tabs = ["teacher", "student", "admin"];
    tabs.forEach(t => {
      const btn = document.getElementById("tabBtn" + t.charAt(0).toUpperCase() + t.slice(1));
      const form = document.getElementById("form" + t.charAt(0).toUpperCase() + t.slice(1) + "Login");
      if (btn) btn.classList.toggle("active", t === tab);
      if (form) form.style.display = t === tab ? "block" : "none";
    });
  }

  handleLogout() {
    window.store.logout();
    document.body.classList.remove("role-admin", "role-teacher", "role-student");
    document.querySelectorAll(".page-container").forEach(page => page.classList.remove("active"));
    this.currentTab = "dashboard";
    const defaultPage = document.getElementById("page-dashboard");
    if (defaultPage) defaultPage.classList.add("active");
    this.checkAuth();
    this.showToast("Oturum başarıyla kapatıldı.", "info");
  }

  // --- Sekme Yöneticisi ---
  switchTab(tabId) {
    const currentRole = window.store.getRole();
    if ((tabId === "admin" || tabId === "profile") && currentRole !== "admin") {
      tabId = currentRole === "teacher" ? "students" : "dashboard";
    }
    if (tabId === "students" && currentRole === "student") {
      tabId = "dashboard";
    }

    this.currentTab = tabId;

    document.querySelectorAll(".sidebar-nav .nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    document.querySelectorAll(".page-container").forEach(page => {
      page.classList.remove("active");
    });
    const targetPage = document.getElementById("page-" + tabId);
    if (targetPage) targetPage.classList.add("active");

    const titles = {
      profile: { title: "Profil Bilgilerim", sub: "Yönetici adı, görevi, kullanıcı adı ve şifre ayarları" },
      admin: { title: "Öğretmen ve Koç Yönetimi", sub: "Sistem yöneticisi öğretmen tanımlama ve şifre paneli" },
      students: { title: "Öğrenci Yönetimi ve Giriş Tanımlama", sub: "Koçluk yapılan öğrencileri tanımlama, kullanıcı adı, şifre ve hedef yönetimi" },
      dashboard: { title: "Genel Bakış", sub: "Öğrenci gelişim ve koçluk paneli" },
      exams: { title: "Deneme Sınavları", sub: "TYT ve AYT sonuçları, ders netleri ve puan takibi" },
      questions: { title: "Soru Takip Çizelgesi", sub: "Ders bazlı soru çözüm hedefleri ve günlüğü" },
      attendance: { title: "Devamsızlık ve Seanslar", sub: "Ders devamsızlıkları, koçluk görüşmeleri ve ödevler" },
      analysis: { title: "İlerleme ve Gelişim Analizi", sub: "Gelişim tespiti, güçlü ve zayıf konular" },
      karne: { title: "Öğrenci Karnesi", sub: "Resmi gelişim karnesi ve yazdırılabilir rapor" }
    };
    if (titles[tabId]) {
      document.getElementById("topbarTitle").textContent = titles[tabId].title;
      document.getElementById("topbarSubtitle").textContent = titles[tabId].sub;
    }

    if (tabId === "dashboard") {
      this.renderCharts();
    } else if (tabId === "profile") {
      this.renderAdminProfile();
    } else if (tabId === "admin") {
      this.renderTeachersTable();
    } else if (tabId === "students") {
      this.renderStudentsTable();
    } else if (tabId === "analysis") {
      this.renderAnalysisDetails();
    } else if (tabId === "questions") {
      this.renderQuestionsTable();
    } else if (tabId === "karne") {
      this.renderKarne();
    }

    this.updateSidebarUserInfo();
  }

  // --- Genel Yenileme ---
  refreshAll() {
    this.updateSidebarUserInfo();
    const role = window.store.getRole();
    if (role === "admin") {
      this.renderTeachersTable();
    } else if (role === "teacher") {
      this.renderStudentsTable();
    }

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
    this.renderCourseAttendanceTable(student);
    this.renderCoachingSessions(student);
    this.renderCharts();
    this.renderAnalysisDetails();
    this.renderKarne();
  }

  renderStudentSelector() {
    const role = window.store.getRole();
    if (role === "student") return;

    // Filtre Değerleri (Store)
    const gradeFilter = window.store.filterGrade || "";
    const sectionFilter = window.store.filterSection || "";

    // Sınıf ve Şube dropdownlarını senkronize et
    const sideGrade = document.getElementById("sidebarGradeSelect");
    const dashGrade = document.getElementById("filterGrade");
    if (sideGrade && sideGrade.value !== gradeFilter) sideGrade.value = gradeFilter;
    if (dashGrade && dashGrade.value !== gradeFilter) dashGrade.value = gradeFilter;

    const sideSection = document.getElementById("sidebarSectionSelect");
    const dashSection = document.getElementById("filterSection");
    if (sideSection && sideSection.value !== sectionFilter) sideSection.value = sectionFilter;
    if (dashSection && dashSection.value !== sectionFilter) dashSection.value = sectionFilter;

    const sidebarSelect = document.getElementById("studentSelect");
    const dashSelect = document.getElementById("dashStudentSelect");
    const countBadge = document.getElementById("filterStudentCountBadge");

    // Sınıf veya Şube seçilmemişse -> PASİF (disabled)
    if (!gradeFilter || !sectionFilter) {
      const passiveHtml = `<option value="" disabled selected>Önce Sınıf ve Şube Seçiniz...</option>`;
      if (sidebarSelect) {
        sidebarSelect.innerHTML = passiveHtml;
        sidebarSelect.disabled = true;
      }
      if (dashSelect) {
        dashSelect.innerHTML = passiveHtml;
        dashSelect.disabled = true;
      }
      if (countBadge) {
        countBadge.textContent = "Sınıf ve Şube Seçiniz";
        countBadge.className = "badge badge-outline";
      }
      return;
    }

    // Sınıf VE Şube seçilmişse -> AKTİF (disabled = false)
    const filtered = window.store.getFilteredStudents(gradeFilter, sectionFilter);

    if (sidebarSelect) sidebarSelect.disabled = false;
    if (dashSelect) dashSelect.disabled = false;

    if (filtered.length === 0) {
      const emptyHtml = `<option value="" disabled selected>Bu sınıfta öğrenci yok</option>`;
      if (sidebarSelect) {
        sidebarSelect.innerHTML = emptyHtml;
        sidebarSelect.disabled = true;
      }
      if (dashSelect) {
        dashSelect.innerHTML = emptyHtml;
        dashSelect.disabled = true;
      }
      if (countBadge) {
        countBadge.textContent = `0 Öğrenci (${gradeFilter}-${sectionFilter})`;
        countBadge.className = "badge badge-warning";
      }
      return;
    }

    // Aktif öğrenci bu filtrede var mı?
    let activeId = window.store.activeStudentId;
    const exists = filtered.some(s => s.id === activeId);
    if (!exists) {
      activeId = filtered[0].id;
      window.store.setActiveStudent(activeId);
    }

    // SADECE ÖĞRENCİNİN ADI görünsün!
    const buildOptions = () => {
      let html = "";
      filtered.forEach(s => {
        const isSel = s.id === activeId ? "selected" : "";
        html += `<option value="${s.id}" ${isSel}>${s.name}</option>`;
      });
      return html;
    };

    const optionsHtml = buildOptions();
    if (sidebarSelect) sidebarSelect.innerHTML = optionsHtml;
    if (dashSelect) dashSelect.innerHTML = optionsHtml;

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Öğrenci (${gradeFilter}-${sectionFilter} Şubesi)`;
      countBadge.className = "badge badge-primary";
    }
  }

  renderTeachersTable() {
    const tbody = document.getElementById("teachersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const teachers = window.store.getTeachers().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (teachers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">Kayıtlı öğretmen bulunmuyor.</td></tr>`;
      return;
    }

    teachers.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${t.name}</strong></td>
        <td><span class="badge badge-primary">${t.branch}</span></td>
        <td><code>${t.username}</code></td>
        <td><code style="background:#fef3c7; color:#92400e; font-weight:700; padding:2px 6px; border-radius:4px;">${t.password}</code></td>
        <td>${t.email || "-"}</td>
        <td>${AnalyticsEngine.formatDateTurkish(t.createdAt)}</td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" style="padding:3px 9px;" onclick="app.openEditTeacherCredentials('${t.id}')">✏️ Bilgileri Düzenle</button>
            <button class="btn btn-danger btn-sm" style="padding:3px 9px;" onclick="app.deleteTeacher('${t.id}')">Sil</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  async deleteTeacher(teacherId) {
    const teacher = (window.store.data.teachers || []).find(t => t.id === teacherId);
    const name = teacher ? teacher.name : "Öğretmen";
    const confirmed = await this.confirmDelete({
      title: "Öğretmen Hesabını Sil",
      message: `"${name}" adlı öğretmeni ve sisteme erişim yetkisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    });
    if (!confirmed) return;
    window.store.deleteTeacher(teacherId);
    this.renderTeachersTable();
    this.showToast(`${name} başarıyla silindi.`, "info");
  }

  openEditTeacherCredentials(teacherId) {
    const teacher = (window.store.data.teachers || []).find(t => t.id === teacherId);
    if (!teacher) return;

    document.getElementById("editTeacherId").value = teacher.id;
    document.getElementById("editTeacherName").value = teacher.name;
    const branchEl = document.getElementById("editTeacherBranch");
    if (branchEl) {
      if (teacher.branch) {
        let found = false;
        for (let i = 0; i < branchEl.options.length; i++) {
          if (branchEl.options[i].value === teacher.branch) {
            branchEl.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement("option");
          opt.value = teacher.branch;
          opt.textContent = teacher.branch;
          branchEl.appendChild(opt);
          branchEl.value = teacher.branch;
        }
      } else {
        branchEl.value = "";
      }
    }
    document.getElementById("editTeacherUsername").value = teacher.username;
    document.getElementById("editTeacherPassword").value = teacher.password;

    this.openModal("modalEditTeacherCredentials");
  }

  handleSaveTeacherCredentials() {
    const id = document.getElementById("editTeacherId").value;
    const name = document.getElementById("editTeacherName").value.trim();
    const branch = document.getElementById("editTeacherBranch")?.value;
    const newUsername = document.getElementById("editTeacherUsername").value.trim();
    const newPassword = document.getElementById("editTeacherPassword").value.trim();

    if (!name || !newUsername || !newPassword) {
      alert("Lütfen ad soyad, kullanıcı adı ve şifre alanlarını eksiksiz doldurunuz.");
      return;
    }
    if (!branch) {
      alert("Lütfen öğretmenin branşını seçiniz.");
      return;
    }

    const res = window.store.updateTeacher(id, {
      name,
      branch,
      username: newUsername,
      password: newPassword
    });

    if (res.success) {
      this.closeModal("modalEditTeacherCredentials");
      this.renderTeachersTable();
      this.showToast("Öğretmen bilgileri başarıyla güncellendi!", "success");
    } else {
      alert(res.message || "Güncelleme başarısız.");
    }
  }

  renderStudentsTable() {
    const tbody = document.getElementById("studentsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const students = window.store.getStudents();
    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">Henüz tanımlanmış öğrenci bulunmuyor. Yeni öğrenci eklemek için "+ Yeni Öğrenci Tanımla" butonuna basınız.</td></tr>`;
      return;
    }

    students.forEach(s => {
      const tr = document.createElement("tr");
      const isCurrent = s.id === window.store.activeStudentId;
      const initials = s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:50%; background:${s.avatarColor || 'var(--primary)'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0;">
              ${initials}
            </div>
            <div>
              <strong style="color:var(--text-main); font-size:13px;">${s.name}</strong>
              ${isCurrent ? `<span class="badge badge-success" style="font-size:10px; margin-left:6px;">Seçili Öğrenci</span>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge badge-primary">${s.field}</span></td>
        <td><span class="badge badge-outline">${s.grade}${s.section ? ' (' + s.section + ' Şubesi)' : ''}</span></td>
        <td><code>${s.username}</code></td>
        <td><code style="background:#fef3c7; color:#92400e; font-weight:700; padding:2px 6px; border-radius:4px;">${s.password}</code></td>
        <td><span style="font-size:12px; color:var(--text-main);">${s.targetUniversity || '-'} - ${s.targetDepartment || '-'}</span></td>
        <td><span style="font-size:12px; font-weight:600; color:var(--primary);">TYT: ${s.targetTytNet || '-'} | AYT: ${s.targetAytNet || '-'}</span></td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" style="padding:3px 9px;" onclick="app.openEditStudent('${s.id}')">✏️ Düzenle</button>
            <button class="btn btn-secondary btn-sm" style="padding:3px 9px;" onclick="app.openEditStudentCredentials('${s.id}')">🔑 Şifre</button>
            <button class="btn btn-danger btn-sm" style="padding:3px 9px;" onclick="app.deleteStudent('${s.id}')">Sil</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  openEditStudent(studentId) {
    const student = (window.store.data.students || []).find(s => s.id === studentId);
    if (!student) return;

    document.getElementById("editStudentIdTarget").value = student.id;
    document.getElementById("modalStudentTitle").textContent = `Öğrenci Bilgilerini Güncelle: ${student.name}`;
    document.getElementById("btnSaveStudent").textContent = "Değişiklikleri Kaydet";

    document.getElementById("stdName").value = student.name;
    document.getElementById("stdUsername").value = student.username;
    document.getElementById("stdPassword").value = student.password;
    document.getElementById("stdField").value = student.field;
    document.getElementById("stdGrade").value = student.grade;
    document.getElementById("stdSection").value = student.section || "A";
    document.getElementById("stdTargetUni").value = student.targetUniversity || "";
    document.getElementById("stdTargetDept").value = student.targetDepartment || "";
    document.getElementById("stdTargetTyt").value = student.targetTytNet || "";
    document.getElementById("stdTargetAyt").value = student.targetAytNet || "";
    document.getElementById("stdTargetWeeklyQuestions").value = student.targetWeeklyQuestions || 1200;

    this.openModal("modalStudent");
  }

  openEditStudentCredentials(studentId) {
    const student = (window.store.data.students || []).find(s => s.id === studentId);
    if (!student) return;

    document.getElementById("editStudentId").value = student.id;
    document.getElementById("editStudentName").value = student.name;
    const gradeEl = document.getElementById("editStudentGrade");
    if (gradeEl) gradeEl.value = student.grade || "12. Sınıf";
    const secEl = document.getElementById("editStudentSection");
    if (secEl) secEl.value = student.section || "A";
    const fieldEl = document.getElementById("editStudentField");
    if (fieldEl) fieldEl.value = student.field || "Sayısal";
    document.getElementById("editStudentUsername").value = student.username;
    document.getElementById("editStudentPassword").value = student.password;

    this.openModal("modalEditStudentCredentials");
  }

  handleSaveStudentCredentials() {
    const id = document.getElementById("editStudentId").value;
    const name = document.getElementById("editStudentName").value.trim();
    const grade = document.getElementById("editStudentGrade")?.value || "";
    const section = document.getElementById("editStudentSection")?.value || "";
    const field = document.getElementById("editStudentField")?.value || "";
    const newUsername = document.getElementById("editStudentUsername").value.trim();
    const newPassword = document.getElementById("editStudentPassword").value.trim();

    if (!name || !newUsername || !newPassword) {
      alert("Lütfen ad soyad, kullanıcı adı ve şifre alanlarını eksiksiz doldurunuz.");
      return;
    }

    const res = window.store.updateStudent(id, {
      name,
      grade,
      section,
      field,
      username: newUsername,
      password: newPassword
    });

    if (res.success) {
      this.closeModal("modalEditStudentCredentials");
      this.renderStudentsTable();
      this.refreshAll();
      this.showToast("Öğrenci bilgileri başarıyla güncellendi!", "success");
    } else {
      alert(res.message || "Güncelleme başarısız.");
    }
  }

  selectStudentFromTable(studentId) {
    window.store.setActiveStudent(studentId);
    this.refreshAll();
    this.switchTab("dashboard");
    this.showToast("Öğrenci profili seçildi ve Genel Bakış açıldı.", "success");
  }

  async deleteStudent(studentId) {
    const student = window.store.getStudents().find(s => s.id === studentId);
    const name = student ? student.name : "Öğrenci";
    const confirmed = await this.confirmDelete({
      title: "Öğrenci Kaydını Sil",
      message: `"${name}" adlı öğrenciyi ve bu öğrenciye ait tüm kayıtları kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    });
    if (!confirmed) return;
    window.store.deleteStudent(studentId);
    this.refreshAll();
    this.renderStudentsTable();
    this.showToast(`${name} başarıyla silindi.`, "info");
  }

  renderHeroCard(student) {
    if (!student) return;

    if (student.isAggregate) {
      document.getElementById("heroName").textContent = student.name;
      document.getElementById("heroField").textContent = "Tüm Alanlar";
      document.getElementById("heroGrade").textContent = `${student.studentCount} Kayıtlı Öğrenci`;
      document.getElementById("heroTarget").textContent = "Sınıf / Şube Başarı Hedefleri";
      document.getElementById("heroTargetNets").textContent = `Hedef Ortalaması: TYT ${student.targetTytNet} Net | AYT ${student.targetAytNet} Net`;

      const tytCount = (student.exams || []).filter(e => e.type === "TYT").length;
      const aytCount = (student.exams || []).filter(e => e.type === "AYT").length;
      document.getElementById("heroExamCount").textContent = `${tytCount} TYT / ${aytCount} AYT Sınav Sonucu`;

      const avatar = document.getElementById("heroAvatar");
      avatar.style.background = "#0f172a";
      avatar.textContent = "👥";
      return;
    }

    document.getElementById("heroName").textContent = student.name;
    document.getElementById("heroField").textContent = student.field;
    const secStr = student.section ? ` (${student.section} Şubesi)` : "";
    document.getElementById("heroGrade").textContent = `${student.grade}${secStr}`;
    document.getElementById("heroTarget").textContent = `${student.targetUniversity} - ${student.targetDepartment}`;
    document.getElementById("heroTargetNets").textContent = `Hedef: TYT ${student.targetTytNet} Net | AYT ${student.targetAytNet} Net`;

    const tytCount = (student.exams || []).filter(e => e.type === "TYT").length;
    const aytCount = (student.exams || []).filter(e => e.type === "AYT").length;
    document.getElementById("heroExamCount").textContent = `${tytCount} TYT / ${aytCount} AYT`;

    const avatar = document.getElementById("heroAvatar");
    avatar.style.background = student.avatarColor || "#1d4ed8";
    const initials = student.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    avatar.textContent = initials;
  }

  renderKpis(student) {
    const stats = AnalyticsEngine.getStudentStats(student);
    const analysis = AnalyticsEngine.analyzeProgress(student);

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

    document.getElementById("kpiLastTyt").textContent = stats.lastTyt > 0 ? stats.lastTyt : "-";
    const tytTrendEl = document.getElementById("kpiTytTrend");
    if (stats.lastTyt > 0) {
      const diff = stats.tytTargetDiff;
      const sign = diff >= 0 ? "+" : "";
      const colorClass = diff >= 0 ? "trend-up" : "trend-down";
      const lbl = stats.isAggregate ? "(Sınıf Ortalaması)" : "(Hedefe göre)";
      tytTrendEl.innerHTML = `<span class="${colorClass}">${sign}${diff} Net</span> <span style="color:var(--text-muted);">${lbl}</span>`;
    } else {
      tytTrendEl.innerHTML = `<span style="color:var(--text-muted);">-</span>`;
    }

    document.getElementById("kpiLastAyt").textContent = stats.lastAyt > 0 ? stats.lastAyt : "-";
    const aytTrendEl = document.getElementById("kpiAytTrend");
    if (stats.lastAyt > 0) {
      const diff = stats.aytTargetDiff;
      const sign = diff >= 0 ? "+" : "";
      const colorClass = diff >= 0 ? "trend-up" : "trend-down";
      const lbl = stats.isAggregate ? "(Sınıf Ortalaması)" : "(Hedefe göre)";
      aytTrendEl.innerHTML = `<span class="${colorClass}">${sign}${diff} Net</span> <span style="color:var(--text-muted);">${lbl}</span>`;
    } else {
      aytTrendEl.innerHTML = `<span style="color:var(--text-muted);">-</span>`;
    }

    document.getElementById("kpiWeeklyQuestions").textContent = `${stats.weeklyQuestions} / ${student.targetWeeklyQuestions}`;
    const fill = document.getElementById("kpiWeeklyProgressFill");
    if (fill) fill.style.width = `${stats.weeklyProgressPct}%`;
    document.getElementById("kpiWeeklyPct").textContent = `%${stats.weeklyProgressPct} Tamamlandı (${stats.totalQuestions} Toplam)`;

    document.getElementById("kpiAttendanceRate").textContent = `${stats.totalAbsentDays} Kayıt`;
    document.getElementById("kpiAttendanceDetails").textContent = `Toplam ${stats.totalAbsentHours} Ders Saati`;
  }

  renderCharts() {
    const student = window.store.getActiveStudent();
    if (!student) {
      const dashboardChartIds = [
        "chartTytDashboard", "chartAytDashboard", "chartQuestionsDashboard",
        "chartRadarDashboard", "chartAytRadarDashboard", "chartAttendanceDashboard"
      ];
      dashboardChartIds.forEach(id => {
        ChartManager.destroyChart(id);
        ChartManager.renderEmptyState(id, "Sınıf ve Şube seçilmediği için grafik verisi yok (0)");
      });
      return;
    }

    ChartManager.renderTytChart("chartTytDashboard", student.exams, student.targetTytNet);
    ChartManager.renderAytChart("chartAytDashboard", student.exams, student.targetAytNet, student.field);
    ChartManager.renderWeeklyQuestionsChart("chartQuestionsDashboard", student.questionLogs);
    ChartManager.renderSubjectRadar("chartRadarDashboard", student);
    ChartManager.renderAytSubjectRadar("chartAytRadarDashboard", student);
    ChartManager.renderAttendanceChart("chartAttendanceDashboard", student.courseAttendance);
  }

  renderExamsTable(student) {
    const tbody = document.getElementById("examsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!student) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:20px;">Deneme sınavlarını görüntülemek için lütfen Sınıf ve Şube seçiniz.</td></tr>`;
      return;
    }

    const role = window.store.getRole();
    const canManage = role === "admin" || role === "teacher";

    // Filtreleme Seçimi
    const filterSelect = document.getElementById("examFilterPeriod");
    const period = this.examFilterPeriod || (filterSelect ? filterSelect.value : "all");
    if (filterSelect && filterSelect.value !== period) {
      filterSelect.value = period;
    }

    // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
    const allExams = (student.exams || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    let filteredExams = allExams;
    let periodLabel = "Tüm Dönem";

    if (period.startsWith("m")) {
      const monthNum = parseInt(period.replace("m", ""), 10);
      const monthNames = [
        "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      periodLabel = `${monthNames[monthNum] || monthNum} Ayı`;

      filteredExams = allExams.filter(ex => {
        if (!ex.date) return false;
        const clean = String(ex.date).split("T")[0].trim();
        const parts = clean.split("-");
        if (parts.length === 3 && parts[0].length === 4) {
          return parseInt(parts[1], 10) === monthNum;
        }
        const dotParts = clean.split(".");
        if (dotParts.length === 3) {
          return parseInt(dotParts[1], 10) === monthNum;
        }
        const slashParts = clean.split("/");
        if (slashParts.length === 3) {
          return parseInt(slashParts[1], 10) === monthNum;
        }
        const d = new Date(ex.date);
        return !isNaN(d.getTime()) && (d.getMonth() + 1) === monthNum;
      });
    }

    if (filteredExams.length === 0) {
      const msg = period === "all" 
        ? "Kayıtlı deneme sınavı bulunmuyor." 
        : `Seçilen dönemde (${periodLabel}) kayıtlı deneme sınavı bulunamadı.`;
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:24px;">${msg}</td></tr>`;
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

      const targetStudentId = ex.studentId || (student && student.id !== "ALL" ? student.id : "");
      const actionHtml = canManage 
        ? `<td class="teacher-and-admin-only" style="white-space:nowrap; text-align:center;">
             <button class="btn btn-secondary btn-sm" style="padding:3px 8px; margin-right:4px;" onclick="app.editExam('${ex.id}','${targetStudentId}')">✏️ Güncelle</button>
             <button class="btn btn-danger btn-sm" style="padding:3px 8px;" onclick="app.deleteExam('${ex.id}','${targetStudentId}')">🗑️ Sil</button>
           </td>`
        : "";

      const studentBadge = student.isAggregate && ex.studentName
        ? `<span class="badge badge-outline" style="font-size:11px; margin-right:6px; color:var(--primary); font-weight:700;">${ex.studentName}</span>`
        : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${AnalyticsEngine.formatDateTurkish(ex.date)}</strong></td>
        <td><span class="badge ${ex.type === 'TYT' ? 'badge-primary' : 'badge-success'}">${ex.type}</span></td>
        <td>${studentBadge}<strong>${ex.name}</strong></td>
        <td>${"⭐".repeat(ex.difficulty || 3)}</td>
        <td style="font-size:12px; color:var(--text-muted);">${subjectSummary}</td>
        <td><strong style="color:var(--primary); font-size:14px;">${ex.totalNet} Net</strong></td>
        <td><span class="badge badge-outline">${ex.estimatedScore} Puan</span></td>
        <td style="font-size:12px; color:var(--text-muted);">${ex.notes || "-"}</td>
        ${actionHtml}
      `;
      tbody.appendChild(tr);
    });
  }

  renderQuestionsTable(student = null) {
    student = student || window.store.getActiveStudent();
    const tbody = document.getElementById("questionsTableBody");
    const cardsGrid = document.getElementById("questionSubjectCardsGrid");
    if (!tbody) return;

    if (!student) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Soru kayıtlarını görüntülemek için lütfen Sınıf ve Şube seçiniz.</td></tr>`;
      if (cardsGrid) cardsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:20px; font-size:12px;">Önce öğrenci seçimi yapınız.</div>`;
      const qCountBadge = document.getElementById("questionCardsCountBadge");
      if (qCountBadge) qCountBadge.textContent = "0 Ders";
      const targetCountEl = document.getElementById("qTargetCount");
      if (targetCountEl) targetCountEl.textContent = "0 Soru";
      const solvedEl = document.getElementById("qSolvedCount");
      if (solvedEl) solvedEl.textContent = "0 soru çözüldü";
      const accEl = document.getElementById("qAccuracyRate");
      if (accEl) accEl.textContent = "%0 Doğruluk Oranı";
      const progEl = document.getElementById("qTargetProgressFill");
      if (progEl) progEl.style.width = "0%";
      return;
    }

    const period = this.questionFilterPeriod || "weekly";

    // 1. Tarih Kapsamına Göre Filtrele (Haftalık, Aylık, Genel)
    let refDate = new Date();
    const allLogs = (student.questionLogs || []).slice();
    const allTimestamps = allLogs.map(q => new Date(q.date).getTime()).filter(t => !isNaN(t));
    if (allTimestamps.length > 0) {
      const maxDataTime = Math.max(...allTimestamps);
      if (refDate.getTime() < maxDataTime) {
        refDate = new Date(maxDataTime);
      }
    }

    let periodLogs = allLogs;
    let periodInfo = "Son 7 Günlük Kayıtlar";
    let periodBadgeText = "Haftalık (Son 7 Gün)";
    let periodTargetLabel = "Haftalık Hedef:";
    let targetQuestions = student.targetWeeklyQuestions || 1400;

    if (period === "weekly") {
      const sevenDaysAgo = new Date(refDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const endLimit = new Date(refDate.getTime() + 24 * 60 * 60 * 1000);
      periodLogs = allLogs.filter(q => {
        if (!q.date) return false;
        const d = new Date(q.date);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo && d <= endLimit;
      });
      periodInfo = "Son 7 Günlük Kayıtlar ve Dağılım";
      periodBadgeText = "Haftalık (Son 7 Gün)";
      periodTargetLabel = "Haftalık Hedef:";
      targetQuestions = student.targetWeeklyQuestions || 1400;
    } else if (period === "monthly") {
      const thirtyDaysAgo = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const endLimit = new Date(refDate.getTime() + 24 * 60 * 60 * 1000);
      periodLogs = allLogs.filter(q => {
        if (!q.date) return false;
        const d = new Date(q.date);
        return !isNaN(d.getTime()) && d >= thirtyDaysAgo && d <= endLimit;
      });
      periodInfo = "Son 30 Günlük Kayıtlar ve Dağılım";
      periodBadgeText = "Aylık (Son 30 Gün)";
      periodTargetLabel = "Aylık Hedef (Yaklaşık):";
      targetQuestions = (student.targetWeeklyQuestions || 1400) * 4;
    } else if (period === "all") {
      periodLogs = allLogs;
      periodInfo = "Tüm Dönem Kayıtları ve Genel Dağılım";
      periodBadgeText = "Tüm Dönem";
      periodTargetLabel = "Dönem Toplam Hedef:";
      targetQuestions = (student.targetWeeklyQuestions || 1400) * 16;
    }

    // Bilgi Etiketleri ve İlerleme Çubuğu Güncellemesi
    const pInfoEl = document.getElementById("questionPeriodInfoText");
    if (pInfoEl) pInfoEl.textContent = periodInfo;

    const qTargetBadge = document.getElementById("qTargetPeriodBadge");
    if (qTargetBadge) qTargetBadge.textContent = periodBadgeText;

    const cardsActiveScope = document.getElementById("questionCardsActiveScopeBadge");
    if (cardsActiveScope) cardsActiveScope.textContent = periodBadgeText;

    const qTargetLabelEl = document.getElementById("qTargetLabel");
    if (qTargetLabelEl) qTargetLabelEl.textContent = periodTargetLabel;

    const totalPeriodQuestions = periodLogs.reduce((sum, l) => sum + (Number(l.count) || 0), 0);
    const totalPeriodCorrect = periodLogs.reduce((sum, l) => sum + (Number(l.correct) || 0), 0);
    const totalPeriodWrong = periodLogs.reduce((sum, l) => sum + (Number(l.wrong) || 0), 0);
    const totalPeriodDuration = periodLogs.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
    const overallPeriodAccuracy = totalPeriodQuestions > 0 ? Math.round((totalPeriodCorrect / totalPeriodQuestions) * 100) : 0;
    const progressPct = targetQuestions > 0 ? Math.min(100, Math.round((totalPeriodQuestions / targetQuestions) * 100)) : 0;

    const targetCountEl = document.getElementById("qTargetCount");
    if (targetCountEl) targetCountEl.textContent = `${targetQuestions} Soru`;

    const solvedEl = document.getElementById("qSolvedCount");
    if (solvedEl) solvedEl.textContent = `${totalPeriodQuestions} soru çözüldü`;

    const accEl = document.getElementById("qAccuracyRate");
    if (accEl) accEl.textContent = `%${overallPeriodAccuracy} Doğruluk Oranı`;

    const progEl = document.getElementById("qTargetProgressFill");
    if (progEl) progEl.style.width = `${progressPct}%`;

    // 2. Branş / Ders Bazlı Toplama
    const subjectMap = {};
    periodLogs.forEach(l => {
      const subj = (l.subject || "Diğer").trim();
      if (!subjectMap[subj]) {
        subjectMap[subj] = { subject: subj, count: 0, correct: 0, wrong: 0, duration: 0 };
      }
      subjectMap[subj].count += Number(l.count) || 0;
      subjectMap[subj].correct += Number(l.correct) || 0;
      subjectMap[subj].wrong += Number(l.wrong) || 0;
      subjectMap[subj].duration += Number(l.duration) || 0;
    });

    const subjectList = Object.values(subjectMap).sort((a, b) => b.count - a.count);

    const qCountBadge = document.getElementById("questionCardsCountBadge");
    if (qCountBadge) qCountBadge.textContent = `${subjectList.length} Farklı Ders`;

    // Branş Renk Paleti Haritası
    const getSubjectColor = (subj) => {
      const s = (subj || "").toLowerCase();
      if (s.includes("mat")) return "#2563eb";
      if (s.includes("geo")) return "#0284c7";
      if (s.includes("fiz")) return "#7c3aed";
      if (s.includes("kim")) return "#ea580c";
      if (s.includes("biy")) return "#059669";
      if (s.includes("türk") || s.includes("parag")) return "#e11d48";
      if (s.includes("edeb")) return "#db2777";
      if (s.includes("tar")) return "#d97706";
      if (s.includes("coğ")) return "#0d9488";
      if (s.includes("fels") || s.includes("din")) return "#475569";
      return "#4f46e5";
    };

    // 3. Özet Kartları Render Et
    if (cardsGrid) {
      cardsGrid.innerHTML = "";

      // 3.1. "Tüm Dersler (Toplam)" Kartı
      const isAllActive = !this.questionFilterSubject;
      const allCard = document.createElement("div");
      allCard.className = `subject-summary-card ${isAllActive ? 'active' : ''}`;
      allCard.style.borderTopColor = "var(--primary)";
      allCard.innerHTML = `
        <div class="subject-card-header">
          <span class="subject-card-name" style="color:var(--primary); font-weight:800;">📚 Tüm Dersler</span>
          <span class="badge ${overallPeriodAccuracy >= 80 ? 'badge-success' : 'badge-primary'}" style="font-size: 10px; padding: 1px 6px;">%${overallPeriodAccuracy}</span>
        </div>
        <div class="subject-card-count">
          ${totalPeriodQuestions} <span>Soru</span>
        </div>
        <div class="subject-card-meta">
          <span><strong style="color:var(--secondary);">${totalPeriodCorrect}D</strong> / <strong style="color:var(--danger);">${totalPeriodWrong}Y</strong></span>
          <span>${totalPeriodDuration > 0 ? totalPeriodDuration + ' Dk' : ''}</span>
        </div>
      `;
      allCard.addEventListener("click", () => {
        this.questionFilterSubject = null;
        this.renderQuestionsTable(student);
      });
      cardsGrid.appendChild(allCard);

      // 3.2. Her Bir Ders İçin Kart
      subjectList.forEach(stat => {
        const isSubjActive = this.questionFilterSubject && this.questionFilterSubject.toLowerCase() === stat.subject.toLowerCase();
        const acc = stat.count > 0 ? Math.round((stat.correct / stat.count) * 100) : 0;
        const color = getSubjectColor(stat.subject);

        const card = document.createElement("div");
        card.className = `subject-summary-card ${isSubjActive ? 'active' : ''}`;
        card.style.borderTopColor = color;
        card.innerHTML = `
          <div class="subject-card-header">
            <span class="subject-card-name" title="${stat.subject}">${stat.subject}</span>
            <span class="badge ${acc >= 80 ? 'badge-success' : (acc >= 65 ? 'badge-primary' : 'badge-warning')}" style="font-size: 10px; padding: 1px 6px;">%${acc}</span>
          </div>
          <div class="subject-card-count" style="color:${color};">
            ${stat.count} <span>Soru</span>
          </div>
          <div class="subject-card-meta">
            <span><strong style="color:var(--secondary);">${stat.correct}D</strong> / <strong style="color:var(--danger);">${stat.wrong}Y</strong></span>
            <span>${stat.duration > 0 ? stat.duration + ' Dk' : ''}</span>
          </div>
        `;
        card.addEventListener("click", () => {
          if (this.questionFilterSubject && this.questionFilterSubject.toLowerCase() === stat.subject.toLowerCase()) {
            this.questionFilterSubject = null;
          } else {
            this.questionFilterSubject = stat.subject;
          }
          this.renderQuestionsTable(student);
        });
        cardsGrid.appendChild(card);
      });

      if (subjectList.length === 0) {
        cardsGrid.innerHTML += `
          <div style="grid-column: 2 / -1; display:flex; align-items:center; color:var(--text-muted); font-size:12px; padding:10px;">
            Bu dönemde henüz soru kaydı bulunmuyor. Yeni kayıt ekleyebilirsiniz.
          </div>
        `;
      }
    }

    // 4. Tablo Filtreleme ve Başlık Durumu
    let displayLogs = periodLogs.slice();
    const activeBadge = document.getElementById("activeSubjectBadge");
    const clearBtn = document.getElementById("btnClearSubjectFilter");

    if (this.questionFilterSubject) {
      displayLogs = periodLogs.filter(l => (l.subject || "").toLowerCase() === this.questionFilterSubject.toLowerCase());
      if (activeBadge) {
        activeBadge.style.display = "inline-flex";
        activeBadge.textContent = `Filtrelenen Ders: ${this.questionFilterSubject} (${displayLogs.length} Kayıt)`;
      }
      if (clearBtn) clearBtn.style.display = "inline-flex";
    } else {
      if (activeBadge) activeBadge.style.display = "none";
      if (clearBtn) clearBtn.style.display = "none";
    }

    // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
    displayLogs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // 5. Tablo Satırlarını Render Et (Kompakt ve Daraltılmış)
    tbody.innerHTML = "";
    if (displayLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:16px;">Seçilen dönemde ve ders kriterinde soru kaydı bulunamadı.</td></tr>`;
      return;
    }

    displayLogs.forEach(l => {
      const correct = Number(l.correct) || 0;
      const total = Number(l.count) || 0;
      const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
      const targetStudentId = l.studentId || (student && student.id !== "ALL" ? student.id : "");
      
      const actionHtml = `
        <td style="white-space:nowrap; text-align:center;">
          <button class="btn btn-secondary btn-sm" onclick="app.editQuestionLog('${l.id}','${targetStudentId}')">✏️ Güncelle</button>
          <button class="btn btn-danger btn-sm" onclick="app.deleteQuestionLog('${l.id}','${targetStudentId}')">🗑️ Sil</button>
        </td>`;

      const studentBadge = student.isAggregate && l.studentName
        ? `<span class="badge badge-outline" style="font-size:10px; margin-left:4px;">${l.studentName}</span>`
        : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${AnalyticsEngine.formatDateTurkish(l.date)}</strong></td>
        <td><strong>${l.subject}</strong> ${studentBadge}</td>
        <td><strong>${l.count}</strong></td>
        <td style="color:var(--secondary); font-weight:700;">${l.correct || 0}</td>
        <td style="color:var(--danger); font-weight:700;">${l.wrong || 0}</td>
        <td><span class="badge ${rate >= 75 ? 'badge-success' : 'badge-warning'}" style="font-size:11px; padding:2px 6px;">%${rate}</span></td>
        <td>${l.duration ? l.duration + ' Dk' : '-'}</td>
        ${actionHtml}
      `;
      tbody.appendChild(tr);
    });
  }

  // 1. Ders Devamsızlıkları Tablosu
  renderCourseAttendanceTable(student) {
    const tbody = document.getElementById("courseAttendanceTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const role = window.store.getRole();
    const canManage = role === "admin" || role === "teacher";
    // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
    const list = (student.courseAttendance || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">Kayıtlı ders devamsızlığı bulunmuyor.</td></tr>`;
      return;
    }

    list.forEach(a => {
      let bClass = "badge-danger";
      if (a.type.includes("Özürlü")) bClass = "badge-warning";
      else if (a.type.includes("İzinli")) bClass = "badge-info";

      const targetStudentId = a.studentId || (student && student.id !== "ALL" ? student.id : "");
      const actionHtml = canManage
        ? `<td class="teacher-and-admin-only" style="white-space:nowrap; text-align:center;">
             <button class="btn btn-secondary btn-sm" style="padding:3px 8px; margin-right:4px;" onclick="app.editCourseAttendance('${a.id}','${targetStudentId}')">✏️ Güncelle</button>
             <button class="btn btn-danger btn-sm" style="padding:3px 8px;" onclick="app.deleteCourseAttendance('${a.id}','${targetStudentId}')">🗑️ Sil</button>
           </td>`
        : "";

      const studentBadge = student.isAggregate && a.studentName
        ? `<span class="badge badge-outline" style="font-size:10px; margin-left:4px;">${a.studentName}</span>`
        : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${AnalyticsEngine.formatDateTurkish(a.date)}</strong> ${studentBadge}</td>
        <td><span class="badge ${bClass}">${a.type}</span></td>
        <td>${a.hours} Saat</td>
        <td style="color:var(--text-muted);">${a.reason || "-"}</td>
        ${actionHtml}
      `;
      tbody.appendChild(tr);
    });
  }

  // 2. Koçluk Seansları Listesi
  renderCoachingSessions(student) {
    const container = document.getElementById("coachingSessionsContainer");
    if (!container) return;
    container.innerHTML = "";

    const role = window.store.getRole();
    const canManage = role === "admin" || role === "teacher";
    // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
    const sessions = (student.coachingSessions || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (sessions.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">Henüz koçluk seansı kaydedilmedi.</p>`;
      return;
    }

    sessions.forEach(s => {
      const card = document.createElement("div");
      card.style.cssText = "background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:14px; margin-bottom:12px;";

      const assignmentsHtml = (s.assignments || []).map(a => `<li style="margin-left:18px; margin-top:3px;">${a}</li>`).join("");
      const studentBadge = student.isAggregate && s.studentName
        ? `<span class="badge badge-outline" style="font-size:11px; margin-left:6px;">${s.studentName}</span>`
        : "";
      const targetStudentId = s.studentId || (student && student.id !== "ALL" ? student.id : "");

      const actionsHtml = canManage
        ? `<button class="btn btn-secondary btn-sm" style="margin-left:8px; padding:2px 8px;" onclick="app.editCoachingSession('${s.id}','${targetStudentId}')">✏️ Güncelle</button>
           <button class="btn btn-danger btn-sm" style="margin-left:6px; padding:2px 8px;" onclick="app.deleteCoachingSession('${s.id}','${targetStudentId}')">🗑️ Sil</button>`
        : "";

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
          <div>
            <strong style="font-size:14px;">${s.title}</strong> ${studentBadge}
            <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">(${AnalyticsEngine.formatDateTurkish(s.date)})</span>
          </div>
          <div style="display:flex; align-items:center;">
            <span class="badge ${s.status === 'Katıldı' ? 'badge-success' : 'badge-danger'}">${s.status}</span>
            <span class="badge badge-outline" style="margin-left:6px;">Motivasyon: ${s.studentMotivation}/10</span>
            ${actionsHtml}
          </div>
        </div>
        <p style="font-size:13px; color:var(--text-main); margin-bottom:8px;">${s.summary}</p>
        ${assignmentsHtml ? `
          <div style="font-size:12px; color:var(--text-muted);">
            <strong>Verilen Ödevler:</strong>
            <ul style="margin-top:2px;">${assignmentsHtml}</ul>
          </div>
        ` : ''}
      `;
      container.appendChild(card);
    });
  }

  renderAnalysisDetails() {
    const student = window.store.getActiveStudent();
    if (!student) {
      const badgeDetail = document.getElementById("analysisStatusBadgeDetail");
      if (badgeDetail) badgeDetail.innerHTML = `<span class="badge badge-outline" style="font-size:13px; padding:6px 12px;">Sınıf/Şube Seçiniz</span>`;
      const sList = document.getElementById("strengthsList");
      if (sList) sList.innerHTML = `<span style="color:var(--text-muted);">Sınıf ve şube seçilmediği için analiz verisi yok (0).</span>`;
      const wList = document.getElementById("weaknessesList");
      if (wList) wList.innerHTML = `<span style="color:var(--text-muted);">Sınıf ve şube seçilmediği için analiz verisi yok (0).</span>`;
      const tipsList = document.getElementById("coachingTipsList");
      if (tipsList) tipsList.innerHTML = `<div style="background:var(--bg-main); padding:9px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:13px; color:var(--text-muted);">📌 Lütfen yukarıdan Sınıf ve Şube seçiniz.</div>`;
      return;
    }

    const analysis = AnalyticsEngine.analyzeProgress(student);

    const badgeDetail = document.getElementById("analysisStatusBadgeDetail");
    if (badgeDetail) {
      let bClass = "badge-info";
      if (analysis.statusType === "success") bClass = "badge-success";
      else if (analysis.statusType === "danger") bClass = "badge-danger";
      else if (analysis.statusType === "warning") bClass = "badge-warning";
      badgeDetail.innerHTML = `<span class="badge ${bClass}" style="font-size:13px; padding:6px 12px;">${analysis.status}</span>`;
    }

    const sList = document.getElementById("strengthsList");
    if (sList) {
      sList.innerHTML = "";
      if (analysis.strengths.length === 0) {
        sList.innerHTML = `<span style="color:var(--text-muted);">Henüz %70 üzeri barajı geçen branş verisi yok.</span>`;
      } else {
        analysis.strengths.forEach(s => {
          sList.innerHTML += `<div><strong>${s.subject}:</strong> ${s.net} Net (%${s.rate} Başarı)</div>`;
        });
      }
    }

    const wList = document.getElementById("weaknessesList");
    if (wList) {
      wList.innerHTML = "";
      if (analysis.weaknesses.length === 0) {
        wList.innerHTML = `<span style="color:var(--text-muted);">Kritik düşüş gösteren branş bulunmuyor.</span>`;
      } else {
        analysis.weaknesses.forEach(w => {
          wList.innerHTML += `<div><strong>${w.subject}:</strong> ${w.net} Net (%${w.rate} Başarı) - <em>Öncelikli Tekrar</em></div>`;
        });
      }
    }

    const tipsList = document.getElementById("coachingTipsList");
    if (tipsList) {
      tipsList.innerHTML = "";
      analysis.recommendations.forEach(tip => {
        const item = document.createElement("div");
        item.style.cssText = "background:var(--bg-main); padding:9px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:13px; display:flex; gap:8px;";
        item.innerHTML = `<span>📌</span><div>${tip}</div>`;
        tipsList.appendChild(item);
      });
    }
  }

  // --- Karne Filtreleme ve Kapsam Yardımcısı (Haftalık, Aylık, Genel) ---
  getKarneFilteredData(student, period = "all") {
    if (!student) return null;

    let periodLabel = "Genel Karne (Tüm Dönem)";
    let section2Title = "2. Performans ve Çalışma Özeti (Tüm Dönem)";
    let section3Title = "3. Deneme Sınavları Sonuçları";
    let tytLabel = "Son TYT / En Yüksek TYT";
    let aytLabel = "Son AYT / En Yüksek AYT";
    let questionLabel = "Toplam Çözülen Soru";
    let attendanceLabel = "Ders Devamsızlığı";

    if (period === "all" || !period) {
      return {
        scopedStudent: student,
        periodLabel,
        section2Title,
        section3Title,
        tytLabel,
        aytLabel,
        questionLabel,
        attendanceLabel,
        period: "all"
      };
    }

    // Referans tarih: Öğrencinin aktivitelerinden veya geçerli tarihten en güncel olanı referans alır
    let refDate = new Date();
    const allTimestamps = [
      ...(student.exams || []).map(e => new Date(e.date).getTime()),
      ...(student.questionLogs || []).map(q => new Date(q.date).getTime()),
      ...(student.courseAttendance || []).map(a => new Date(a.date).getTime())
    ].filter(t => !isNaN(t));

    if (allTimestamps.length > 0) {
      const maxDataTime = Math.max(...allTimestamps);
      if (refDate.getTime() < maxDataTime) {
        refDate = new Date(maxDataTime);
      }
    }

    let filterFn = () => true;

    if (period === "weekly") {
      const sevenDaysAgo = new Date(refDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const endLimit = new Date(refDate.getTime() + 24 * 60 * 60 * 1000);
      filterFn = (dStr) => {
        if (!dStr) return false;
        const d = new Date(dStr);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo && d <= endLimit;
      };
      periodLabel = "Haftalık Karne (Son 7 Gün)";
      section2Title = "2. Haftalık Performans ve Çalışma Özeti (Son 7 Gün)";
      section3Title = "3. Bu Haftaki Deneme Sınavları";
      tytLabel = "Haftalık Son TYT / En İyi TYT";
      aytLabel = "Haftalık Son AYT / En İyi AYT";
      questionLabel = "Bu Hafta Çözülen Soru";
      attendanceLabel = "Haftalık Devamsızlık";
    } else if (period === "monthly") {
      const thirtyDaysAgo = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const endLimit = new Date(refDate.getTime() + 24 * 60 * 60 * 1000);
      filterFn = (dStr) => {
        if (!dStr) return false;
        const d = new Date(dStr);
        return !isNaN(d.getTime()) && d >= thirtyDaysAgo && d <= endLimit;
      };
      periodLabel = "Aylık Karne (Son 30 Gün)";
      section2Title = "2. Aylık Performans ve Çalışma Özeti (Son 30 Gün)";
      section3Title = "3. Bu Ayki Deneme Sınavları (Son 30 Gün)";
      tytLabel = "Aylık Son TYT / En İyi TYT";
      aytLabel = "Aylık Son AYT / En İyi AYT";
      questionLabel = "Bu Ay Çözülen Soru (Son 30 Gün)";
      attendanceLabel = "Aylık Devamsızlık (Son 30 Gün)";
    } else if (period.startsWith("m")) {
      const monthNum = parseInt(period.replace("m", ""), 10);
      const monthNames = [
        "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      const mName = monthNames[monthNum] || `Ay ${monthNum}`;
      filterFn = (dStr) => {
        if (!dStr) return false;
        const d = new Date(dStr);
        return !isNaN(d.getTime()) && (d.getMonth() + 1) === monthNum;
      };
      periodLabel = `${mName} Ayı Karnesi`;
      section2Title = `2. ${mName} Ayı Performans ve Çalışma Özeti`;
      section3Title = `3. ${mName} Ayı Deneme Sınavları Sonuçları`;
      tytLabel = `${mName} Son TYT / En İyi TYT`;
      aytLabel = `${mName} Son AYT / En İyi AYT`;
      questionLabel = `${mName} Ayı Çözülen Soru`;
      attendanceLabel = `${mName} Ayı Devamsızlık`;
    }

    const filteredExams = (student.exams || []).filter(e => filterFn(e.date));
    const filteredQuestions = (student.questionLogs || []).filter(q => filterFn(q.date));
    const filteredAttendance = (student.courseAttendance || []).filter(a => filterFn(a.date));
    const filteredSessions = (student.coachingSessions || []).filter(c => filterFn(c.date));

    const scopedStudent = {
      ...student,
      exams: filteredExams,
      questionLogs: filteredQuestions,
      courseAttendance: filteredAttendance,
      coachingSessions: filteredSessions.length > 0 ? filteredSessions : (student.coachingSessions || [])
    };

    return {
      scopedStudent,
      periodLabel,
      section2Title,
      section3Title,
      tytLabel,
      aytLabel,
      questionLabel,
      attendanceLabel,
      period
    };
  }

  renderKarne(periodOverride = null) {
    const student = window.store.getActiveStudent();
    if (!student) {
      document.getElementById("karneReportDate").textContent = new Date().toLocaleDateString("tr-TR");
      const nameEl = document.getElementById("karneStudentName");
      if (nameEl) nameEl.textContent = "Sınıf ve Şube Seçiniz";
      const signNameEl = document.getElementById("karneSignStudentName");
      if (signNameEl) signNameEl.textContent = "-";
      const fieldEl = document.getElementById("karneStudentField");
      if (fieldEl) fieldEl.textContent = "-";
      const targetEl = document.getElementById("karneStudentTarget");
      if (targetEl) targetEl.textContent = "-";
      const netsEl = document.getElementById("karneStudentTargetNets");
      if (netsEl) netsEl.textContent = "TYT: 0 | AYT: 0 Net";
      const tytSum = document.getElementById("karneTytSummary");
      if (tytSum) tytSum.textContent = "0 / 0 Net";
      const aytSum = document.getElementById("karneAytSummary");
      if (aytSum) aytSum.textContent = "0 / 0 Net";
      const qSum = document.getElementById("karneTotalQuestions");
      if (qSum) qSum.textContent = "0 Soru (%0 Doğruluk)";
      const attSum = document.getElementById("karneAttendanceSummary");
      if (attSum) attSum.textContent = "0 Gün (0 Saat)";
      const tbody = document.getElementById("karneExamsTableBody");
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">Karne oluşturmak için lütfen Sınıf ve Şube seçiniz.</td></tr>`;
      const pScopeEl = document.getElementById("karnePeriodScopeText");
      if (pScopeEl) pScopeEl.textContent = "Genel Karne (Tüm Dönem)";
      return;
    }

    const periodSelect = document.getElementById("karnePeriodSelect");
    const period = periodOverride || (periodSelect ? periodSelect.value : "all");
    const filterResult = this.getKarneFilteredData(student, period);
    const scopedStudent = filterResult.scopedStudent;

    const stats = AnalyticsEngine.getStudentStats(scopedStudent);
    const analysis = AnalyticsEngine.analyzeProgress(scopedStudent);

    // Kapsam ve Başlık Etiketleri
    const pScopeEl = document.getElementById("karnePeriodScopeText");
    if (pScopeEl) pScopeEl.textContent = filterResult.periodLabel;

    const s2Title = document.getElementById("karneSection2Title");
    if (s2Title) s2Title.textContent = filterResult.section2Title;

    const s3Title = document.getElementById("karneSection3Title");
    if (s3Title) s3Title.textContent = filterResult.section3Title;

    const tytLbl = document.getElementById("karneTytLabel");
    if (tytLbl) tytLbl.textContent = filterResult.tytLabel;

    const aytLbl = document.getElementById("karneAytLabel");
    if (aytLbl) aytLbl.textContent = filterResult.aytLabel;

    const qLbl = document.getElementById("karneQuestionLabel");
    if (qLbl) qLbl.textContent = filterResult.questionLabel;

    const attLbl = document.getElementById("karneAttendanceLabel");
    if (attLbl) attLbl.textContent = filterResult.attendanceLabel;

    // 1. Öğrenci Bilgileri
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    document.getElementById("karneReportDate").textContent = `${dd}.${mm}.${yyyy}`;
    document.getElementById("karneStudentName").textContent = student.name;
    document.getElementById("karneSignStudentName").textContent = student.name;
    document.getElementById("karneStudentField").textContent = `${student.grade} / ${student.field}`;
    document.getElementById("karneStudentTarget").textContent = `${student.targetUniversity} - ${student.targetDepartment}`;
    document.getElementById("karneStudentTargetNets").textContent = `TYT: ${student.targetTytNet} | AYT: ${student.targetAytNet} Net`;

    // 2. Performans Özeti
    document.getElementById("karneTytSummary").textContent = stats.tytCount > 0 ? `${stats.lastTyt} / ${stats.maxTyt} Net` : "- / -";
    document.getElementById("karneAytSummary").textContent = stats.aytCount > 0 ? `${stats.lastAyt} / ${stats.maxAyt} Net` : "- / -";
    document.getElementById("karneTotalQuestions").textContent = `${stats.totalQuestions} Soru (%${stats.accuracyRate} Doğruluk)`;
    document.getElementById("karneAttendanceSummary").textContent = `${stats.totalAbsentDays} Gün (${stats.totalAbsentHours} Saat)`;

    // 3. Denemeler Tablosu (Seçilen Döneme Göre)
    const tbody = document.getElementById("karneExamsTableBody");
    if (tbody) {
      tbody.innerHTML = "";
      const periodExams = (scopedStudent.exams || []).slice().reverse();
      if (periodExams.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:18px; color:var(--text-muted);">Seçilen dönemde (${filterResult.periodLabel}) kayıtlı deneme sınavı bulunamadı.</td></tr>`;
      } else {
        periodExams.slice(0, 10).forEach((ex, idx) => {
          let summary = "";
          if (ex.type === "TYT" && ex.tyt) {
            summary = `Tr: ${ex.tyt.turkce?.net || 0} | Mat: ${ex.tyt.matematik?.net || 0} | Sos: ${ex.tyt.sosyal?.net || 0} | Fen: ${ex.tyt.fen?.net || 0}`;
          } else if (ex.type === "AYT" && ex.ayt) {
            const arr = [];
            if (ex.ayt.matematik) arr.push(`Mat: ${ex.ayt.matematik.net}`);
            if (ex.ayt.fizik) arr.push(`Fiz: ${ex.ayt.fizik.net}`);
            if (ex.ayt.kimya) arr.push(`Kim: ${ex.ayt.kimya.net}`);
            if (ex.ayt.biyoloji) arr.push(`Biyo: ${ex.ayt.biyoloji.net}`);
            if (ex.ayt.edebiyat) arr.push(`Edb: ${ex.ayt.edebiyat.net}`);
            if (ex.ayt.tarih1) arr.push(`Tar: ${ex.ayt.tarih1.net}`);
            if (ex.ayt.cografya1) arr.push(`Coğ: ${ex.ayt.cografya1.net}`);
            summary = arr.join(" | ");
          }

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${AnalyticsEngine.formatDateTurkish(ex.date)}</td>
            <td><strong>${ex.type}</strong></td>
            <td>${ex.name}</td>
            <td style="font-size:11px;">${summary || "-"}</td>
            <td><strong>${ex.totalNet} Net</strong></td>
            <td>${ex.estimatedScore}</td>
            <td>${idx === 0 ? 'Son Sınav (' + analysis.status + ')' : 'Stabil'}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // 4. Koçluk Değerlendirmesi ve Aksiyon Planı
    const reviewBox = document.getElementById("karneCoachReviewText");
    if (reviewBox) {
      const latestSession = (scopedStudent.coachingSessions || [])[0];
      const noteSummary = latestSession ? latestSession.summary : (student.notes || "Öğrenci genel olarak planlanan çalışma disiplinine ve koçluk hedeflerine uyum göstermektedir.");
      let tipsHtml = "";
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        tipsHtml = analysis.recommendations.map(r => `<li>${r}</li>`).join("");
      } else {
        tipsHtml = `<li>${filterResult.periodLabel} dönemi hedefleri doğrultusunda haftalık soru hedeflerine ve deneme tekrarlarına devam edilmelidir.</li>`;
      }

      reviewBox.innerHTML = `
        <p style="margin-bottom:8px;"><strong>Koçluk Değerlendirmesi:</strong> ${noteSummary}</p>
        <p style="margin-bottom:6px;"><strong>Önerilen Aksiyon Planı ve Hedefler (${filterResult.periodLabel}):</strong></p>
        <ul style="margin-left: 20px;">
          ${tipsHtml}
        </ul>
      `;
    }
  }

  // --- Sağlam PDF / Yazdır Fonksiyonu (Google Sites ve İframe Uyumlu) ---
  printKarne() {
    const student = window.store.getActiveStudent();
    if (!student) {
      if (typeof this.showToast === "function") {
        this.showToast("Önce bir öğrenci seçiniz.", "warning");
      } else {
        alert("Önce bir öğrenci seçiniz.");
      }
      return;
    }

    const karneElem = document.getElementById("karneDocument");
    if (!karneElem) return;

    const periodSelect = document.getElementById("karnePeriodSelect");
    const periodValue = periodSelect ? periodSelect.value : "all";
    const periodLabel = periodSelect ? periodSelect.options[periodSelect.selectedIndex]?.text : "Genel Karne";
    const reportDate = document.getElementById("karneReportDate")?.textContent || AnalyticsEngine.formatDateTurkish(new Date().toISOString().split("T")[0]);

    // Yazdırma yükünü hazırla
    const payload = {
      title: `Öğrenci Karnesi (${periodLabel}) - ${student.name}`,
      studentName: student.name,
      periodValue: periodValue,
      periodLabel: periodLabel,
      date: reportDate,
      html: karneElem.outerHTML
    };

    // 1. localStorage'a kaydet (aynı origin sekmeleri için)
    try {
      localStorage.setItem("ngk_karne_print_payload", JSON.stringify(payload));
    } catch (e) {
      console.warn("localStorage payload kaydı yapılamadı:", e);
    }

    // 2. Base64 hash hazırla (Google Sites iframe sandbox ve storage partitioning izolasyonunu %100 aşar)
    let b64 = "";
    try {
      b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } catch (err) {
      console.warn("Base64 encode hatası:", err);
    }

    const printUrl = b64 ? `karne.html#k=${b64}` : `karne.html?period=${encodeURIComponent(periodValue)}`;

    // 3. Güvenli şekilde yeni sekmede aç (link click kullanıcı jestini korur, Google Sites sandbox popup kuralına tam uyar)
    try {
      const link = document.createElement("a");
      link.href = printUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try { document.body.removeChild(link); } catch (e) {}
      }, 150);
    } catch (linkErr) {
      console.warn("Link tıklama açılamadı, window.open deneniyor:", linkErr);
      try {
        const win = window.open(printUrl, "_blank");
        if (win) win.focus();
      } catch (winErr) {
        // Son çare: Doğrudan sayfa içi yazdır
        window.print();
      }
    }
  }

  // --- Modal Yönetimi ---
  openModal(modalId, isEdit = false) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (!isEdit) {
      // Yeni kayıt modu: önceki düzenleme durumunu ve form değerlerini temizle
      this.editing = null;
      this.modalStudentOverride = null;
      const formMap = { modalTeacher: "formTeacher", modalExam: "formExam", modalQuestion: "formQuestion", modalBulkCourseAttendance: "formBulkAttendance", modalSession: "formSession" };
      if (formMap[modalId]) document.getElementById(formMap[modalId])?.reset();
      if (modalId === "modalTeacher") {
        const tb = document.getElementById("tBranch");
        if (tb) tb.value = "";
      }
      this.setModalMode(modalId, false);
    }
    modal.classList.add("active");

    const today = new Date().toISOString().split("T")[0];
    if (isEdit) {
      // düzenleme: tarih alanlarını çağıran metod doldurur
    } else if (modalId === "modalExam") {
      document.getElementById("examDate").value = today;
      this.handleExamTypeChange(document.getElementById("examTypeSelect").value);
    } else if (modalId === "modalQuestion") {
      document.getElementById("qDate").value = today;
    } else if (modalId === "modalBulkCourseAttendance") {
      document.getElementById("bulkStartDate").value = today;
      document.getElementById("bulkEndDate").value = today;
    } else if (modalId === "modalSession") {
      document.getElementById("csDate").value = today;
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
    this.editing = null;
    this.modalStudentOverride = null;
    this.setModalMode(modalId, false);
  }

  // Modal başlık ve kaydet butonunu ekleme / güncelleme moduna göre ayarlar
  setModalMode(modalId, isEdit) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const saveIds = { modalExam: "btnSaveExam", modalQuestion: "btnSaveQuestion", modalBulkCourseAttendance: "btnSaveBulkAttendance", modalSession: "btnSaveSession" };
    const titleEl = modal.querySelector(".modal-header h3");
    const btn = document.getElementById(saveIds[modalId]);
    if (titleEl) {
      if (!titleEl.dataset.orig) titleEl.dataset.orig = titleEl.textContent;
      titleEl.textContent = isEdit ? "Kaydı Güncelle" : titleEl.dataset.orig;
    }
    if (btn) {
      if (!btn.dataset.orig) btn.dataset.orig = btn.textContent;
      btn.textContent = isEdit ? "Güncelle" : btn.dataset.orig;
    }
  }

  // Düzenlenen kaydın ait olduğu öğrenci (yoksa aktif öğrenci)
  getModalStudent() {
    return this.modalStudentOverride || window.store.getActiveStudent();
  }

  findRecord(collection, id, sid) {
    const s = (window.store.data.students || []).find(x => x.id === sid);
    const rec = s && (s[collection] || []).find(r => r.id === id);
    return rec ? { student: s, record: rec } : null;
  }

  setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v === undefined || v === null ? "" : v;
  }

  // --- Güncelleme (Öğretmen / Yönetici / Öğrenci) ---
  editExam(id, sid) {
    const found = this.findRecord("exams", id, sid);
    if (!found) return;
    const ex = found.record;
    this.editing = { kind: "exam", id, sid: found.student.id };
    this.modalStudentOverride = found.student;
    this.openModal("modalExam", true);
    this.setModalMode("modalExam", true);
    this.setVal("examName", ex.name);
    this.setVal("examDate", ex.date);
    this.setVal("examTypeSelect", ex.type);
    this.setVal("examDifficulty", ex.difficulty || 3);
    this.setVal("examNotes", ex.notes || "");
    this.handleExamTypeChange(ex.type);
    const fill = (prefix, obj) => {
      this.setVal(prefix + "D", obj ? obj.d : "");
      this.setVal(prefix + "Y", obj ? obj.y : "");
    };
    if (ex.type === "TYT" && ex.tyt) {
      fill("tytTurkce", ex.tyt.turkce); fill("tytMat", ex.tyt.matematik);
      fill("tytSos", ex.tyt.sosyal); fill("tytFen", ex.tyt.fen);
    } else if (ex.ayt) {
      fill("aytMat", ex.ayt.matematik); fill("aytFiz", ex.ayt.fizik);
      fill("aytKim", ex.ayt.kimya); fill("aytBiy", ex.ayt.biyoloji);
      fill("aytEdb", ex.ayt.edebiyat); fill("aytTar1", ex.ayt.tarih1);
      fill("aytCog1", ex.ayt.cografya1);
    }
    this.calculateExamLiveNets();
  }

  editQuestionLog(id, sid) {
    const found = this.findRecord("questionLogs", id, sid);
    if (!found) return;
    const l = found.record;
    this.editing = { kind: "question", id, sid: found.student.id };
    this.modalStudentOverride = found.student;
    this.openModal("modalQuestion", true);
    this.setModalMode("modalQuestion", true);
    this.setVal("qDate", l.date); this.setVal("qSubject", l.subject);
    this.setVal("qCount", l.count); this.setVal("qCorrect", l.correct);
    this.setVal("qWrong", l.wrong); this.setVal("qDuration", l.duration);
  }

  editCourseAttendance(id, sid) {
    const found = this.findRecord("courseAttendance", id, sid);
    if (!found) return;
    const a = found.record;
    this.editing = { kind: "attendance", id, sid: found.student.id };
    this.modalStudentOverride = found.student;
    this.openModal("modalBulkCourseAttendance", true);
    this.setModalMode("modalBulkCourseAttendance", true);
    this.setVal("bulkStartDate", a.date); this.setVal("bulkEndDate", a.date);
    this.setVal("bulkType", a.type); this.setVal("bulkHours", a.hours);
    this.setVal("bulkReason", a.reason || "");
  }

  editCoachingSession(id, sid) {
    const found = this.findRecord("coachingSessions", id, sid);
    if (!found) return;
    const s = found.record;
    this.editing = { kind: "session", id, sid: found.student.id };
    this.modalStudentOverride = found.student;
    this.openModal("modalSession", true);
    this.setModalMode("modalSession", true);
    this.setVal("csDate", s.date); this.setVal("csTitle", s.title);
    this.setVal("csStatus", s.status); this.setVal("csMotivation", s.studentMotivation);
    this.setVal("csSummary", s.summary); this.setVal("csAssignments", (s.assignments || []).join("\n"));
  }

  handleExamTypeChange(type) {
    const tytBox = document.getElementById("tytFieldsBox");
    const aytBox = document.getElementById("aytFieldsBox");
    const aytSayisal = document.getElementById("aytSayisalFields");
    const aytEa = document.getElementById("aytEaFields");

    const student = this.getModalStudent();
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
      const matD = document.getElementById("aytMatD").value;
      const matY = document.getElementById("aytMatY").value;
      const matNet = AnalyticsEngine.calcNet(matD, matY);
      document.getElementById("aytMatNet").value = matNet + " Net";
      totalNet += matNet;

      const student = this.getModalStudent();
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

  // --- Form Kayıtları ---
  handleSaveTeacher() {
    const name = document.getElementById("tName").value.trim();
    const branch = document.getElementById("tBranch").value;
    const username = document.getElementById("tUsername").value.trim();
    const password = document.getElementById("tPassword").value.trim();

    if (!name || !username || !password) {
      alert("Lütfen Ad Soyad, Kullanıcı Adı ve Şifre alanlarını doldurunuz.");
      return;
    }
    if (!branch) {
      alert("Lütfen öğretmenin branşını seçiniz.");
      return;
    }

    const newTeacher = window.store.addTeacher({
      name: name,
      branch: branch,
      email: document.getElementById("tEmail").value,
      username: username,
      password: password
    });

    this.closeModal("modalTeacher");
    document.getElementById("formTeacher").reset();
    const tb = document.getElementById("tBranch");
    if (tb) tb.value = "";
    this.renderTeachersTable();
    this.showToast(`Yeni öğretmen (${newTeacher.name}) başarıyla tanımlandı!`, "success");
  }

  handleSaveStudent() {
    const name = document.getElementById("stdName").value.trim();
    const username = document.getElementById("stdUsername").value.trim();
    const password = document.getElementById("stdPassword").value.trim();

    if (!name || !username || !password) {
      alert("Lütfen Öğrenci Adı, Kullanıcı Adı ve Şifre alanlarını doldurunuz.");
      return;
    }

    const newStudent = window.store.addStudent({
      name: name,
      username: username,
      password: password,
      field: document.getElementById("stdField").value,
      grade: document.getElementById("stdGrade").value,
      section: document.getElementById("stdSection") ? document.getElementById("stdSection").value : "A",
      targetUniversity: document.getElementById("stdTargetUni").value,
      targetDepartment: document.getElementById("stdTargetDept").value,
      targetTytNet: document.getElementById("stdTargetTyt").value,
      targetAytNet: document.getElementById("stdTargetAyt").value,
      targetWeeklyQuestions: document.getElementById("stdTargetWeeklyQuestions").value
    });

    this.closeModal("modalStudent");
    document.getElementById("formStudent").reset();
    this.refreshAll();
    this.renderStudentsTable();
    this.showToast(`Öğrenci (${newStudent.name}) hesabı tanımlandı!`, "success");
  }

  handleSaveExam() {
    const student = this.getModalStudent();
    if (!student || (!this.editing && student.isAggregate)) {
      alert("Lütfen önce işlem yapmak istediğiniz öğrenciyi seçiniz (Tüm öğrenciler seçili iken yeni kayıt eklenemez).");
      return;
    }

    const name = document.getElementById("examName").value.trim();
    const date = document.getElementById("examDate").value;
    if (!name || !date) {
      alert("Lütfen sınav adı ve tarihini giriniz.");
      return;
    }

    const type = document.getElementById("examTypeSelect").value;
    const difficulty = Number(document.getElementById("examDifficulty").value) || 3;
    const notes = document.getElementById("examNotes").value;

    let examData = { type, name, date, difficulty, notes };

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

      examData.tyt = tytObj;
      examData.totalNet = Number((tytObj.turkce.net + tytObj.matematik.net + tytObj.sosyal.net + tytObj.fen.net).toFixed(2));
      examData.estimatedScore = AnalyticsEngine.estimateTytScore(tytObj);
    } else {
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

    const editing = this.editing && this.editing.kind === "exam" ? this.editing : null;
    if (editing) window.store.updateRecord(editing.sid, "exams", editing.id, examData);
    else window.store.addExam(student.id, examData);
    this.closeModal("modalExam");
    document.getElementById("formExam").reset();
    this.refreshAll();
    this.showToast(`${examData.name} deneme sonucu ${editing ? "güncellendi" : "kaydedildi"}!`, "success");
  }

  handleSaveQuestion() {
    const student = this.getModalStudent();
    if (!student || (!this.editing && student.isAggregate)) {
      alert("Lütfen önce işlem yapmak istediğiniz öğrenciyi seçiniz (Tüm öğrenciler seçili iken yeni kayıt eklenemez).");
      return;
    }

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

    const editing = this.editing && this.editing.kind === "question" ? this.editing : null;
    if (editing) window.store.updateRecord(editing.sid, "questionLogs", editing.id, logData);
    else window.store.addQuestionLog(student.id, logData);
    this.closeModal("modalQuestion");
    document.getElementById("formQuestion").reset();
    this.refreshAll();
    this.showToast(editing ? "Soru kaydı güncellendi!" : `${logData.subject} dersinden ${logData.count} soru kaydedildi!`, "success");
  }

  // Takvimden Toplu Devamsızlık Ekleme
  handleSaveBulkAttendance() {
    const student = this.getModalStudent();
    if (!student || (!this.editing && student.isAggregate)) {
      alert("Lütfen önce işlem yapmak istediğiniz öğrenciyi seçiniz (Tüm öğrenciler seçili iken yeni kayıt eklenemez).");
      return;
    }

    const startStr = document.getElementById("bulkStartDate").value;
    const endStr = document.getElementById("bulkEndDate").value;
    if (!startStr || !endStr) {
      alert("Lütfen başlangıç ve bitiş tarihlerini seçiniz.");
      return;
    }

    const type = document.getElementById("bulkType").value;
    const hours = Number(document.getElementById("bulkHours").value) || 8;
    const reason = document.getElementById("bulkReason").value;

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (this.editing && this.editing.kind === "attendance") {
      const ed = this.editing;
      window.store.updateRecord(ed.sid, "courseAttendance", ed.id, { date: startStr, type, hours, reason });
      this.closeModal("modalBulkCourseAttendance");
      this.refreshAll();
      this.showToast("Devamsızlık kaydı güncellendi!", "success");
      return;
    }
    if (start > end) {
      alert("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
      return;
    }

    const datesList = [];
    let cur = new Date(start);
    while (cur <= end) {
      // Hafta sonlarını (Cumartesi 6, Pazar 0) atla
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        datesList.push({
          date: cur.toISOString().split("T")[0],
          type: type,
          hours: hours,
          reason: reason
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    // Eğer sadece hafta sonu seçilmişse en azından o günleri ekle
    if (datesList.length === 0) {
      datesList.push({
        date: startStr,
        type: type,
        hours: hours,
        reason: reason
      });
    }

    window.store.addBulkCourseAttendance(student.id, datesList);
    this.closeModal("modalBulkCourseAttendance");
    document.getElementById("formBulkAttendance").reset();
    this.refreshAll();
    this.showToast(`${datesList.length} günlük ders devamsızlığı kaydedildi!`, "success");
  }

  handleSaveSession() {
    const student = this.getModalStudent();
    if (!student || (!this.editing && student.isAggregate)) {
      alert("Lütfen önce işlem yapmak istediğiniz öğrenciyi seçiniz (Tüm öğrenciler seçili iken yeni kayıt eklenemez).");
      return;
    }

    const date = document.getElementById("csDate").value;
    const title = document.getElementById("csTitle").value.trim() || "Haftalık Koçluk Görüşmesi";
    const status = document.getElementById("csStatus").value;
    const motivation = Number(document.getElementById("csMotivation").value) || 8;
    const summary = document.getElementById("csSummary").value;
    const rawAssignments = document.getElementById("csAssignments").value;
    const assignments = rawAssignments.split("\n").map(s => s.trim()).filter(s => s.length > 0);

    const sessionData = {
      date,
      title,
      status,
      studentMotivation: motivation,
      summary,
      assignments
    };

    const editing = this.editing && this.editing.kind === "session" ? this.editing : null;
    if (editing) window.store.updateRecord(editing.sid, "coachingSessions", editing.id, sessionData);
    else window.store.addCoachingSession(student.id, sessionData);
    this.closeModal("modalSession");
    document.getElementById("formSession").reset();
    this.refreshAll();
    this.showToast(editing ? "Koçluk seansı güncellendi!" : "Koçluk seansı kaydedildi!", "success");
  }

  // --- Silme İşlemleri ve Tailwind 2 Onay Modalı ---
  confirmDelete(titleOrOptions, messageText) {
    return new Promise((resolve) => {
      let title = "Silme Onayı";
      let message = "Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.";

      if (typeof titleOrOptions === "string") {
        if (messageText) {
          title = titleOrOptions;
          message = messageText;
        } else {
          message = titleOrOptions;
        }
      } else if (typeof titleOrOptions === "object" && titleOrOptions !== null) {
        if (titleOrOptions.title) title = titleOrOptions.title;
        if (titleOrOptions.message) message = titleOrOptions.message;
      }

      const modal = document.getElementById("modalConfirmDelete");
      const titleEl = document.getElementById("confirmDeleteTitle");
      const msgEl = document.getElementById("confirmDeleteMessage");
      const btnApprove = document.getElementById("btnApproveConfirmDelete");
      const btnCancel = document.getElementById("btnCancelConfirmDelete");

      if (!modal || !btnApprove || !btnCancel) {
        // Fallback: If modal DOM elements are missing, proceed safely
        resolve(true);
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;

      modal.classList.remove("hidden");

      let resolved = false;
      const cleanup = (result) => {
        if (resolved) return;
        resolved = true;
        modal.classList.add("hidden");
        btnApprove.removeEventListener("click", onApprove);
        btnCancel.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      };

      const onApprove = (e) => {
        if (e) e.preventDefault();
        cleanup(true);
      };
      const onCancel = (e) => {
        if (e) e.preventDefault();
        cleanup(false);
      };
      const onBackdrop = (e) => {
        if (e.target === modal) cleanup(false);
      };
      const onKeydown = (e) => {
        if (e.key === "Escape") cleanup(false);
      };

      btnApprove.addEventListener("click", onApprove);
      btnCancel.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
    });
  }

  async deleteExam(examId, sid) {
    const targetStudentId = sid || window.store.getActiveStudent().id;
    const student = (window.store.data.students || []).find(s => s.id === targetStudentId);
    const exam = student && student.exams ? student.exams.find(e => e.id === examId) : null;
    const examName = exam ? exam.name : "Bu sınav";

    const confirmed = await this.confirmDelete({
      title: "Deneme Sınavını Sil",
      message: `"${examName}" adlı deneme sınavı kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    });
    if (!confirmed) return;

    window.store.deleteExam(targetStudentId, examId);
    this.refreshAll();
    this.showToast("Sınav kaydı silindi.", "info");
  }

  async deleteQuestionLog(logId, sid) {
    const targetStudentId = sid || window.store.getActiveStudent().id;
    const confirmed = await this.confirmDelete({
      title: "Soru Kaydını Sil",
      message: "Bu soru takip kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
    });
    if (!confirmed) return;

    window.store.deleteQuestionLog(targetStudentId, logId);
    this.refreshAll();
    this.showToast("Soru kaydı silindi.", "info");
  }

  async deleteCourseAttendance(attId, sid) {
    const targetStudentId = sid || window.store.getActiveStudent().id;
    const confirmed = await this.confirmDelete({
      title: "Devamsızlık Kaydını Sil",
      message: "Bu ders devamsızlık kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
    });
    if (!confirmed) return;

    window.store.deleteCourseAttendance(targetStudentId, attId);
    this.refreshAll();
    this.showToast("Devamsızlık kaydı silindi.", "info");
  }

  async deleteCoachingSession(sessionId, sid) {
    const targetStudentId = sid || window.store.getActiveStudent().id;
    const confirmed = await this.confirmDelete({
      title: "Koçluk Seansını Sil",
      message: "Bu koçluk seansı kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
    });
    if (!confirmed) return;

    window.store.deleteCoachingSession(targetStudentId, sessionId);
    this.refreshAll();
    this.showToast("Koçluk seansı silindi.", "info");
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    let bg = "var(--primary)";
    let icon = "✓";
    if (type === "success") { bg = "var(--secondary)"; icon = "✓"; }
    else if (type === "danger") { bg = "var(--danger)"; icon = "⚠"; }
    else if (type === "info") { bg = "var(--info)"; icon = "ℹ"; }

    toast.style.background = bg;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  renderEmptyState() {
    const isFilterMissing = !window.store.filterGrade || !window.store.filterSection;

    // 1. Hero Card Sıfırlama
    const heroName = document.getElementById("heroName");
    const heroField = document.getElementById("heroField");
    const heroGrade = document.getElementById("heroGrade");
    const heroTarget = document.getElementById("heroTarget");
    const heroTargetNets = document.getElementById("heroTargetNets");
    const heroExamCount = document.getElementById("heroExamCount");
    const heroAvatar = document.getElementById("heroAvatar");
    const heroBadges = document.getElementById("heroBadges");

    if (heroName) heroName.textContent = isFilterMissing ? "Sınıf ve Şube Seçiniz" : "Kayıtlı Öğrenci Yok";
    if (heroField) heroField.textContent = "-";
    if (heroGrade) heroGrade.textContent = isFilterMissing ? "-" : "-";
    if (heroTarget) heroTarget.textContent = isFilterMissing 
      ? "Öğrenci verilerini ve başarı grafiklerini görüntülemek için lütfen yukarıdan veya sol panelden Sınıf ve Şube seçiniz."
      : "Seçilen sınıf ve şubede kayıtlı öğrenci bulunmuyor.";
    if (heroTargetNets) heroTargetNets.textContent = "Hedef: TYT 0 Net | AYT 0 Net";
    if (heroExamCount) heroExamCount.textContent = "0 TYT / 0 AYT";
    if (heroAvatar) {
      heroAvatar.style.background = "#94a3b8";
      heroAvatar.textContent = "👤";
    }
    if (heroBadges) heroBadges.innerHTML = "";

    // 2. Filtre Sayı Rozeti
    const countBadge = document.getElementById("filterStudentCountBadge");
    if (countBadge) {
      countBadge.textContent = "Sınıf ve Şube Seçiniz";
      countBadge.className = "badge badge-outline";
    }

    // 3. KPI Kartları (0'lama)
    const kpiLastTyt = document.getElementById("kpiLastTyt");
    const kpiTytTrend = document.getElementById("kpiTytTrend");
    const kpiLastAyt = document.getElementById("kpiLastAyt");
    const kpiAytTrend = document.getElementById("kpiAytTrend");
    const kpiWeeklyQuestions = document.getElementById("kpiWeeklyQuestions");
    const kpiWeeklyProgressFill = document.getElementById("kpiWeeklyProgressFill");
    const kpiWeeklyPct = document.getElementById("kpiWeeklyPct");
    const kpiAttendanceRate = document.getElementById("kpiAttendanceRate");
    const kpiAttendanceDetails = document.getElementById("kpiAttendanceDetails");
    const dashAnalysisBadge = document.getElementById("dashAnalysisBadge");
    const dashAnalysisMainTip = document.getElementById("dashAnalysisMainTip");

    if (kpiLastTyt) kpiLastTyt.textContent = "0 Net";
    if (kpiTytTrend) kpiTytTrend.innerHTML = `<span style="color:var(--text-muted);">-</span>`;
    if (kpiLastAyt) kpiLastAyt.textContent = "0 Net";
    if (kpiAytTrend) kpiAytTrend.innerHTML = `<span style="color:var(--text-muted);">-</span>`;
    if (kpiWeeklyQuestions) kpiWeeklyQuestions.textContent = "0 / 0";
    if (kpiWeeklyProgressFill) kpiWeeklyProgressFill.style.width = "0%";
    if (kpiWeeklyPct) kpiWeeklyPct.textContent = "%0 Tamamlandı (0 Toplam)";
    if (kpiAttendanceRate) kpiAttendanceRate.textContent = "0 Kayıt";
    if (kpiAttendanceDetails) kpiAttendanceDetails.textContent = "Toplam 0 Ders Saati";
    if (dashAnalysisBadge) dashAnalysisBadge.innerHTML = `<span class="badge badge-outline">Sınıf ve Şube Seçiniz</span>`;
    if (dashAnalysisMainTip) dashAnalysisMainTip.textContent = "Grafik ve analizlerin görüntülenmesi için lütfen yukarıdan Sınıf ve Şube seçiniz.";

    // 4. Tablolar
    const emptyTr = `<tr><td colspan="10" style="text-align:center; padding:24px; color:var(--text-muted);">${isFilterMissing ? "Öğrenci verilerini görüntülemek için lütfen önce Sınıf ve Şube seçiniz." : "Bu sınıfta kayıtlı öğrenci bulunmuyor."}</td></tr>`;
    const tbExams = document.getElementById("examsTableBody");
    if (tbExams) tbExams.innerHTML = emptyTr;
    const tbQuestions = document.getElementById("questionsTableBody");
    if (tbQuestions) tbQuestions.innerHTML = emptyTr;
    const tbAttendance = document.getElementById("courseAttendanceTableBody");
    if (tbAttendance) tbAttendance.innerHTML = emptyTr;
    const contSessions = document.getElementById("coachingSessionsContainer");
    if (contSessions) contSessions.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">${isFilterMissing ? "Lütfen önce Sınıf ve Şube seçiniz." : "Bu sınıfta kayıtlı öğrenci bulunmuyor."}</p>`;

    ["heroExamCount", "heroQuestionCount", "heroAttendanceCount", "heroSessionCount"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "0";
    });

    // 5. Grafikleri 0'lama / Temizleme
    const allChartIds = [
      "chartTytDashboard", "chartAytDashboard", "chartQuestionsDashboard",
      "chartRadarDashboard", "chartAytRadarDashboard", "chartAttendanceDashboard"
    ];
    allChartIds.forEach(id => {
      ChartManager.destroyChart(id);
      ChartManager.renderEmptyState(id, "Sınıf ve Şube seçilmediği için grafik verisi yok (0)");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

// Google Sites iframe sandbox uyumluluğu: alert çağrılarını zarif toast bildirimlerine dönüştür
window.alert = function(msg) {
  if (window.app && typeof window.app.showToast === "function") {
    window.app.showToast(msg, "danger");
  } else {
    console.warn("Sistem Uyarısı:", msg);
  }
};
