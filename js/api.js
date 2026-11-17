/* ============================================================
   نبض الصف — الاتصال بـ Apps Script
   ============================================================ */

const API = {
  url: null,
  ready: false,

  init() {
    this.url = window.APP_CONFIG?.API_URL;
    if (!this.url || this.url.includes('ضع_هنا')) {
      console.warn('⚠️ لم يتم ضبط API_URL في config.js');
      return false;
    }
    this.ready = true;
    log('API', 'جاهز: ' + this.url.slice(0, 60) + '...');
    return true;
  },

  call(action, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        return reject(new Error('الخادم غير مهيأ. تحقق من config.js'));
      }

      const token = sessionStorage.getItem(window.APP_CONFIG.SESSION_KEY);
      const payload = { action, ...params };
      if (token && !payload.token) payload.token = token;

      const callbackName = 'nabd_cb_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
      
      window[callbackName] = (data) => {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        
        if (data && data.ok) resolve(data.data);
        else reject(new Error(data?.error || 'خطأ غير معروف'));
      };

      const query = new URLSearchParams({ ...payload, callback: callbackName }).toString();
      const script = document.createElement('script');
      script.src = this.url + '?' + query;

      script.onerror = () => {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('فشل الاتصال بالخادم. تحقق من الإنترنت.'));
      };

      document.body.appendChild(script);
    });
  }
};

/* ============================================================
   واجهة مبسّطة للاستدعاءات
   ============================================================ */

const Api = {
  // Auth
  me:             () => API.call('me'),
  verifyPassword: (password) => API.call('password.verify', { password }),
  validateToken:  (token) => API.call('password.validate', { token }),
  changePassword: (oldP, newP, token) => API.call('password.change', { old: oldP, newP, token }),
  logout:         (token) => API.call('password.logout', { token }),

  // Classes
  listClasses:    () => API.call('classes.list'),
  createClass:    (data) => API.call('classes.create', data),
  deleteClass:    (id) => API.call('classes.delete', { id }),
  updateClass:    (data) => API.call('classes.update', data),
  promoteClass:   (data) => API.call('classes.promote', data),

  // Students (Roster)
  listStudents:   (classId) => API.call('students.list', { classId }),
  addStudent:     (data) => API.call('students.add', data),
  bulkStudents:   (classId, students) => API.call('students.bulk', { classId, students: JSON.stringify(students) }),
  updateStudent:  (data) => API.call('students.update', data),
  deleteStudent:  (id) => API.call('students.delete', { id }),
  resetPoints:    (classId, semester) => API.call('students.resetPoints', { classId, semester }),
  resetStudentPoints: (studentId, semester) => API.call('students.resetStudentPoints', { studentId, semester }),

  // Points
  addPoints:      (data) => API.call('points.add', data),
  
  // ✅ إصلاح: إضافة معامل semester لـ addPointsBulk
  addPointsBulk: (ids, delta, reason, semester) => API.call('points.bulk', { 
  ids: ids.join(','),        // ← نص مفصول بفواصل
  delta, 
  reason,
  semester: semester || 's1'
}),
  
  pointsHistory:  (studentId) => API.call('points.history', { studentId }),

  // Sessions
  createSession:  (data) => API.call('sessions.create', data),
  listSessions:   () => API.call('sessions.list'),
  endSession:     (id) => API.call('sessions.end', { id }),

  // Analytics
  leaderboard:    (classId) => API.call('analytics.leaderboard', { classId }),
  compare:        (classId) => API.call('analytics.compare', { classId }),

  // AI
  aiGenerate:     (data) => API.call('ai.generate', data)
};

window.API = API;
window.Api = Api;