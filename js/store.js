// Öğrenci Koçluk Sistemi - Veri Depolama ve İşlem Yöneticisi (Store)

const STORAGE_KEY = "kocluk_sistemi_db_v1";

class AppStore {
  constructor() {
    this.data = this.loadFromStorage();
    this.activeStudentId = this.data.activeStudentId || (this.data.students[0] ? this.data.students[0].id : null);
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("LocalStorage okunamadı, varsayılan demo verisi yükleniyor:", e);
    }
    // İlk çalıştırma: demo verileri yükle
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
      console.error("LocalStorage kaydetme hatası:", e);
    }
  }

  // --- Öğrenci İşlemleri ---
  getStudents() {
    return this.data.students || [];
  }

  getActiveStudent() {
    if (!this.data.students || this.data.students.length === 0) return null;
    let student = this.data.students.find(s => s.id === this.activeStudentId);
    if (!student) {
      student = this.data.students[0];
      this.activeStudentId = student.id;
      this.saveToStorage();
    }
    return student;
  }

  setActiveStudent(id) {
    const student = this.data.students.find(s => s.id === id);
    if (student) {
      this.activeStudentId = id;
      this.saveToStorage();
      return student;
    }
    return null;
  }

  addStudent(studentData) {
    const colors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0284c7", "#db2777"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newStudent = {
      id: "std-" + Date.now(),
      name: studentData.name,
      field: studentData.field || "Sayısal",
      grade: studentData.grade || "12. Sınıf",
      targetUniversity: studentData.targetUniversity || "Hedef Üniversite",
      targetDepartment: studentData.targetDepartment || "Hedef Bölüm",
      targetTytNet: Number(studentData.targetTytNet) || 90,
      targetAytNet: Number(studentData.targetAytNet) || 60,
      targetWeeklyQuestions: Number(studentData.targetWeeklyQuestions) || 1200,
      avatarColor: studentData.avatarColor || randomColor,
      notes: studentData.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      exams: [],
      questionLogs: [],
      attendance: [],
      coachingNotes: []
    };

    this.data.students.push(newStudent);
    this.activeStudentId = newStudent.id;
    this.saveToStorage();
    return newStudent;
  }

  updateStudent(id, updatedFields) {
    const idx = this.data.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.students[idx] = { ...this.data.students[idx], ...updatedFields };
      this.saveToStorage();
      return this.data.students[idx];
    }
    return null;
  }

  deleteStudent(id) {
    this.data.students = this.data.students.filter(s => s.id !== id);
    if (this.activeStudentId === id) {
      this.activeStudentId = this.data.students[0] ? this.data.students[0].id : null;
    }
    this.saveToStorage();
  }

  // --- Deneme Sınavı İşlemleri ---
  addExam(studentId, examData) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.exams) student.exams = [];
    const newExam = {
      id: "ex-" + Date.now(),
      ...examData
    };
    student.exams.push(newExam);
    // Tarihe göre sırala
    student.exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.saveToStorage();
    return newExam;
  }

  deleteExam(studentId, examId) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.exams = student.exams.filter(e => e.id !== examId);
    this.saveToStorage();
  }

  // --- Soru Takibi İşlemleri ---
  addQuestionLog(studentId, logData) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.questionLogs) student.questionLogs = [];
    const newLog = {
      id: "ql-" + Date.now(),
      ...logData
    };
    student.questionLogs.push(newLog);
    student.questionLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveToStorage();
    return newLog;
  }

  deleteQuestionLog(studentId, logId) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.questionLogs = student.questionLogs.filter(l => l.id !== logId);
    this.saveToStorage();
  }

  // --- Devamsızlık / Etüt İşlemleri ---
  addAttendance(studentId, attendanceData) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.attendance) student.attendance = [];
    const newAtt = {
      id: "at-" + Date.now(),
      ...attendanceData
    };
    student.attendance.push(newAtt);
    student.attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveToStorage();
    return newAtt;
  }

  deleteAttendance(studentId, attId) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return;
    student.attendance = student.attendance.filter(a => a.id !== attId);
    this.saveToStorage();
  }

  // --- Koçluk Notu / Ödev İşlemleri ---
  addCoachingNote(studentId, noteData) {
    const student = this.data.students.find(s => s.id === studentId);
    if (!student) return null;

    if (!student.coachingNotes) student.coachingNotes = [];
    const newNote = {
      id: "cn-" + Date.now(),
      date: noteData.date || new Date().toISOString().split("T")[0],
      coachMood: noteData.coachMood || "İyi",
      studentMotivation: Number(noteData.studentMotivation) || 8,
      summary: noteData.summary || "",
      assignments: noteData.assignments || []
    };
    student.coachingNotes.unshift(newNote);
    this.saveToStorage();
    return newNote;
  }

  // --- Taşınabilirlik: JSON Dışa / İçe Aktar ---
  exportToJson() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = url;
    link.download = `kocluk_sistemi_yedek_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importFromJson(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && Array.isArray(parsed.students)) {
          this.data = parsed;
          this.activeStudentId = parsed.students[0] ? parsed.students[0].id : null;
          this.saveToStorage();
          if (callback) callback(true, "Yedek başarıyla yüklendi!");
        } else {
          if (callback) callback(false, "Geçersiz dosya formatı. 'students' dizisi bulunamadı.");
        }
      } catch (err) {
        if (callback) callback(false, "JSON dosyası okunurken hata oluştu: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  resetToDemo() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    this.activeStudentId = this.data.students[0].id;
    this.saveToStorage();
  }

  clearAllData() {
    this.data = { students: [], activeStudentId: null };
    this.activeStudentId = null;
    this.saveToStorage();
  }
}

// Global Store Instance
window.store = new AppStore();
