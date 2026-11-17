/* ============================================================
   نبض الصف — الحالة العامة
   ============================================================ */

const State = {
  classes: [],
  currentClassId: sessionStorage.getItem(window.APP_CONFIG.CLASS_KEY) || null,
  students: [],
  selectedStudents: new Set(),
  semester: 's1',

  get currentClass() {
    return this.classes.find(c => c.id === this.currentClassId);
  },

  get currentClassName() {
    const c = this.currentClass;
    return c ? (c.name || c.grade) : '—';
  },

  async loadClasses() {
    try {
      this.classes = await Api.listClasses();
      
      // تحقق من صلاحية currentClassId
      if (this.currentClassId && !this.classes.find(c => c.id === this.currentClassId)) {
        this.currentClassId = null;
        sessionStorage.removeItem(window.APP_CONFIG.CLASS_KEY);
      }
      
      // اختر الأول تلقائياً إن لم يكن هناك اختيار
      if (!this.currentClassId && this.classes.length) {
        this.currentClassId = this.classes[0].id;
        sessionStorage.setItem(window.APP_CONFIG.CLASS_KEY, this.currentClassId);
      }
      
      return this.classes;
    } catch (e) {
      log('State.loadClasses error', e.message);
      this.classes = [];
      return [];
    }
  },

  async loadStudents() {
    if (!this.currentClassId) {
      this.students = [];
      return [];
    }
    try {
      this.students = await Api.listStudents(this.currentClassId);
      return this.students;
    } catch (e) {
      log('State.loadStudents error', e.message);
      this.students = [];
      return [];
    }
  },

  setCurrentClass(classId) {
    this.currentClassId = classId;
    if (classId) {
      sessionStorage.setItem(window.APP_CONFIG.CLASS_KEY, classId);
    } else {
      sessionStorage.removeItem(window.APP_CONFIG.CLASS_KEY);
    }
  }
};

window.State = State;