// Nafi Güral Fen Lisesi - Öğrenci Koçluk ve Başarı Takip Sistemi (Ana Kontrolcü)

class App {
  constructor() {
    this.currentTab = "dashboard";
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
      if (titleEl) titleEl.textContent = "Yönetici Hesabı";
      if (userNameEl) userNameEl.textContent = user.name || "Sistem Yöneticisi";
      if (avatarEl) {
        avatarEl.style.background = "var(--primary)";
        avatarEl.textContent = "SY";
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
    document.getElementById("filterStudentName")?.addEventListener("input", () => {
      this.renderStudentSelector();
      this.refreshAll();
    });

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

    // 11. PDF / Yazdır Butonu
    document.getElementById("btnPrintKarneAction")?.addEventListener("click", () => this.printKarne());
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
    if (tabId === "admin" && currentRole !== "admin") {
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
    } else if (tabId === "admin") {
      this.renderTeachersTable();
    } else if (tabId === "students") {
      this.renderStudentsTable();
    } else if (tabId === "analysis") {
      this.renderAnalysisDetails();
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

    const allStudents = window.store.getStudents();

    // Filtre Değerleri (Store veya Input)
    const gradeFilter = window.store.filterGrade || document.getElementById("sidebarGradeSelect")?.value || document.getElementById("filterGrade")?.value || "";
    const sectionFilter = window.store.filterSection || document.getElementById("sidebarSectionSelect")?.value || document.getElementById("filterSection")?.value || "";
    const nameSearch = (document.getElementById("filterStudentName")?.value || "").toLowerCase().trim();

    // Sınıf ve Şube dropdownlarını senkronize et
    const sideGrade = document.getElementById("sidebarGradeSelect");
    const dashGrade = document.getElementById("filterGrade");
    if (sideGrade && sideGrade.value !== gradeFilter) sideGrade.value = gradeFilter;
    if (dashGrade && dashGrade.value !== gradeFilter) dashGrade.value = gradeFilter;

    const sideSection = document.getElementById("sidebarSectionSelect");
    const dashSection = document.getElementById("filterSection");
    if (sideSection && sideSection.value !== sectionFilter) sideSection.value = sectionFilter;
    if (dashSection && dashSection.value !== sectionFilter) dashSection.value = sectionFilter;

    // Filtrelenmiş öğrenci listesi
    const filtered = window.store.getFilteredStudents(gradeFilter, sectionFilter, nameSearch);
    const activeId = window.store.activeStudentId || "ALL";

    let gradeLabel = gradeFilter ? (gradeFilter === "Mezun" ? "Mezun" : `${gradeFilter}. Sınıf`) : "Tüm Sınıflar";
    let sectionLabel = sectionFilter ? `${sectionFilter} Şubesi` : "Tüm Şubeler";
    const allOptionText = `👥 Tüm Öğrenciler (${gradeLabel} - ${sectionLabel} Toplu)`;

    // 1. Sidebar Seçiciyi Doldur
    const sidebarSelect = document.getElementById("studentSelect");
    if (sidebarSelect) {
      sidebarSelect.innerHTML = "";
      const optAll = document.createElement("option");
      optAll.value = "ALL";
      optAll.textContent = allOptionText;
      if (activeId === "ALL") optAll.selected = true;
      sidebarSelect.appendChild(optAll);

      filtered.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        const sSec = s.section ? ` - ${s.section} Şubesi` : "";
        opt.textContent = `${s.name} (${s.grade || ''}${sSec} • ${s.field})`;
        if (s.id === activeId) opt.selected = true;
        sidebarSelect.appendChild(opt);
      });
    }

    // 2. Dashboard Filtre Seçicisini Doldur
    const dashSelect = document.getElementById("dashStudentSelect");
    const countBadge = document.getElementById("filterStudentCountBadge");
    if (dashSelect) {
      dashSelect.innerHTML = "";
      const optAll = document.createElement("option");
      optAll.value = "ALL";
      optAll.textContent = allOptionText;
      if (activeId === "ALL") optAll.selected = true;
      dashSelect.appendChild(optAll);

      filtered.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        const sSec = s.section ? ` - ${s.section} Şubesi` : "";
        opt.textContent = `${s.name} (${s.grade || ''}${sSec} | ${s.field})`;
        if (s.id === activeId) opt.selected = true;
        dashSelect.appendChild(opt);
      });
    }

    if (countBadge) {
      if (activeId === "ALL") {
        countBadge.textContent = `${filtered.length} Öğrenci (Toplu Görünüm)`;
        countBadge.className = "badge badge-success";
      } else {
        countBadge.textContent = `1 / ${filtered.length} Öğrenci`;
        countBadge.className = "badge badge-primary";
      }
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
      const prevCreds = (t.previousCredentials && t.previousCredentials.length > 0)
        ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px; padding:3px 6px; background:var(--bg-main); border-radius:4px; border:1px dashed var(--border-color);">
            <strong style="color:var(--text-main);">Önceki:</strong> <code>${t.previousCredentials[0].username}</code> / <code>${t.previousCredentials[0].password}</code>
            <span style="font-size:10px; display:block; color:var(--text-muted);">${t.previousCredentials[0].changedAt || ''}</span>
           </div>`
        : '';
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${t.name}</strong></td>
        <td><span class="badge badge-primary">${t.branch}</span></td>
        <td>
          <code>${t.username}</code>
          ${prevCreds}
        </td>
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

  deleteTeacher(teacherId) {
    const teacher = (window.store.data.teachers || []).find(t => t.id === teacherId);
    const name = teacher ? teacher.name : "Öğretmen";
    if (confirm(`"${name}" adlı öğretmeni ve erişim yetkisini silmek istediğinize emin misiniz?`)) {
      window.store.deleteTeacher(teacherId);
      this.renderTeachersTable();
      this.showToast(`${name} başarıyla silindi.`, "info");
    }
  }

  openEditTeacherCredentials(teacherId) {
    const teacher = (window.store.data.teachers || []).find(t => t.id === teacherId);
    if (!teacher) return;

    document.getElementById("editTeacherId").value = teacher.id;
    document.getElementById("editTeacherName").value = teacher.name;
    const branchEl = document.getElementById("editTeacherBranch");
    if (branchEl) branchEl.value = teacher.branch;
    document.getElementById("editTeacherUsername").value = teacher.username;
    document.getElementById("editTeacherPassword").value = teacher.password;

    const histContainer = document.getElementById("teacherCredentialsHistory");
    if (histContainer) {
      if (!teacher.previousCredentials || teacher.previousCredentials.length === 0) {
        histContainer.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">Henüz geçmiş kullanıcı adı / şifre değişikliği kaydı bulunmamaktadır.</span>`;
      } else {
        histContainer.innerHTML = teacher.previousCredentials.map((h, i) => `
          <div style="padding: 6px 0; border-bottom: 1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>Kullanıcı Adı:</strong> <code>${h.username}</code> &nbsp;|&nbsp; 
              <strong>Şifre:</strong> <code>${h.password}</code>
            </div>
            <span style="font-size:11px; color:var(--text-muted);">${h.changedAt || ''}</span>
          </div>
        `).join("");
      }
    }

    this.openModal("modalEditTeacherCredentials");
  }

  handleSaveTeacherCredentials() {
    const id = document.getElementById("editTeacherId").value;
    const name = document.getElementById("editTeacherName").value.trim();
    const branch = document.getElementById("editTeacherBranch")?.value || "Rehberlik ve Psikolojik Danışmanlık";
    const newUsername = document.getElementById("editTeacherUsername").value.trim();
    const newPassword = document.getElementById("editTeacherPassword").value.trim();

    if (!name || !newUsername || !newPassword) {
      alert("Lütfen ad soyad, kullanıcı adı ve şifre alanlarını eksiksiz doldurunuz.");
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
      const prevCreds = (s.previousCredentials && s.previousCredentials.length > 0)
        ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px; padding:3px 6px; background:var(--bg-main); border-radius:4px; border:1px dashed var(--border-color);">
            <strong style="color:var(--text-main);">Önceki:</strong> <code>${s.previousCredentials[0].username}</code> / <code>${s.previousCredentials[0].password}</code>
            <span style="font-size:10px; display:block; color:var(--text-muted);">${s.previousCredentials[0].changedAt || ''}</span>
           </div>`
        : '';

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
        <td>
          <code>${s.username}</code>
          ${prevCreds}
        </td>
        <td><code style="background:#fef3c7; color:#92400e; font-weight:700; padding:2px 6px; border-radius:4px;">${s.password}</code></td>
        <td><span style="font-size:12px; color:var(--text-main);">${s.targetUniversity || '-'} - ${s.targetDepartment || '-'}</span></td>
        <td><span style="font-size:12px; font-weight:600; color:var(--primary);">TYT: ${s.targetTytNet || '-'} | AYT: ${s.targetAytNet || '-'}</span></td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" style="padding:3px 9px;" onclick="app.openEditStudent('${s.id}')">✏️ Düzenle</button>
            <button class="btn btn-secondary btn-sm" style="padding:3px 9px;" onclick="app.openEditStudentCredentials('${s.id}')">🔑 Şifre</button>
            <button class="btn btn-secondary btn-sm" style="padding:3px 9px;" onclick="app.selectStudentFromTable('${s.id}')">Profili Aç</button>
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

    const histContainer = document.getElementById("studentCredentialsHistory");
    if (histContainer) {
      if (!student.previousCredentials || student.previousCredentials.length === 0) {
        histContainer.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">Henüz geçmiş kullanıcı adı / şifre değişikliği kaydı bulunmamaktadır.</span>`;
      } else {
        histContainer.innerHTML = student.previousCredentials.map((h, i) => `
          <div style="padding: 6px 0; border-bottom: 1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>Kullanıcı Adı:</strong> <code>${h.username}</code> &nbsp;|&nbsp; 
              <strong>Şifre:</strong> <code>${h.password}</code>
            </div>
            <span style="font-size:11px; color:var(--text-muted);">${h.changedAt || ''}</span>
          </div>
        `).join("");
      }
    }

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

  deleteStudent(studentId) {
    const student = window.store.getStudents().find(s => s.id === studentId);
    const name = student ? student.name : "Öğrenci";
    if (confirm(`"${name}" adlı öğrenciyi ve tüm kayıtlarını silmek istediğinize emin misiniz?`)) {
      window.store.deleteStudent(studentId);
      this.refreshAll();
      this.renderStudentsTable();
      this.showToast(`${name} başarıyla silindi.`, "info");
    }
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
    if (!student) return;

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

    const isCoach = window.store.getRole() !== "student";
    // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
    const exams = (student.exams || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (exams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:20px;">Kayıtlı deneme sınavı bulunmuyor.</td></tr>`;
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

      const actionHtml = isCoach 
        ? `<td class="teacher-only"><button class="btn btn-danger btn-sm" onclick="app.deleteExam('${ex.id}')">Sil</button></td>`
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

  renderQuestionsTable(student) {
    const tbody = document.getElementById("questionsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const isCoach = window.store.getRole() !== "student";
    const stats = AnalyticsEngine.getStudentStats(student);
    document.getElementById("qTargetCount").textContent = `${student.targetWeeklyQuestions} Soru`;
    document.getElementById("qSolvedCount").textContent = `${stats.weeklyQuestions} soru çözüldü`;
    document.getElementById("qAccuracyRate").textContent = `%${stats.accuracyRate} Doğruluk Oranı`;
    document.getElementById("qTargetProgressFill").style.width = `${stats.weeklyProgressPct}%`;

    // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
    const logs = (student.questionLogs || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Henüz soru çözümü kaydı girilmedi.</td></tr>`;
      return;
    }

    logs.forEach(l => {
      const correct = Number(l.correct) || 0;
      const total = Number(l.count) || 0;
      const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
      const actionHtml = isCoach 
        ? `<td class="teacher-only"><button class="btn btn-danger btn-sm" onclick="app.deleteQuestionLog('${l.id}')">Sil</button></td>`
        : "";

      const studentBadge = student.isAggregate && l.studentName
        ? `<span class="badge badge-outline" style="font-size:10px; margin-left:4px;">${l.studentName}</span>`
        : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${AnalyticsEngine.formatDateTurkish(l.date)}</strong></td>
        <td><strong>${l.subject}</strong> ${studentBadge}</td>
        <td>${l.count}</td>
        <td style="color:var(--secondary); font-weight:600;">${l.correct || 0}</td>
        <td style="color:var(--danger); font-weight:600;">${l.wrong || 0}</td>
        <td><span class="badge ${rate >= 75 ? 'badge-success' : 'badge-warning'}">%${rate}</span></td>
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

    const isCoach = window.store.getRole() !== "student";
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

      const actionHtml = isCoach
        ? `<td class="teacher-only"><button class="btn btn-danger btn-sm" onclick="app.deleteCourseAttendance('${a.id}')">Sil</button></td>`
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

    const isCoach = window.store.getRole() !== "student";
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

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div>
            <strong style="font-size:14px;">${s.title}</strong> ${studentBadge}
            <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">(${AnalyticsEngine.formatDateTurkish(s.date)})</span>
          </div>
          <div>
            <span class="badge ${s.status === 'Katıldı' ? 'badge-success' : 'badge-danger'}">${s.status}</span>
            <span class="badge badge-outline" style="margin-left:6px;">Motivasyon: ${s.studentMotivation}/10</span>
            ${isCoach ? `<button class="btn btn-danger btn-sm teacher-only" style="margin-left:8px; padding:2px 8px;" onclick="app.deleteCoachingSession('${s.id}')">Sil</button>` : ''}
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
    if (!student) return;

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
    document.getElementById("karneTotalQuestions").textContent = `${stats.totalQuestions} Soru (%${stats.accuracyRate} Doğruluk)`;
    document.getElementById("karneAttendanceSummary").textContent = `${stats.totalAbsentDays} Gün (${stats.totalAbsentHours} Saat)`;

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

    const reviewBox = document.getElementById("karneCoachReviewText");
    if (reviewBox) {
      const latestSession = (student.coachingSessions || [])[0];
      const noteSummary = latestSession ? latestSession.summary : "Öğrenci genel olarak planlanan çalışma disiplinine uyum göstermektedir.";
      const tipsHtml = analysis.recommendations.map(r => `<li>${r}</li>`).join("");

      reviewBox.innerHTML = `
        <p style="margin-bottom:8px;"><strong>Koçluk Değerlendirmesi:</strong> ${noteSummary}</p>
        <p style="margin-bottom:6px;"><strong>Önerilen Aksiyon Planı ve Hedefler:</strong></p>
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
      alert("Önce bir öğrenci seçiniz.");
      return;
    }

    const karneElem = document.getElementById("karneDocument");
    if (!karneElem) return;

    // Yeni izole pencere açarak yazdır (iframe engellerini tamamen aşar)
    const printWindow = window.open("", "_blank", "width=950,height=800");
    if (!printWindow) {
      // Pop-up engellendiyse doğrudan window.print() çağır
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Öğrenci Karnesi - ${student.name}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif; background: white; color: #0f172a; padding: 30px; }
          .karne-document { width: 100%; max-width: 900px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 30px; }
          .karne-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 20px; }
          .karne-logo-area { display: flex; align-items: center; gap: 12px; }
          .karne-logo-box { width: 44px; height: 44px; border-radius: 8px; background: #1d4ed8; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 800; }
          .karne-title-area h2 { font-size: 18px; font-weight: 800; color: #1e3a8a; }
          .karne-title-area p { font-size: 12px; color: #64748b; }
          .karne-meta-box { text-align: right; font-size: 12px; color: #475569; }
          .karne-section { margin-bottom: 18px; }
          .karne-section-title { font-size: 13px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-bottom: 8px; border-left: 3px solid #1d4ed8; padding-left: 8px; }
          .karne-profile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; }
          .karne-profile-item span { display: block; font-size: 11px; color: #64748b; }
          .karne-profile-item strong { font-size: 13px; color: #0f172a; }
          .karne-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
          .karne-table th, .karne-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
          .karne-table th { background: #f1f5f9; font-weight: 700; }
          .karne-coach-notes-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; font-size: 12px; color: #1e3a8a; line-height: 1.6; }
          .karne-signature-area { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 18px; border-top: 1px dashed #cbd5e1; }
          .karne-sign-box { text-align: center; font-size: 12px; width: 180px; }
          .karne-sign-line { margin-top: 36px; border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .karne-document { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${karneElem.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // --- Modal Yönetimi ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");

    const today = new Date().toISOString().split("T")[0];
    if (modalId === "modalExam") {
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
  }

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

  // --- Form Kayıtları ---
  handleSaveTeacher() {
    const name = document.getElementById("tName").value.trim();
    const username = document.getElementById("tUsername").value.trim();
    const password = document.getElementById("tPassword").value.trim();

    if (!name || !username || !password) {
      alert("Lütfen Ad Soyad, Kullanıcı Adı ve Şifre alanlarını doldurunuz.");
      return;
    }

    const newTeacher = window.store.addTeacher({
      name: name,
      branch: document.getElementById("tBranch").value,
      email: document.getElementById("tEmail").value,
      username: username,
      password: password
    });

    this.closeModal("modalTeacher");
    document.getElementById("formTeacher").reset();
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
    const student = window.store.getActiveStudent();
    if (!student) return;

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

    window.store.addExam(student.id, examData);
    this.closeModal("modalExam");
    document.getElementById("formExam").reset();
    this.refreshAll();
    this.showToast(`${examData.name} deneme sonucu kaydedildi!`, "success");
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

  // Takvimden Toplu Devamsızlık Ekleme
  handleSaveBulkAttendance() {
    const student = window.store.getActiveStudent();
    if (!student) return;

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
    const student = window.store.getActiveStudent();
    if (!student) return;

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

    window.store.addCoachingSession(student.id, sessionData);
    this.closeModal("modalSession");
    document.getElementById("formSession").reset();
    this.refreshAll();
    this.showToast("Koçluk seansı kaydedildi!", "success");
  }

  // --- Silme İşlemleri ---
  deleteTeacher(id) {
    if (confirm("Bu öğretmeni silmek istediğinize emin misiniz?")) {
      window.store.deleteTeacher(id);
      this.renderTeachersTable();
      this.showToast("Öğretmen hesabı silindi.", "info");
    }
  }

  deleteExam(examId) {
    if (confirm("Bu sınav kaydını silmek istediğinize emin misiniz?")) {
      const student = window.store.getActiveStudent();
      window.store.deleteExam(student.id, examId);
      this.refreshAll();
      this.showToast("Sınav kaydı silindi.", "info");
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

  deleteCourseAttendance(attId) {
    if (confirm("Bu devamsızlık kaydını silmek istediğinize emin misiniz?")) {
      const student = window.store.getActiveStudent();
      window.store.deleteCourseAttendance(student.id, attId);
      this.refreshAll();
      this.showToast("Devamsızlık kaydı silindi.", "info");
    }
  }

  deleteCoachingSession(sessionId) {
    if (confirm("Bu koçluk seansını silmek istediğinize emin misiniz?")) {
      const student = window.store.getActiveStudent();
      window.store.deleteCoachingSession(student.id, sessionId);
      this.refreshAll();
      this.showToast("Koçluk seansı silindi.", "info");
    }
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
    document.getElementById("heroName").textContent = "Kayıtlı Öğrenci Yok";
    document.getElementById("heroTarget").textContent = "Lütfen '+ Öğrenci' butonundan öğrenci tanımlayınız.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
