/* ============================================================
   نبض الصف — المدير الرئيسي
   ============================================================ */

const App = {
  ready: false,
  currentRoute: null,
  sidebarOpen: false
};

/* ---------- خريطة الصفحات ---------- */
const ROUTES = {
  home:      { title: 'الرئيسية', icon: '🏠', render: () => showHome(), section: 'أساسي' },
  classes:   { title: 'الفصول',    icon: '📚', render: () => showClasses(), section: 'إدارة' },
  students:  { title: 'الطلاب',    icon: '👥', render: () => showStudents(), section: 'إدارة' },
  points:    { title: 'التحفيز',   icon: '🏆', render: () => showPoints(), section: 'إدارة' },
  tools:     { title: 'أدوات الحصة', icon: '🎯', render: () => showTools(), section: 'أدوات' },
  reports:   { title: 'التقارير',  icon: '📊', render: () => showReports(), section: 'متابعة' },
  ai:        { title: 'المساعد الذكي', icon: '🤖', render: () => showAI(), section: 'متابعة' },
  settings:  { title: 'الإعدادات', icon: '⚙️', render: () => showSettings(), section: 'نظام' }
};

/* ============================================================
   البدء
   ============================================================ */
async function bootApp() {
  if (App.ready) return;
  log('App', 'بدء التشغيل...');

  setupTheme();

  if (!API.init()) {
    toast('تعذّر تهيئة الاتصال — تحقق من config.js', 'error', 5000);
    return;
  }

  const hasSession = await Auth.init();
  
  if (hasSession) {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-login').classList.add('hidden');
    await enterApp();
  } else {
    showLoginScreen();
  }

  App.ready = true;
  log('App', 'جاهز');
}

function showLoginScreen() {
  document.getElementById('view-login').classList.add('active');
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('view-teacher').classList.add('hidden');
  setupLoginUI();
}

async function enterApp() {
  document.getElementById('view-teacher').classList.remove('hidden');
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-login').classList.remove('active');

  await Auth.loadUser();
  await State.loadClasses();

  // ✅ التحقق من وجود فصل محفوظ في الجلسة الحالية فقط
  const savedClass = sessionStorage.getItem('selected_class_id');
  
  if (!savedClass || !State.classes.find(c => c.id === savedClass)) {
    showClassPicker();
    return;
  }

  State.setCurrentClass(savedClass);
  await finishLogin();
}

// ✅ دالة إظهار شاشة اختيار الفصل
function showClassPicker() {
  const content = document.getElementById('content');
  const selectorWrap = document.getElementById('class-selector-wrap');
  if (selectorWrap) selectorWrap.style.display = 'none'; // إخفاء القائمة العلوية مؤقتاً
  
  // تحديث عنوان الصفحة
  document.getElementById('page-title').textContent = 'اختيار الفصل';
  document.getElementById('breadcrumb').textContent = '';

  if (!State.classes.length) {
    content.innerHTML = `
      <div class="empty" style="margin-top: 50px;">
        <div class="empty-title">👋 مرحباً بك!</div>
        <div class="empty-desc">ليس لديك أي فصول بعد. اذهب للإعدادات لإنشاء فصلك الأول.</div>
        <button class="btn btn-primary mt-3" onclick="navigateTo('classes')">إنشاء فصل</button>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="class-picker-wrap">
      <h2 class="class-picker-title">اختر الفصل للبدء 🎓</h2>
      <div class="class-picker-grid">
        ${State.classes.map(c => {
          const label = c.name || `${c.grade}${c.section ? ' - شعبة ' + c.section : ''}`;
          return `
            <button class="class-picker-card" data-class-id="${c.id}">
              <div class="class-picker-icon">📚</div>
              <div class="class-picker-name">${escapeHtml(label)}</div>
              <div class="class-picker-code">كود: ${c.joinCode || '—'}</div>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  content.querySelectorAll('.class-picker-card').forEach(card => {
    card.onclick = async () => {
      const classId = card.dataset.classId;
      State.setCurrentClass(classId);
      sessionStorage.setItem('selected_class_id', classId); // حفظ في الجلسة
      
      // إعادة إظهار القائمة العلوية
      if (selectorWrap) selectorWrap.style.display = '';
      updateClassSelector();
      
      await finishLogin();
    };
  });
}

// ✅ إكمال الدخول بعد اختيار الفصل
async function finishLogin() {
  await State.loadStudents();

  renderSidebar();
  renderUserChip();
  setupTopbar();
  setupClassSelector();

  // إجبار البدء من الرئيسية
  if (location.hash !== '#home') location.hash = 'home';
  navigateTo('home', false);

  // مراقبة تغيير الرابط
  window.removeEventListener('hashchange', handleHashChange);
  window.addEventListener('hashchange', handleHashChange);

  log('App', 'تم دخول التطبيق');
}

// ✅ دالة تسجيل الخروج (لمسح الفصل المختار)
function handleLogout() {
  sessionStorage.removeItem('selected_class_id'); // مسح الفصل من الجلسة
  Auth.logout().then(() => {
    location.hash = '';
    location.reload();
  });
}

// دالة مساعدة لمراقبة الرابط
function handleHashChange() {
  const newHash = location.hash.replace('#', '').split('?')[0] || 'home';
  navigateTo(newHash, false);
}

/* ============================================================
   Sidebar
   ============================================================ */
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const sections = {};
  Object.entries(ROUTES).forEach(([key, route]) => {
    const section = route.section || 'أخرى';
    if (!sections[section]) sections[section] = [];
    sections[section].push({ key, ...route });
  });

  let html = '';
  const order = ['أساسي', 'إدارة', 'أدوات', 'متابعة', 'نظام'];

  order.forEach(name => {
    if (!sections[name]) return;
    html += `<div class="nav-section-title">${name}</div>`;
    sections[name].forEach(r => {
      html += `
        <a class="nav-link" data-route="${r.key}" href="#${r.key}">
          <span class="nav-icon">${r.icon}</span>
          <span>${r.title}</span>
        </a>
      `;
    });
    delete sections[name];
  });

  nav.innerHTML = html;

  nav.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      navigateTo(link.dataset.route);
      closeSidebarOnMobile();
    };
  });
}

function updateActiveSidebarLink(routeKey) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.route === routeKey);
  });
}

/* ============================================================
   User Chip
   ============================================================ */
function renderUserChip() {
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');
  if (!nameEl || !avatarEl) return;
  
  const name = Auth.user?.name || 'المعلم';
  nameEl.textContent = name;
  avatarEl.textContent = name.charAt(0);
  
  const colors = window.APP_CONFIG?.AVATAR_COLORS || ['#4f46e5'];
  avatarEl.style.background = colors[name.charCodeAt(0) % colors.length];
}

/* ============================================================
   Topbar
   ============================================================ */
function setupTopbar() {
  const menuBtn = document.getElementById('menu-toggle');
  if (menuBtn) menuBtn.onclick = toggleSidebar;

  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) themeBtn.onclick = toggleTheme;

  const displayBtn = document.getElementById('btn-display-mode');
  if (displayBtn) displayBtn.onclick = () => {
    toast('وضع العرض قيد التطوير', 'info');
  };

  // ✅ ربط زر تبديل الفصل
  const classBtn = document.getElementById('btn-class-switch');
  if (classBtn) {
    classBtn.onclick = (e) => {
      e.preventDefault();
      openClassSwitcher();
    };
  }
}

/* ============================================================
   Class Selector
   ============================================================ */
function setupClassSelector() {
  const selector = document.getElementById('class-selector');
  if (!selector) return;

  updateClassSelector();

  selector.onchange = async (e) => {
    const newClassId = e.target.value;
    if (!newClassId) return;
    
    State.setCurrentClass(newClassId);
    sessionStorage.setItem('selected_class_id', newClassId); // تحديث الجلسة
    await State.loadStudents();
    // أعد رسم الصفحة الحالية
    if (App.currentRoute) navigateTo(App.currentRoute, false);
  };
}

function updateClassSelector() {
  const selector = document.getElementById('class-selector');
  if (!selector) return;

  selector.innerHTML = '<option value="">— اختر فصلاً —</option>' +
    State.classes.map(c => {
      const label = c.name || `${c.grade}${c.section ? ' - شعبة ' + c.section : ''}`;
      return `<option value="${c.id}">${escapeHtml(label)}</option>`;
    }).join('');

  if (State.currentClassId) selector.value = State.currentClassId;
}

/* ============================================================
   Navigation
   ============================================================ */
async function navigateTo(routeKey, updateHash = true) {
  const route = ROUTES[routeKey] || ROUTES.home;
  
  App.currentRoute = routeKey;

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = route.title;

  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.textContent = routeKey === 'home' ? '' : 'الرئيسية / ' + route.title;
  }

  updateActiveSidebarLink(routeKey);
  if (updateHash && location.hash !== '#' + routeKey) location.hash = routeKey;

  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = '';
    try {
      await route.render();
    } catch (e) {
      log('navigateTo error', e.message);
      content.innerHTML = `<div class="empty"><div class="empty-title">خطأ</div><div class="empty-desc">${escapeHtml(e.message)}</div></div>`;
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  App.sidebarOpen = !App.sidebarOpen;
  sidebar.classList.toggle('open', App.sidebarOpen);
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 900) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      App.sidebarOpen = false;
    }
  }
}

/* ============================================================
   Home Page
   ============================================================ */
function showHome() {
  const content = document.getElementById('content');
  
  const cls = State.currentClass;
  const className = cls ? (cls.name || cls.grade) : 'لم تختر فصلاً بعد';
  const studentCount = State.students.length;

  content.innerHTML = `
    <!-- الترويسة (Hero) -->
    <div class="home-hero">
      <div class="home-hero-content">
        <div class="home-hero-icon">👋</div>
        <div>
          <h1>مرحباً ${escapeHtml(Auth.user?.name || 'بك')}</h1>
          <p>الفصل الحالي: <strong>${escapeHtml(className)}</strong> • ${studentCount} طالب</p>
        </div>
      </div>
      <div class="home-hero-orb"></div>
    </div>

    <!-- إجراءات سريعة -->
    <div class="home-section">
      <h3 class="home-section-title">
        <span>🚀</span> إجراءات سريعة
      </h3>
      <div class="home-tiles">
        
        <button class="home-tile home-tile-blue" data-goto="students">
          <div class="home-tile-icon-wrap">
            <div class="home-tile-icon">👥</div>
          </div>
          <div class="home-tile-info">
            <span class="home-tile-title">الطلاب</span>
            <span class="home-tile-desc">إدارة القائمة</span>
          </div>
        </button>

        <button class="home-tile home-tile-gold" data-goto="points">
          <div class="home-tile-icon-wrap">
            <div class="home-tile-icon">🏆</div>
          </div>
          <div class="home-tile-info">
            <span class="home-tile-title">التحفيز</span>
            <span class="home-tile-desc">منح النقاط</span>
          </div>
        </button>

        <button class="home-tile home-tile-teal" data-goto="tools">
          <div class="home-tile-icon-wrap">
            <div class="home-tile-icon">🎯</div>
          </div>
          <div class="home-tile-info">
            <span class="home-tile-title">أدوات الحصة</span>
            <span class="home-tile-desc">العجلة والمؤقت</span>
          </div>
        </button>

      </div>
    </div>

    <!-- المتابعة -->
    <div class="home-section">
      <h3 class="home-section-title">
        <span>📊</span> المتابعة
      </h3>
      <div class="home-tiles">
        
        <button class="home-tile home-tile-purple" data-goto="reports">
          <div class="home-tile-icon-wrap">
            <div class="home-tile-icon">📊</div>
          </div>
          <div class="home-tile-info">
            <span class="home-tile-title">التقارير</span>
            <span class="home-tile-desc">لوحة الصدارة</span>
          </div>
        </button>

        <button class="home-tile home-tile-pink" data-goto="ai">
          <div class="home-tile-icon-wrap">
            <div class="home-tile-icon">🤖</div>
          </div>
          <div class="home-tile-info">
            <span class="home-tile-title">المساعد الذكي</span>
            <span class="home-tile-desc">اقتراحات تربوية</span>
          </div>
        </button>

      </div>
    </div>
  `;

  content.querySelectorAll('[data-goto]').forEach(tile => {
    tile.onclick = () => navigateTo(tile.dataset.goto);
  });
}

/* ============================================================
   Page Loaders
   ============================================================ */
function showClasses() {
  if (typeof ClassesUI !== 'undefined') return ClassesUI.render();
  showErrorCard('ملف classes.js غير محمّل');
}

function showStudents() {
  if (typeof StudentsUI !== 'undefined') return StudentsUI.render();
  showErrorCard('ملف students.js غير محمّل');
}

function showPoints() {
  if (typeof PointsUI !== 'undefined') return PointsUI.render();
  showErrorCard('ملف points.js غير محمّل');
}

function showTools() {
  if (typeof ToolsUI !== 'undefined') return ToolsUI.render();
  showErrorCard('ملف tools.js غير محمّل');
}

function showReports() {
  if (typeof ReportsUI !== 'undefined') return ReportsUI.render();
  showErrorCard('ملف reports.js غير محمّل');
}

function showAI() {
  if (typeof AIUI !== 'undefined') return AIUI.render();
  showErrorCard('ملف ai.js غير محمّل');
}

function showSettings() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h2 class="card-title">⚙️ الإعدادات</h2></div>
      
      <div class="form-group">
        <label>الفصل الحالي</label>
        <p class="text-muted">${escapeHtml(State.currentClassName || '—')}</p>
      </div>
      <div class="form-group">
        <label>عدد الطلاب</label>
        <p class="text-muted">${State.students.length}</p>
      </div>
      <div class="form-group">
        <label>المستخدم</label>
        <p class="text-muted">${escapeHtml(Auth.user?.name || '—')}</p>
      </div>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-light)">
      
      <!-- ✅ قسم تغيير كلمة المرور -->
      <h3 class="card-title" style="font-size: 16px; margin-bottom: 16px;">🔐 تغيير كلمة المرور</h3>
      <div class="form-group">
        <label>كلمة المرور الحالية</label>
        <input type="password" id="settings-old-pass" placeholder="أدخل كلمة المرور الحالية">
      </div>
      <div class="form-group">
        <label>كلمة المرور الجديدة</label>
        <input type="password" id="settings-new-pass" placeholder="أدخل كلمة المرور الجديدة">
      </div>
      <div class="form-group">
        <label>تأكيد كلمة المرور الجديدة</label>
        <input type="password" id="settings-confirm-pass" placeholder="أعد إدخال كلمة المرور الجديدة">
      </div>
      <button class="btn btn-primary" id="btn-change-password">تحديث كلمة المرور</button>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-light)">
      
      <button class="btn btn-danger" onclick="handleLogout()">
        🚪 تسجيل الخروج
      </button>
    </div>
  `;

  // ربط زر تغيير كلمة المرور
  document.getElementById('btn-change-password').onclick = async () => {
    const oldP = document.getElementById('settings-old-pass').value.trim();
    const newP = document.getElementById('settings-new-pass').value.trim();
    const confirmP = document.getElementById('settings-confirm-pass').value.trim();

    if (!oldP || !newP || !confirmP) {
      toast('أكمل جميع الحقول', 'warn');
      return;
    }
    if (newP !== confirmP) {
      toast('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'error');
      return;
    }
    if (newP.length < 4) {
      toast('كلمة المرور الجديدة قصيرة (4 أحرف على الأقل)', 'warn');
      return;
    }

    const btn = document.getElementById('btn-change-password');
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحديث...';

    try {
      await Auth.changePassword(oldP, newP);
      toast('✅ تم تغيير كلمة المرور بنجاح', 'success');
      
      // مسح الحقول
      document.getElementById('settings-old-pass').value = '';
      document.getElementById('settings-new-pass').value = '';
      document.getElementById('settings-confirm-pass').value = '';
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'تحديث كلمة المرور';
    }
  };
}

/* أداة مساعدة لعرض الأخطاء */
function showErrorCard(msg) {
  document.getElementById('content').innerHTML = `
    <div class="card">
      <div class="empty">
        <div class="empty-title">خطأ في التحميل</div>
        <div class="empty-desc">${escapeHtml(msg)}</div>
      </div>
    </div>`;
}

/* ============================================================
   بدء التطبيق
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  bootApp().catch(e => {
    console.error('Boot error:', e);
    toast('خطأ في بدء التطبيق: ' + e.message, 'error', 6000);
  });
});

/* ============================================================
   Class Switcher Menu
   ============================================================ */
function openClassSwitcher() {
  if (!State.classes || State.classes.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'class-switcher-overlay';
  
  overlay.innerHTML = `
    <div class="class-switcher-menu">
      <div class="class-switcher-header">
        <h3>اختر الفصل</h3>
        <button class="btn-icon-sm" id="close-class-switcher">✕</button>
      </div>
      <div class="class-switcher-list">
        ${State.classes.map(c => {
          const isActive = c.id === State.currentClassId;
          const label = c.name || `${c.grade}${c.section ? ' - شعبة ' + c.section : ''}`;
          return `
            <button class="class-switcher-item ${isActive ? 'active' : ''}" data-id="${c.id}">
              <span class="class-switcher-icon">📚</span>
              <span class="class-switcher-name">${escapeHtml(label)}</span>
              ${isActive ? '<span class="class-switcher-check">✓</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeMenu = () => overlay.remove();
  overlay.querySelector('#close-class-switcher').onclick = closeMenu;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeMenu();
  };

  overlay.querySelectorAll('.class-switcher-item').forEach(item => {
    item.onclick = async () => {
      const classId = item.dataset.id;
      if (classId === State.currentClassId) {
        closeMenu();
        return;
      }
      
      closeMenu();
      toast('⏳ جاري تبديل الفصل...', 'info', 1500);

      State.setCurrentClass(classId);
      sessionStorage.setItem('selected_class_id', classId);
      await State.loadStudents();

      if (App.currentRoute) {
        navigateTo(App.currentRoute, false);
      } else {
        navigateTo('home', false);
      }
    };
  });
}

window.App = App;
window.ROUTES = ROUTES;
window.navigateTo = navigateTo;
window.enterApp = enterApp;
window.showLoginScreen = showLoginScreen;
window.updateClassSelector = updateClassSelector;
window.handleLogout = handleLogout;
