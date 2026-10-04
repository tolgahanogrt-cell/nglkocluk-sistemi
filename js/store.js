// Öğrenci Koçluk Sistemi - Veri Depolama ve Rol Yönetimi (Store)

const STORAGE_KEY = "ngfl_kocluk_db_v2";

class AppStore {
  constructor() {
    this.data = this.loadFromStorage();
    this.authRole = sessionStorage.getItem("kocluk_auth_role") || null; // 'admin' | 'teacher' | 'student'
    this.currentUser = JSON.parse(sessionStorage.getItem("kocluk_auth_user") || "null");
    if (this.authRole === "student" && this.currentUser) {
      this.activeStudentId = this.currentUser.id;
      const curStudent = (this.data.students || []).find(s => s.id === this.currentUser.id);
      this.filterGrade = curStudent && curStudent.grade ? curStudent.grade.replace(/[^\d]/g, "") : "";
      this.filterSection = curStudent ? curStudent.section : "";
    } else {
      // Sayfa ilk açıldığında Sınıf ve Şube seçilmemiş olarak gelsin (0 durumu)
      this.activeStudentId = null;
      this.filterGrade = "";
      this.filterSection = "";
    }
  }

  // --- Kimlik Doğrulama ve Giriş Metodları ---
  isAuthenticated() {
    return this.authRole !== null && this.currentUser !== null;
  }

  getRole() {
    return this.authRole;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // 1. Sistem Yöneticisi Girişi
  loginAdmin(username, password) {
    const admin = this.getAdminProfile();
    const norm = (s) => String(s || "").trim().toLocaleLowerCase("tr");
    if (norm(username) === norm(admin.username) && password === admin.password) {
      this.authRole = "admin";
      this.currentUser = { role: "admin", name: admin.name, username: admin.username, title: admin.title };
      this.activeStudentId = null;
      this.filterGrade = "";
      this.filterSection = "";
      sessionStorage.setItem("kocluk_auth_role", "admin");
      sessionStorage.setItem("kocluk_auth_user", JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
    return { success: false, message: "Yönetici kullanıcı adı veya şifresi hatalı!" };
  }

  getAdminProfile() {
    return this.data.admin || { username: "aşen", password: "123456", name: "Aynur ŞEN", title: "Müdür Yardımcısı" };
  }

  updateAdminProfile({ username, name, title, password }) {
    if (this.authRole !== "admin") return { success: false, message: "Yalnızca yönetici güncelleyebilir." };
    const admin = this.getAdminProfile();
    this.data.admin = {
      username: username.trim() || admin.username,
      name: name.trim() || admin.name,
      title: title.trim() || admin.title,
      password: password.trim() || admin.password
    };
    this.currentUser = { role: "admin", name: this.data.admin.name, username: this.data.admin.username, title: this.data.admin.title };
    sessionStorage.setItem("kocluk_auth_user", JSON.stringify(this.currentUser));
    this.saveToStorage();
    return { success: true, admin: this.data.admin };
  }

  // 2. Öğretmen / Koç Girişi
  loginTeacher(username, password) {
    const teachers = this.data.teachers || [];
    const teacher = teachers.find(t => t.username.toLowerCase() === username.toLowerCase() && t.password === password);
    if (teacher) {
      this.authRole = "teacher";
      this.currentUser = { role: "teacher", id: teacher.id, name: teacher.name, branch: teacher.branch, username: teacher.username };
      this.activeStudentId = null;
      this.filterGrade = "";
      this.filterSection = "";
      sessionStorage.setItem("kocluk_auth_role", "teacher");
      sessionStorage.setItem("kocluk_auth_user", JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
    return { success: false, message: "Öğretmen kullanıcı adı veya şifresi hatalı!" };
  }

  // 3. Öğrenci Girişi
  loginStudent(username, password) {
    const students = this.data.students || [];
    const student = students.find(s => s.username.toLowerCase() === username.toLowerCase() && s.password === password);
    if (student) {
      this.authRole = "student";
      this.currentUser = { role: "student", id: student.id, name: student.name, username: student.username };
      this.activeStudentId = student.id;
      this.filterGrade = student.grade ? student.grade.replace(/[^\d]/g, "") : "";
      this.filterSection = student.section || "A";
      sessionStorage.setItem("kocluk_auth_role", "student");
      sessionStorage.setItem("kocluk_auth_user", JSON.stringify(this.currentUser));
      this.saveToStorage();
      return { success: true, student };
    }
    return { success: false, message: "Öğrenci kullanıcı adı veya şifresi hatalı!" };
  }

  logout() {
    this.authRole = null;
    this.currentUser = null;
    this.activeStudentId = null;
    this.filterGrade = "";
    this.filterSection = "";
    sessionStorage.removeItem("kocluk_auth_role");
    sessionStorage.removeItem("kocluk_auth_user");
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (!parsed.admin || !parsed.admin.title)) {
          parsed.admin = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA.admin));
        }
        if (parsed && parsed.students) {
          parsed.students.forEach(s => {
            if (!s.section) {
              if (s.grade && s.grade.includes("-")) {
                s.section = s.grade.split("-")[1].trim();
              } else if (s.name && s.name.includes("Emir")) {
                s.section = "B";
              } else {
                s.section = "A";
              }
            }
            if (s.grade && s.grade.toLowerCase().includes("mezun")) {
              s.grade = "12. Sınıf";
            }
          });
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Veri okunamadı:", e);
    }
    const initial = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    initial.activeStudentId = initial.students[0] ? initial.students[0].id : null;
    this.saveToStorage(initial);
    return initial;
  }

  saveToStorage(data = this.data) {
    try {
      data.activeStudentId = this.activeStudentId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
    } catch (e) {
      console.error("Kayıt hatası:", e);
    }
  }

  // --- Yönetici İşlemleri (Öğretmen Yönetimi) ---
  getTeachers() {
    return this.data.teachers || [];
  }

  addTeacher(teacherData) {
    if (this.authRole !== "admin") return null;
    if (!this.data.teachers) this.data.teachers = [];

    const newTeacher = {
      id: "tch-" + Date.now(),
      name: teacherData.name,
      branch: teacherData.branch || "Rehberlik ve Koçluk",
      username: teacherData.username.toLowerCase().trim(),
      password: teacherData.password.trim(),
      email: teacherData.email || "",
      createdAt: new Date().toISOString().split("T")[0]
    };

    this.data.teachers.push(newTeacher);
    this.saveToStorage();
    return newTeacher;
  }

  deleteTeacher(id) {
    if (this.authRole !== "admin") return;
    this.data.teachers = (this.data.teachers || []).filter(t => t.id !== id);
    this.saveToStorage();
  }

  updateTeacher(teacherId, updatedFields) {
    if (this.authRole !== "admin") return { success: false, message: "Yalnızca yönetici güncelleyebilir." };
    const teacher = (this.data.teachers || []).find(t => t.id === teacherId);
    if (!teacher) return { success: false, message: "Öğretmen bulunamadı." };

    if (updatedFields.username || updatedFields.password) {
      const u = updatedFields.username ? updatedFields.username.toLowerCase().trim() : teacher.username;
      const p = updatedFields.password ? updatedFields.password.trim() : teacher.password;
      if (u !== teacher.username || p !== teacher.password) {
        if (!teacher.previousCredentials) teacher.previousCredentials = [];
        teacher.previousCredentials.unshift({
          username: teacher.username,
          password: teacher.password,
          changedAt: new Date().toLocaleString("tr-TR")
        });
      }
      teacher.username = u;
      teacher.password = p;
    }

    if (updatedFields.name) teacher.name = updatedFields.name.trim();
    if (updatedFields.branch) teacher.branch = updatedFields.branch.trim();
    if (updatedFields.email !== undefined) teacher.email = updatedFields.email.trim();

    this.saveToStorage();
    return { success: true, teacher };
  }

  updateTeacherCredentials(teacherId, newUsername, newPassword) {
    return this.updateTeacher(teacherId, { username: newUsername, password: newPassword });
  }

  // --- Öğrenci İşlemleri (Öğretmen ve Yönetici) ---
  getStudents() {
    const all = this.data.students || [];
    if (this.authRole === "student" && this.currentUser) {
      return all.filter(s => s.id === this.currentUser.id);
    }
    if (this.authRole === "teacher" && this.currentUser) {
      const teacherStudents = all.filter(s => s.teacherId === this.currentUser.id);
      return teacherStudents.length > 0 ? teacherStudents : all;
    }
    return all;
  }

  setFilter(grade, section) {
    this.filterGrade = grade || "";
    this.filterSection = section || "";
  }

  getFilteredStudents(gradeFilter = this.filterGrade, sectionFilter = this.filterSection) {
    if (!gradeFilter || !sectionFilter) {
      return [];
    }
    const all = this.getStudents();
    return all.filter(s => {
      const sGrade = (s.grade || "").toLowerCase();
      if (!sGrade.includes(gradeFilter.toLowerCase())) return false;
      const sSec = s.section || (s.grade && s.grade.includes("-") ? s.grade.split("-")[1].trim() : "");
      if (sSec && sSec.toUpperCase() !== sectionFilter.toUpperCase()) return false;
      return true;
    });
  }

  getAggregateStudent(gradeFilter = this.filterGrade, sectionFilter = this.filterSection) {
    const students = this.getFilteredStudents(gradeFilter, sectionFilter);
    const count = students.length;

    let gradeLabel = gradeFilter ? `${gradeFilter}. Sınıf` : "Tüm Sınıflar";
    let sectionLabel = sectionFilter ? `${sectionFilter} Şubesi` : "Tüm Şubeler";
    let title = `Tüm Öğrenciler (${gradeLabel} - ${sectionLabel})`;

    if (count === 0) {
      return {
        id: "ALL",
        isAggregate: true,
        studentCount: 0,
        name: title,
        field: "Genel",
        grade: gradeLabel,
        section: sectionLabel,
        targetUniversity: "Nafi Güral Fen Lisesi",
        targetDepartment: "Öğrenci Bulunamadı",
        targetTytNet: 0,
        targetAytNet: 0,
        targetWeeklyQuestions: 0,
        avatarColor: "#0f172a",
        exams: [],
        questionLogs: [],
        courseAttendance: [],
        coachingSessions: []
      };
    }

    const allExams = [];
    students.forEach(s => {
      (s.exams || []).forEach(e => {
        allExams.push({
          ...e,
          originalExamId: e.id,
          studentId: s.id,
          studentName: s.name,
          studentSection: s.section || ""
        });
      });
    });

    const allQuestionLogs = [];
    students.forEach(s => {
      (s.questionLogs || []).forEach(q => {
        allQuestionLogs.push({
          ...q,
          studentId: s.id,
          studentName: s.name
        });
      });
    });

    const allAttendance = [];
    students.forEach(s => {
      (s.courseAttendance || []).forEach(a => {
        allAttendance.push({
          ...a,
          studentId: s.id,
          studentName: s.name
        });
      });
    });

    const allSessions = [];
    students.forEach(s => {
      (s.coachingSessions || []).forEach(cs => {
        allSessions.push({
          ...cs,
          studentId: s.id,
          studentName: s.name
        });
      });
    });

    const avgTargetTyt = Math.round(students.reduce((sum, s) => sum + (Number(s.targetTytNet) || 0), 0) / count);
    const avgTargetAyt = Math.round(students.reduce((sum, s) => sum + (Number(s.targetAytNet) || 0), 0) / count);
    const avgTargetWeekly = Math.round(students.reduce((sum, s) => sum + (Number(s.targetWeeklyQuestions) || 1200), 0) / count);

    return {
      id: "ALL",
      isAggregate: true,
      studentCount: count,
      name: title,
      field: "Tüm Alanlar",
      grade: gradeLabel,
      section: sectionLabel,
      targetUniversity: "Nafi Güral Fen Lisesi",
      targetDepartment: `${count} Öğrenci Toplu Başarı Özeti`,
      targetTytNet: avgTargetTyt,
      targetAytNet: avgTargetAyt,
      targetWeeklyQuestions: avgTargetWeekly,
      avatarColor: "#0f172a",
      exams: allExams,
      questionLogs: allQuestionLogs,
      courseAttendance: allAttendance,
      coachingSessions: allSessions
    };
  }

  getActiveStudent() {
    const all = this.getStudents();
    if (all.length === 0) return null;

    if (this.authRole === "student" && this.currentUser) {
      return all.find(s => s.id === this.currentUser.id) || all[0];
    }

    if (!this.filterGrade || !this.filterSection) {
      return null;
    }

    if (this.activeStudentId && this.activeStudentId !== "ALL") {
      const found = all.find(s => s.id === this.activeStudentId);
      if (found) {
        const sGrade = (found.grade || "").toLowerCase();
        const sSec = found.section || "";
        if (sGrade.includes(this.filterGrade.toLowerCase()) && sSec.toUpperCase() === this.filterSection.toUpperCase()) {
          return found;
        }
      }
    }

    const filtered = this.getFilteredStudents(this.filterGrade, this.filterSection);
    if (filtered.length > 0) {
      this.activeStudentId = filtered[0].id;
      return filtered[0];
    }

    return null;
  }

  setActiveStudent(id) {
    if (this.authRole === "student") return null;
    if (id === "ALL") {
      this.activeStudentId = "ALL";
      this.saveToStorage();
      return this.getActiveStudent();
    }
    const students = this.getStudents();
    const student = students.find(s => s.id === id);
    if (student) {
      this.activeStudentId = id;
      this.saveToStorage();
      return student;
    }
    return null;
  }

  addStudent(studentData) {
    if (this.authRole === "student") return null; // Yetki kontrolü

    const colors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0284c7"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const teacherId = (this.authRole === "teacher" && this.currentUser) ? this.currentUser.id : "tch-1";

    const newStudent = {
      id: "std-" + Date.now(),
      teacherId: teacherId,
      name: studentData.name,
      username: (studentData.username || studentData.name.split(" ")[0].toLowerCase()).trim(),
      password: (studentData.password || "123").trim(),
      field: studentData.field || "Sayısal",
      grade: studentData.grade || "12. Sınıf",
      section: studentData.section || "A",
      targetUniversity: studentData.targetUniversity || "Hedef Üniversite",
      targetDepartment: studentData.targetDepartment || "Hedef Bölüm",
      targetTytNet: Number(studentData.targetTytNet) || 90,
      targetAytNet: Number(studentData.targetAytNet) || 60,
      targetWeeklyQuestions: Number(studentData.targetWeeklyQuestions) || 1200,
      avatarColor: randomColor,
      notes: studentData.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      exams: [],
      questionLogs: [],
      courseAttendance: [],
      coachingSessions: []
    };

    if (!this.data.students) this.data.students = [];
    this.data.students.push(newStudent);
    this.activeStudentId = newStudent.id;
    this.saveToStorage();
    return newStudent;
  }

  deleteStudent(id) {
    if (this.authRole === "student") return;
    this.data.students = this.data.students.filter(s => s.id !== id);
    const remaining = this.getStudents();
    this.activeStudentId = remaining[0] ? remaining[0].id : null;
    this.saveToStorage();
  }

  updateStudent(studentId, updatedFields) {
    if (this.authRole === "student") return { success: false, message: "Öğrenciler bilgileri güncelleyemez." };
    const student = (this.data.students || []).find(s => s.id === studentId);
    if (!student) return { success: false, message: "Öğrenci bulunamadı." };

    if (updatedFields.username || updatedFields.password) {
      const u = updatedFields.username ? updatedFields.username.toLowerCase().trim() : student.username;
      const p = updatedFields.password ? updatedFields.password.trim() : student.password;
      if (u !== student.username || p !== student.password) {
        if (!student.previousCredentials) student.previousCredentials = [];
        student.previousCredentials.unshift({
          username: student.username,
          password: student.password,
          changedAt: new Date().toLocaleString("tr-TR")
        });
      }
      student.username = u;
      student.password = p;
    }

    if (updatedFields.name) student.name = updatedFields.name.trim();
    if (updatedFields.field) student.field = updatedFields.field;
    if (updatedFields.grade) student.grade = updatedFields.grade;
    if (updatedFields.section) student.section = updatedFields.section.toUpperCase();
    if (updatedFields.targetUniversity !== undefined) student.targetUniversity = updatedFields.targetUniversity;
    if (updatedFields.targetDepartment !== undefined) student.targetDepartment = updatedFields.targetDepartment;
    if (updatedFields.targetTytNet !== undefined) student.targetTytNet = Number(updatedFields.targetTytNet) || 0;
    if (updatedFields.targetAytNet !== undefined) student.targetAytNet = Number(updatedFields.targetAytNet) || 0;
    if (updatedFields.targetWeeklyQuestions !== undefined) student.targetWeeklyQuestions = Number(updatedFields.targetWeeklyQuestions) || 1400;

    this.saveToStorage();
    return { success: true, student };
  }

  updateStudentCredentials(studentId, newUsername, newPassword, newGrade = null, newSection = null) {
    if (this.authRole === "student") return { success: false, message: "Öğrenciler kullanıcı adı/şifre değiştiremez." };
    const student = (this.data.students || []).find(s => s.id === studentId);
    if (!student) return { success: false, message: "Öğrenci bulunamadı." };

    const u = newUsername.toLowerCase().trim();
    const p = newPassword.trim();

    if (u !== student.username || p !== student.password) {
      if (!student.previousCredentials) student.previousCredentials = [];
      student.previousCredentials.unshift({
        username: student.username,
        password: student.password,
        changedAt: new Date().toLocaleString("tr-TR")
      });
    }

    student.username = u;
    student.password = p;
    if (newGrade) student.grade = newGrade;
    if (newSection) student.section = newSection.toUpperCase();

    this.saveToStorage();
    return { success: true, student };
  }

  // --- Deneme Sınavları (Öğretmen ve Yönetici) ---
  addExam(studentId, examData) {
    if (this.authRole === "student") return null;
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.exams) student.exams = [];
    const newExam = { id: "ex-" + Date.now(), ...examData };
    student.exams.push(newExam);
    student.exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.saveToStorage();
    return newExam;
  }

  deleteExam(studentId, examId) {
    if (this.authRole === "student") return;
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.exams = student.exams.filter(e => e.id !== examId);
    this.saveToStorage();
  }

  // --- Soru Girişi (Öğrenci KENDİSİ DE GİREBİLİR!) ---
  addQuestionLog(studentId, logData) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.questionLogs) student.questionLogs = [];
    const newLog = { id: "ql-" + Date.now(), ...logData };
    student.questionLogs.push(newLog);
    student.questionLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveToStorage();
    return newLog;
  }

  deleteQuestionLog(studentId, logId) {
    if (this.authRole === "student") {
      const current = this.getActiveStudent();
      if (!current || current.id !== studentId) return;
    }
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.questionLogs = student.questionLogs.filter(l => l.id !== logId);
    this.saveToStorage();
  }

  // --- Ders Devamsızlıkları (Toplu Takvim Seçimi) ---
  addBulkCourseAttendance(studentId, attendanceList) {
    if (this.authRole === "student") return null;
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.courseAttendance) student.courseAttendance = [];
    attendanceList.forEach(item => {
      student.courseAttendance.push({
        id: "ca-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        ...item
      });
    });
    student.courseAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveToStorage();
    return true;
  }

  deleteCourseAttendance(studentId, attId) {
    if (this.authRole === "student") return;
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.courseAttendance = (student.courseAttendance || []).filter(a => a.id !== attId);
    this.saveToStorage();
  }

  // --- Koçluk Görüşmeleri ve Seansları ---
  addCoachingSession(studentId, sessionData) {
    if (this.authRole === "student") return null;
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.coachingSessions) student.coachingSessions = [];
    const newSession = {
      id: "cs-" + Date.now(),
      ...sessionData
    };
    student.coachingSessions.unshift(newSession);
    this.saveToStorage();
    return newSession;
  }

  deleteCoachingSession(studentId, sessionId) {
    if (this.authRole === "student") return;
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.coachingSessions = (student.coachingSessions || []).filter(s => s.id !== sessionId);
    this.saveToStorage();
  }

  // Öğretmen/Yönetici ve Soru için Öğrenci: mevcut bir kaydı günceller
  updateRecord(studentId, collection, recordId, newData) {
    if (this.authRole === "student") {
      if (collection !== "questionLogs") return null;
      const current = this.getActiveStudent();
      if (!current || current.id !== studentId) return null;
    }
    const student = this.data.students.find(s => s.id === studentId);
    if (!student || !Array.isArray(student[collection])) return null;
    const idx = student[collection].findIndex(r => r.id === recordId);
    if (idx === -1) return null;
    student[collection][idx] = { ...newData, id: recordId };
    this.saveToStorage();
    return student[collection][idx];
  }
}

window.store = new AppStore();
