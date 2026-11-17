/* ============================================================
   نبض الصف — دوال مساعدة
   ============================================================ */

/* ---------- إنشاء عنصر DOM ---------- */
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key.startsWith('on') && typeof value === 'function') {
        el[key.toLowerCase()] = value;
      } else if (key === 'class' || key === 'className') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key === 'html') {
        el.innerHTML = value;
      } else if (key === 'text') {
        el.textContent = value;
      } else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(el.dataset, value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  children.flat().forEach(c => {
    if (c === null || c === undefined || c === false) return;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  });
  return el;
}

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);
const $$$ = (sel) => document.querySelectorAll(sel);

/* ---------- Toast ---------- */
function toast(message, type = 'info', duration = 3000) {
  const container = $('toast-container');
  if (!container) return;
  
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  
  const el = h('div', { class: `toast toast-${type}` },
    h('span', {}, icons[type] || ''),
    h('span', {}, message)
  );
  
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ---------- تأخير ---------- */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ---------- خلط مصفوفة ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- اختيار عشوائي ---------- */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- حماية HTML ---------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- تنسيق الوقت ---------- */
function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function formatClock(date = new Date()) {
  return date.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' });
}

/* ---------- أول حرف ---------- */
function getInitial(name) {
  if (!name) return '؟';
  return String(name).trim().charAt(0);
}

/* ---------- معرف فريد ---------- */
function uid(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- لون من الاسم ---------- */
function colorFromName(name) {
  const colors = window.APP_CONFIG?.AVATAR_COLORS || ['#1e40af'];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getStudentColor(student) {
  if (!student) return colorFromName('');
  const colors = window.APP_CONFIG?.AVATAR_COLORS || [];
  if (student.avatar && colors.includes(student.avatar)) return student.avatar;
  return colorFromName(student.name);
}

/* ---------- Modal ---------- */
function openModal(title, buildFn, options = {}) {
  closeAllModals();
  
  const overlay = h('div', { class: 'modal-overlay' });
  const modal = h('div', { class: 'modal' });
  
  const header = h('div', { class: 'modal-header' },
    h('h2', { class: 'modal-title' }, title),
    h('button', { class: 'modal-close', type: 'button', onclick: closeAllModals }, '✕')
  );
  
  const body = h('div', { class: 'modal-body' });
  
  modal.appendChild(header);
  modal.appendChild(body);
  
  if (options.footer) modal.appendChild(options.footer);
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && options.closeOnBackdrop !== false) closeAllModals();
  });
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeAllModals();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  if (buildFn) buildFn(body, modal);
  
  return { overlay, modal, body };
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}

/* ---------- تأكيد ---------- */
function confirmAction(message, confirmText = 'تأكيد') {
  return new Promise(resolve => {
    const footer = h('div', { class: 'modal-footer' },
      h('button', {
        class: 'btn btn-ghost', type: 'button',
        onclick: () => { closeAllModals(); resolve(false); }
      }, 'إلغاء'),
      h('button', {
        class: 'btn btn-danger', type: 'button',
        onclick: () => { closeAllModals(); resolve(true); }
      }, confirmText)
    );
    
    openModal('تأكيد الإجراء', (body) => {
      body.appendChild(h('p', { style: 'font-size:15px;line-height:1.8' }, message));
    }, { footer });
  });
}

/* ---------- احتفال ---------- */
function celebrate(text = '🎉 أحسنت!', duration = 2500) {
  const container = $('celebration-container');
  if (!container) return;
  
  // نصوص احتفالية
  const msg = h('div', {
    style: {
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '72px', fontWeight: '900',
      color: 'var(--primary)',
      textShadow: '0 4px 20px rgba(30, 64, 175, 0.3)',
      pointerEvents: 'none',
      zIndex: 9999,
      animation: 'celebrationZoom 0.5s ease'
    }
  }, text);
  container.appendChild(msg);
  
  // كونفيتي
  const colors = ['#1e40af', '#3b82f6', '#d97706', '#059669', '#7c3aed'];
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = pick(colors);
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(confetti);
  }
  
  setTimeout(() => {
    msg.remove();
    container.querySelectorAll('.confetti').forEach(c => c.remove());
  }, duration);
}

/* ---------- إشعار المتصفح ---------- */
function sendNotification(title, body) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="78" font-size="78">📈</text></svg>',
      tag: 'nabd-alsaf'
    });
  } catch (e) {}
}

/* ---------- طلب صلاحية الإشعارات ---------- */
async function requestNotifPermission() {
  if (!('Notification' in window)) {
    toast('المتصفح لا يدعم الإشعارات', 'warn');
    return;
  }
  if (Notification.permission === 'granted') {
    toast('الإشعارات مُفعّلة ✓', 'success');
    return;
  }
  if (Notification.permission === 'denied') {
    toast('الإشعارات مرفوضة — فعّلها من المتصفح', 'error');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    toast('✅ تم تفعيل الإشعارات', 'success');
    sendNotification('الإشعارات مُفعّلة', 'ستصلك تنبيهات عند الحاجة');
  } else {
    toast('لم يتم تفعيل الإشعارات', 'warn');
  }
}

/* ---------- صوت ---------- */
function playBeep(freq = 880, duration = 0.5) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

/* ---------- تسجيل ---------- */
function log(label, data) {
  if (data !== undefined) {
    console.log(`%c[${label}]`, 'color:#1e40af;font-weight:bold', data);
  } else {
    console.log(`%c[${label}]`, 'color:#1e40af;font-weight:bold');
  }
}

/* ---------- الوضع الليلي ---------- */
function setupTheme() {
  const saved = localStorage.getItem(window.APP_CONFIG.THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButton(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(window.APP_CONFIG.THEME_KEY, next);
  updateThemeButton(next);
}

function updateThemeButton(theme) {
  const btn = $('btn-theme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ---------- تحميل ملف ---------- */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- تنزيل JSON ---------- */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/* ---------- قراءة ملف Excel/CSV ---------- */
function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const students = [];
        
        // ⭐ اكتشاف تلقائي: هل السطر الأول رأس أم اسم طالب؟
        const headerKeywords = [
          'اسم', 'الاسم', 'name', 'الطالب', 'طالب', 'student',
          'م', 'رقم', '#', 'no', 'مقعد', 'seat', 'id'
        ];
        
        let startRow = 0;
        if (rows.length > 0 && rows[0] && rows[0][0]) {
          const firstCell = String(rows[0][0]).trim().toLowerCase();
          const isHeader = headerKeywords.some(kw => firstCell === kw.toLowerCase());
          startRow = isHeader ? 1 : 0;
        }
        
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          
          const firstCol = String(row[0]).trim();
          if (!firstCol) continue;
          
          // تجاهل الأرقام التسلسلية (إذا كان العمود الأول رقم)
          const isPureNumber = /^\d+$/.test(firstCol);
          if (isPureNumber && row[1]) {
            // ربما العمود الأول رقم تسلسلي، والاسم في العمود الثاني
            const name = String(row[1]).trim();
            const seat = row[2] ? String(row[2]).trim() : '';
            if (name) students.push({ name, seat });
          } else {
            const name = firstCol;
            const seat = row[1] ? String(row[1]).trim() : '';
            if (name) students.push({ name, seat });
          }
        }
        
        resolve(students);
      } catch (err) {
        reject(new Error('فشل قراءة الملف: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
}

/* ---------- إضافة animation للـ CSS ---------- */
if (!document.getElementById('celebration-zoom-style')) {
  const style = document.createElement('style');
  style.id = 'celebration-zoom-style';
  style.textContent = `
    @keyframes celebrationZoom {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
/* ---------- اختيار إيموجي ثابت للطالب بناءً على الاسم ---------- */
/* ---------- اختيار الأفاتار يدوياً (اختياري) ---------- */
function getAvatarEmoji(student) {
  if (!student || !student.name) return '🎓';
  
  // إذا كان الطالب لديه أفاتار مختار يدوياً (محفوظ في الحقل avatar)
  if (student.avatar && student.avatar.match(/\p{Emoji}/u)) {
    return student.avatar;
  }
  
  // وإلا اختر تلقائياً بناءً على الاسم
  const emojis = window.APP_CONFIG.AVATAR_EMOJIS || ['🎓'];
  let hash = 0;
  for (let i = 0; i < student.name.length; i++) {
    hash = student.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return emojis[Math.abs(hash) % emojis.length];
}

/* ---------- بناء HTML للأفاتار الجديد ---------- */
function avatarHTMLV2(student, size = 64) {
  const emoji = getAvatarEmoji(student);
  const color = getStudentColor(student);
  
  return `
    <div class="student-avatar-v3" style="
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: ${size}px;
      height: ${size}px;
      font-size: ${Math.round(size * 0.55)}px;
    ">
      ${emoji}
    </div>
  `;
}
/* ---------- تصدير للاستخدام ---------- */
window.h = h;
window.$ = $;
window.$$ = $$;
window.$$$ = $$$;
window.toast = toast;
window.celebrate = celebrate;
window.confirmAction = confirmAction;