/* ============================================================
   نبض الصف — المصادقة
   ============================================================ */

const Auth = {
  user: null,
  token: null,

  async init() {
  this.token = sessionStorage.getItem(window.APP_CONFIG.SESSION_KEY) || '';
  
  if (this.token) {
    try {
      const res = await Api.validateToken(this.token);
      if (res.valid) {
        await this.loadUser();
        return true;
      }
    } catch (e) {}
    this.token = '';
    sessionStorage.removeItem(window.APP_CONFIG.SESSION_KEY);
  }
  
  return false;
  },

  async loadUser() {
    try {
      const u = await Api.me();
      if (this.token && (!u.role || u.role === 'guest')) {
        u.role = 'teacher';
        u.name = u.name || 'المعلم';
      }
      this.user = u;
      return u;
    } catch (e) {
      this.user = this.token
        ? { email: 'password-user', name: 'المعلم', role: 'teacher' }
        : { email: '', name: 'زائر', role: 'guest' };
      return this.user;
    }
  },

  async loginWithPassword(password) {
    if (!password) throw new Error('أدخل كلمة المرور');
    
    const res = await Api.verifyPassword(password);
    if (!res.success) throw new Error(res.message || 'كلمة المرور غير صحيحة');
    
    this.token = res.token;
    sessionStorage.setItem(window.APP_CONFIG.SESSION_KEY, this.token);
    await this.loadUser();
    
    log('Auth', 'دخول ناجح');
    return true;
  },

  async logout() {
    const token = this.token;
    this.token = null;
    this.user = null;
    sessionStorage.removeItem(window.APP_CONFIG.SESSION_KEY);
    sessionStorage.removeItem(window.APP_CONFIG.CLASS_KEY);
    
    if (token) {
      try { await Api.logout(token); } catch (e) {}
    }
  },

  isLoggedIn() {
    return !!this.token;
  },

  async changePassword(oldP, newP) {
    if (!oldP || !newP) throw new Error('أدخل كلمتي المرور');
    if (newP.length < 4) throw new Error('كلمة المرور الجديدة قصيرة');
    await Api.changePassword(oldP, newP, this.token);
    return true;
  }
};

/* ============================================================
   واجهة الدخول
   ============================================================ */
function setupLoginUI() {
  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit');
  const errorEl = document.getElementById('login-error');

  if (!form) return;

  function showError(msg) {
    if (errorEl) errorEl.textContent = msg || '';
  }

  async function tryLogin(e) {
    if (e) e.preventDefault();
    
    const password = passwordInput.value.trim();
    if (!password) return showError('أدخل كلمة المرور');

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'جارٍ التحقق...';
    showError('');

    try {
      await Auth.loginWithPassword(password);
      
      document.getElementById('view-login').classList.remove('active');
      document.getElementById('view-login').classList.add('hidden');
      
      await enterApp();
      
    } catch (err) {
      showError(err.message);
      passwordInput.select();
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'دخول';
    }
  }

  form.addEventListener('submit', tryLogin);
  
  setTimeout(() => passwordInput?.focus(), 100);
  
  // رابط الوضع التجريبي
  const demoLink = document.getElementById('login-demo-link');
  if (demoLink) {
    demoLink.onclick = (e) => {
      e.preventDefault();
      toast('الوضع التجريبي قيد التطوير', 'info');
    };
  }
}

/* ============================================================
   زر الخروج
   ============================================================ */
function setupLogoutButton() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  
  btn.addEventListener('click', async () => {
    const ok = await confirmAction('هل تريد تسجيل الخروج من المنصة؟', 'خروج');
    if (!ok) return;
    await Auth.logout();
    location.reload();
  });
}