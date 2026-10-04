// Öğrenci Koçluk Sistemi - Veri Depolama ve Rol Yönetimi (Store)

const STORAGE_KEY = "ngfl_kocluk_db_v2";

class AppStore {
  constructor() {
    this.data = this.loadFromStorage();
    this.authRole = sessionStorage.getItem("kocluk_auth_role") || null; // 'admin' | 'teacher' | 'student'
    this.currentUser = JSON.parse(sessionStorage.getItem("kocluk_auth_user") || "null");
    this.activeStudentId = this.data.activeStudentId || (this.data.students[0] ? this.data.students[0].id : null);
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
    const admin = this.data.admin || { username: "admin", password: "123", name: "Sistem Yöneticisi" };
    if (username === admin.username && password === admin.password) {
      this.authRole = "admin";
      this.currentUser = { role: "admin", name: admin.name, username: admin.username };
      sessionStorage.setItem("kocluk_auth_role", "admin");
      sessionStorage.setItem("kocluk_auth_user", JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
    return { success: false, message: "Yönetici kullanıcı adı veya şifresi hatalı!" };
  }

  // 2. Öğretmen / Koç Girişi
  loginTeacher(username, password) {
    const teachers = this.data.teachers || [];
    const teacher = teachers.find(t => t.username.toLowerCase() === username.toLowerCase() && t.password === password);
    if (teacher) {
      this.authRole = "teacher";
      this.currentUser = { role: "teacher", id: teacher.id, name: teacher.name, branch: teacher.branch, username: teacher.username };
      sessionStorage.setItem("kocluk_auth_role", "teacher");
      sessionStorage.setItem("kocluk_auth_user", JSON.stringify(this.currentUser));
      
      // İlk öğrencisini seç
      const teacherStudents = this.getStudents();
      if (teacherStudents.length > 0) {
        this.activeStudentId = teacherStudents[0].id;
      }
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
    sessionStorage.removeItem("kocluk_auth_role");
    sessionStorage.removeItem("kocluk_auth_user");
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
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

  updateTeacherCredentials(teacherId, newUsername, newPassword) {
    if (this.authRole !== "admin") return { success: false, message: "Yalnızca yönetici güncelleyebilir." };
    const teacher = (this.data.teachers || []).find(t => t.id === teacherId);
    if (!teacher) return { success: false, message: "Öğretmen bulunamadı." };

    if (!teacher.previousCredentials) teacher.previousCredentials = [];
    teacher.previousCredentials.unshift({
      username: teacher.username,
      password: teacher.password,
      changedAt: new Date().toLocaleString("tr-TR")
    });

    teacher.username = newUsername.toLowerCase().trim();
    teacher.password = newPassword.trim();
    this.saveToStorage();
    return { success: true, teacher };
  }

  // --- Öğrenci İşlemleri (Öğretmen ve Yönetici) ---
  getStudents() {
    const all = this.data.students || [];
    if (this.authRole === "student" && this.currentUser) {
      return all.filter(s => s.id === this.currentUser.id);
    }
    if (this.authRole === "teacher" && this.currentUser) {
      // Öğretmene atanmış öğrencileri göster
      const teacherStudents = all.filter(s => s.teacherId === this.currentUser.id);
      return teacherStudents.length > 0 ? teacherStudents : all; // Eğer atanmamışsa tümünü görsün
    }
    return all;
  }

  getActiveStudent() {
    const students = this.getStudents();
    if (students.length === 0) return null;
    let student = students.find(s => s.id === this.activeStudentId);
    if (!student) {
      student = students[0];
      this.activeStudentId = student.id;
      this.saveToStorage();
    }
    return student;
  }

  setActiveStudent(id) {
    if (this.authRole === "student") return null; // Öğrenci başka öğrenci seçemez
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

  updateStudentCredentials(studentId, newUsername, newPassword) {
    if (this.authRole === "student") return { success: false, message: "Öğrenciler kullanıcı adı/şifre değiştiremez." };
    const student = (this.data.students || []).find(s => s.id === studentId);
    if (!student) return { success: false, message: "Öğrenci bulunamadı." };

    if (!student.previousCredentials) student.previousCredentials = [];
    student.previousCredentials.unshift({
      username: student.username,
      password: student.password,
      changedAt: new Date().toLocaleString("tr-TR")
    });

    student.username = newUsername.toLowerCase().trim();
    student.password = newPassword.trim();
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
    if (this.authRole === "student") return;
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
}

window.store = new AppStore();
