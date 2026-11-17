/* ============================================================
   نبض الصف — أدوات الحصة (Phase 3.5 — نسخة نهائية)
   ============================================================ */

const ToolsUI = {
  currentTool: null,
  wheelRotation: 0,
  wheelSpinning: false,
  wheelStudents: [],
  selectedWheelStudents: [],
  timerInterval: null,
  timerRemaining: 0,
  timerTotal: 0,

  // ✅ خصائص جديدة لدعم الأدوار داخل المجموعات
  currentGroups: [],
  currentGroupCount: 2,

  async render() {
    const content = document.getElementById('content');
    
    if (!State.currentClassId) {
      content.innerHTML = `
        <div class="card">
          <div class="empty">
            <div class="empty-title">👆 اختر فصلاً أولاً</div>
            <div class="empty-desc">اذهب إلى "📚 الفصول" واختر فصلاً</div>
          </div>
        </div>
      `;
      return;
    }

    await State.loadStudents();

    content.innerHTML = `
      <div class="tools-header">
        <h2>🎯 أدوات الحصة</h2>
        <p>أدوات سريعة لتحفيز التفاعل داخل القاعة</p>
      </div>

      <div class="tools-grid">
        <button class="tool-card" data-tool="wheel" type="button">
          <div class="tool-card-icon">🎡</div>
          <div class="tool-card-title">العجلة</div>
          <div class="tool-card-desc">اختيار طالب عشوائياً</div>
        </button>

        <button class="tool-card" data-tool="timer" type="button">
          <div class="tool-card-icon">⏱️</div>
          <div class="tool-card-title">المؤقت</div>
          <div class="tool-card-desc">تنازلي / تصاعدي</div>
        </button>

        <button class="tool-card" data-tool="groups" type="button">
          <div class="tool-card-icon">👥</div>
          <div class="tool-card-title">المجموعات والأدوار</div>
          <div class="tool-card-desc">تقسيم وتوزيع الأدوار</div>
        </button>

        <button class="tool-card" data-tool="signals" type="button">
          <div class="tool-card-icon">🔔</div>
          <div class="tool-card-title">إشارات الانتباه</div>
          <div class="tool-card-desc">عرض على الشاشة</div>
        </button>
      </div>
    `;

    content.querySelectorAll('[data-tool]').forEach(btn => {
      btn.onclick = () => this.openTool(btn.dataset.tool);
    });
  },

  openTool(toolId) {
    this.playBeep(600, 0.08);

    const tools = {
      wheel: () => this.openWheel(),
      timer: () => this.openTimer(),
      groups: () => this.openGroups(),
      signals: () => this.openSignals()
    };
    if (tools[toolId]) tools[toolId]();
  },

  /* ============================================================
     🔔 نغمات صوتية
     ============================================================ */
  playBeep(freq = 880, duration = 0.2, volume = 0.25) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._audioCtx) this._audioCtx = new AudioCtx();
      const ctx = this._audioCtx;

      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn('تعذر تشغيل الصوت:', err);
    }
  },

  playSpinTick() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._audioCtx) this._audioCtx = new AudioCtx();
      const ctx = this._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (err) { /* صامت */ }
  },

  /* ============================================================
     🎡 العجلة العشوائية
     ============================================================ */
  openWheel() {
    if (!State.students || !State.students.length) {
      this.toast('لا يوجد طلاب في الفصل', 'warn');
      return;
    }

    this.wheelStudents = [...State.students];
    this.selectedWheelStudents = [];
    this.wheelRotation = 0;
    this.wheelSpinning = false;

    openModal('🎡 عجلة اختيار الطالب', (body, modal) => {
      modal.style.maxWidth = '800px';
      body.innerHTML = `
        <div class="wheel-container">
          <div class="wheel-wrap">
            <div class="wheel-pointer"></div>
            <canvas id="wheel-canvas" width="600" height="600"></canvas>
            <div class="wheel-center" id="wheel-center">ابدأ</div>
          </div>
          
          <div class="wheel-controls">
            <button class="btn btn-primary btn-lg" id="btn-spin" type="button">🎯 لف العجلة</button>
            <button class="btn btn-ghost" id="btn-quick-pick" type="button">🎲 اختيار سريع</button>
            <button class="btn btn-ghost" id="btn-wheel-reset" type="button">🔄 إعادة تعيين</button>
          </div>

          <div id="wheel-result" class="wheel-result">
            <div class="empty-desc">لم يتم الاختيار بعد</div>
          </div>

          <div class="wheel-history">
            <div class="wheel-history-title">📜 سجل الاختيارات</div>
            <div id="wheel-history-list"></div>
          </div>
        </div>
      `;

      this.drawWheel();

      document.getElementById('btn-spin').onclick = () => this.spinWheel();
      document.getElementById('btn-quick-pick').onclick = () => this.quickPick();
      document.getElementById('btn-wheel-reset').onclick = () => {
        this.selectedWheelStudents = [];
        this.wheelRotation = 0;
        this.drawWheel();
        this.renderWheelHistory();
        document.getElementById('wheel-result').innerHTML = '<div class="empty-desc">لم يتم الاختيار بعد</div>';
      };
      document.getElementById('wheel-center').onclick = () => this.spinWheel();
    });
  },

  drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const c = size / 2;
    const r = c - 30;

    ctx.clearRect(0, 0, size, size);

    const students = this.wheelStudents;
    if (!students.length) {
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(c, c, r, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    const colors = (window.APP_CONFIG && window.APP_CONFIG.AVATAR_COLORS) || [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
      '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#d946ef'
    ];
    const step = (2 * Math.PI) / students.length;

    students.forEach((s, i) => {
      const start = i * step - Math.PI / 2;
      const end = start + step;

      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(start + step / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Tajawal, sans-serif';
      const label = s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name;
      ctx.fillText(label, r - 20, 6);
      ctx.restore();
    });

    canvas.style.transform = `rotate(${this.wheelRotation}deg)`;
  },

  spinWheel() {
    if (this.wheelSpinning) return;

    const remaining = this.wheelStudents.filter(s => !this.selectedWheelStudents.includes(s.id));
    if (!remaining.length) {
      this.toast('تم اختيار جميع الطلاب! اضغط "إعادة تعيين"', 'info');
      return;
    }

    this.wheelSpinning = true;
    const canvas = document.getElementById('wheel-canvas');
    const duration = 4500;
    const startRot = this.wheelRotation;
    const targetRot = startRot + 360 * (5 + Math.floor(Math.random() * 3)) + Math.random() * 360;
    const t0 = performance.now();

    let lastTick = 0;
    let tickInterval = 60;

    const tickLoop = (t) => {
      if (!this.wheelSpinning) return;
      const elapsed = t - t0;
      const p = elapsed / duration;

      tickInterval = 60 + p * 300;

      if (t - lastTick > tickInterval) {
        this.playSpinTick();
        lastTick = t;
      }

      if (p < 1) requestAnimationFrame(tickLoop);
    };

    const animate = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      this.wheelRotation = startRot + (targetRot - startRot) * eased;
      if (canvas) canvas.style.transform = `rotate(${this.wheelRotation}deg)`;

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        this.wheelSpinning = false;
        this.detectWheelWinner();
      }
    };

    requestAnimationFrame(tickLoop);
    requestAnimationFrame(animate);
  },

  detectWheelWinner() {
    const students = this.wheelStudents;
    if (!students.length) return;

    const anglePerSeg = 360 / students.length;
    const normalized = ((-this.wheelRotation % 360) + 360) % 360;
    const idx = Math.floor(normalized / anglePerSeg) % students.length;
    const winner = students[idx];

    if (!winner) return;

    if (!this.selectedWheelStudents.includes(winner.id)) {
      this.selectedWheelStudents.push(winner.id);
    }

    this.showWinner(winner);
    this.renderWheelHistory();
    this.playBeep(1200, 0.3);

    if (typeof celebrate === 'function') {
      celebrate('🎉 ' + winner.name, 2000);
    }
  },

  quickPick() {
    const remaining = this.wheelStudents.filter(s => !this.selectedWheelStudents.includes(s.id));
    if (!remaining.length) {
      this.toast('تم اختيار جميع الطلاب!', 'info');
      return;
    }

    const winner = remaining[Math.floor(Math.random() * remaining.length)];
    this.selectedWheelStudents.push(winner.id);
    this.showWinner(winner);
    this.renderWheelHistory();
    this.playBeep(1200, 0.3);

    if (typeof celebrate === 'function') {
      celebrate('🎲 ' + winner.name, 1800);
    }
  },

  showWinner(winner) {
    const result = document.getElementById('wheel-result');
    if (!result) return;

    const emoji = typeof getAvatarEmoji === 'function' ? getAvatarEmoji(winner) : '🎓';
    const safeName = typeof escapeHtml === 'function' ? escapeHtml(winner.name) : winner.name;

    result.innerHTML = `
      <div class="winner-card">
        <div class="winner-emoji">${emoji}</div>
        <div class="winner-name">${safeName}</div>
        <div class="winner-label">🎉 تم اختياره!</div>
      </div>
    `;
  },

  renderWheelHistory() {
    const container = document.getElementById('wheel-history-list');
    if (!container) return;

    const selected = this.wheelStudents.filter(s => this.selectedWheelStudents.includes(s.id));

    if (!selected.length) {
      container.innerHTML = '<div class="empty-desc" style="font-size:12px;">لا يوجد سجل بعد</div>';
      return;
    }

    container.innerHTML = selected.map((s, i) => {
      const emoji = typeof getAvatarEmoji === 'function' ? getAvatarEmoji(s) : '🎓';
      const safeName = typeof escapeHtml === 'function' ? escapeHtml(s.name) : s.name;
      return `
        <div class="history-item">
          <span class="history-num">${i + 1}</span>
          <span class="history-emoji">${emoji}</span>
          <span class="history-name">${safeName}</span>
        </div>
      `;
    }).join('');
  },

  /* ============================================================
     ⏱️ المؤقت (مُصلح — يتوقف في التصاعدي والتنازلي)
     ============================================================ */
  openTimer() {
    this.stopTimer();
    this.timerInterval = null;
    this.timerRemaining = 0;
    this.timerTotal = 0;

    openModal('⏱️ المؤقت', (body, modal) => {
      modal.style.maxWidth = '700px';
      body.innerHTML = `
        <div class="timer-container">
          <div class="timer-modes">
            <button class="timer-mode active" data-mode="down" type="button">⏳ تنازلي</button>
            <button class="timer-mode" data-mode="up" type="button">⏫ تصاعدي</button>
          </div>

          <div class="timer-display" id="timer-display">05:00</div>

          <div class="timer-presets">
            ${((window.APP_CONFIG && window.APP_CONFIG.TIMER_PRESETS) || [1, 2, 5, 10, 15]).map(m => `
              <button class="timer-preset" data-minutes="${m}" type="button">${m} د</button>
            `).join('')}
          </div>

          <div class="timer-custom">
            <label>دقيقة</label>
            <input type="number" id="timer-min-input" value="5" min="0" max="99">
            <label>ثانية</label>
            <input type="number" id="timer-sec-input" value="0" min="0" max="59">
            <button class="btn btn-ghost" id="timer-apply-custom" type="button">تعيين</button>
          </div>

          <div class="timer-status" id="timer-status"></div>

          <div class="timer-controls">
            <button class="btn btn-success btn-lg" id="timer-start" type="button">▶️ بدء</button>
            <button class="btn btn-ghost" id="timer-pause" type="button">⏸️ إيقاف</button>
            <button class="btn btn-danger" id="timer-reset" type="button">🔄 إعادة</button>
          </div>
        </div>
      `;

      let mode = 'down';
      let totalSeconds = 300;
      let elapsedSeconds = 0;
      let intervalId = null;

      const display = document.getElementById('timer-display');
      const statusEl = document.getElementById('timer-status');
      const startBtn = document.getElementById('timer-start');

      const updateDisplay = () => {
        let value;
        if (mode === 'down') {
          value = Math.max(0, totalSeconds - elapsedSeconds);
        } else {
          value = elapsedSeconds;
        }
        display.textContent = this.formatTime(value);
        statusEl.textContent = mode === 'down'
          ? `متبقٍ: ${this.formatTime(Math.max(0, totalSeconds - elapsedSeconds))}`
          : `منقضي: ${this.formatTime(elapsedSeconds)} / ${this.formatTime(totalSeconds)}`;
      };

      const stopTimer = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        startBtn.textContent = '▶️ بدء';
        startBtn.disabled = false;
      };

      const startTimer = () => {
        if (intervalId) return;
        if (totalSeconds <= 0) {
          this.toast('اختر وقتًا أولاً', 'warn');
          return;
        }
        if (elapsedSeconds >= totalSeconds) {
          elapsedSeconds = 0;
          updateDisplay();
        }

        startBtn.textContent = '▶️ يعمل...';
        startBtn.disabled = true;

        intervalId = setInterval(() => {
          elapsedSeconds++;
          updateDisplay();

          // ✅ يتوقف في الحالتين (تصاعدي وتنازلي)
          if (elapsedSeconds >= totalSeconds) {
            stopTimer();
            display.style.color = '#10b981';
            setTimeout(() => { display.style.color = ''; }, 1500);
            this.timerFinished();
          }
        }, 1000);
      };

      updateDisplay();

      body.querySelectorAll('.timer-mode').forEach(btn => {
        btn.onclick = () => {
          body.querySelectorAll('.timer-mode').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          mode = btn.dataset.mode;
          stopTimer();
          elapsedSeconds = 0;
          updateDisplay();
        };
      });

      body.querySelectorAll('.timer-preset').forEach(btn => {
        btn.onclick = () => {
          totalSeconds = Number(btn.dataset.minutes) * 60;
          elapsedSeconds = 0;
          stopTimer();
          updateDisplay();
        };
      });

      document.getElementById('timer-apply-custom').onclick = () => {
        const mins = Number(document.getElementById('timer-min-input').value) || 0;
        const secs = Number(document.getElementById('timer-sec-input').value) || 0;
        totalSeconds = mins * 60 + secs;
        elapsedSeconds = 0;
        stopTimer();
        updateDisplay();
      };

      startBtn.onclick = startTimer;

      document.getElementById('timer-pause').onclick = () => stopTimer();

      document.getElementById('timer-reset').onclick = () => {
        stopTimer();
        elapsedSeconds = 0;
        updateDisplay();
      };

      const origClose = modal.querySelector('.modal-close');
      if (origClose) {
        const origHandler = origClose.onclick;
        origClose.onclick = (e) => {
          stopTimer();
          if (origHandler) origHandler.call(origClose, e);
        };
      }
    });
  },

  formatTime(seconds) {
    const s = Math.max(0, Math.abs(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  timerFinished() {
    this.playBeep(880, 0.8);
    setTimeout(() => this.playBeep(880, 0.8), 400);
    setTimeout(() => this.playBeep(880, 0.8), 800);
    this.toast('⏰ انتهى الوقت!', 'success', 3000);
  },

  /* ============================================================
     👥 المجموعات + 🎭 الأدوار (مدمجة)
     ============================================================ */
  openGroups() {
    if (!State.students || State.students.length < 2) {
      this.toast('يجب أن يكون في الفصل طالبان على الأقل', 'warn');
      return;
    }

    // إعادة تعيين عند فتح المودال
    this.currentGroups = [];
    this.currentGroupCount = 2;

    openModal('👥 تقسيم المجموعات وتوزيع الأدوار', (body, modal) => {
      modal.style.maxWidth = '1000px';
      body.innerHTML = `
        <div class="groups-container">
          <div class="groups-controls">
            <label>عدد المجموعات</label>
            <input type="number" id="groups-count" value="2" min="2" max="10" style="width:100px;">
            <button class="btn btn-primary btn-lg" id="btn-divide" type="button">🎲 تقسيم عشوائي</button>
          </div>

          <div id="groups-result" class="groups-result">
            <div class="empty-desc">اضغط "تقسيم" لتوزيع الطلاب</div>
          </div>
        </div>
      `;

      document.getElementById('btn-divide').onclick = () => {
        const count = Number(document.getElementById('groups-count').value) || 2;
        this.divideGroups(count);
      };
    });
  },

  divideGroups(count) {
    const students = [...State.students];
    const shuffled = this.shuffle(students);
    const groups = Array.from({ length: count }, () => []);
    
    shuffled.forEach((s, i) => {
      groups[i % count].push(s);
    });

    // ✅ حفظ المجموعات للاستخدام اللاحق
    this.currentGroups = groups;
    this.currentGroupCount = count;

    this.renderGroups(groups, count);
  },

  renderGroups(groups, count) {
    const colors = (window.APP_CONFIG && window.APP_CONFIG.GROUP_COLORS) || [
      { name: 'أحمر', color: '#ef4444', icon: '🔴' },
      { name: 'أزرق', color: '#3b82f6', icon: '🔵' },
      { name: 'أخضر', color: '#10b981', icon: '🟢' },
      { name: 'أصفر', color: '#f59e0b', icon: '🟡' },
      { name: 'بنفسجي', color: '#8b5cf6', icon: '🟣' },
      { name: 'برتقالي', color: '#f97316', icon: '🟠' },
      { name: 'سماوي', color: '#06b6d4', icon: '🔷' },
      { name: 'وردي', color: '#ec4899', icon: '🌸' }
    ];
    const container = document.getElementById('groups-result');
    if (!container) return;

    container.innerHTML = `
      <div class="groups-grid">
        ${groups.map((group, i) => {
          const color = colors[i % colors.length];
          return `
            <div class="group-card-v2" style="border-color: ${color.color};" data-group-idx="${i}">
              <div class="group-header" style="background: ${color.color};">
                <span>${color.icon}</span>
                <span>المجموعة ${i + 1}</span>
                <span class="group-count">${group.length}</span>
              </div>
              <div class="group-members">
                ${group.map(s => {
                  const emoji = typeof getAvatarEmoji === 'function' ? getAvatarEmoji(s) : '🎓';
                  const safeName = typeof escapeHtml === 'function' ? escapeHtml(s.name) : s.name;
                  return `
                    <div class="group-member">
                      <span class="member-emoji">${emoji}</span>
                      <span class="member-name">${safeName}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="group-roles" id="group-roles-${i}">
                <div class="roles-placeholder">لم يتم توزيع الأدوار بعد</div>
              </div>
              <div class="group-actions">
                <button class="btn btn-sm btn-primary assign-roles-btn" data-group-idx="${i}" type="button">
                  🎲 توزيع الأدوار عشوائيًا
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // ربط أزرار توزيع الأدوار
    container.querySelectorAll('.assign-roles-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.groupIdx);
        this.assignGroupRoles(idx);
      };
    });
  },

  assignGroupRoles(groupIdx) {
    const group = this.currentGroups[groupIdx];
    if (!group || !group.length) return;

    const roles = (window.APP_CONFIG && window.APP_CONFIG.ROLES) || [
      { id: 'leader', name: 'قائد', icon: '👑' },
      { id: 'writer', name: 'كاتب', icon: '✍️' },
      { id: 'speaker', name: 'متحدث', icon: '🗣️' },
      { id: 'helper', name: 'مساعد', icon: '🤝' },
      { id: 'timekeeper', name: 'منظم الوقت', icon: '⏰' },
      { id: 'presenter', name: 'عارض', icon: '🎤' }
    ];

    const shuffledStudents = this.shuffle([...group]);
    const assignments = shuffledStudents.map((student, i) => ({
      student,
      role: roles[i % roles.length]
    }));

    const rolesContainer = document.getElementById(`group-roles-${groupIdx}`);
    if (!rolesContainer) return;

    rolesContainer.innerHTML = `
      <div class="group-roles-list">
        ${assignments.map(a => {
          const emoji = typeof getAvatarEmoji === 'function' ? getAvatarEmoji(a.student) : '🎓';
          const safeName = typeof escapeHtml === 'function' ? escapeHtml(a.student.name) : a.student.name;
          return `
            <div class="group-role-item">
              <span class="role-badge">${a.role.icon} ${a.role.name}</span>
              <span class="role-student-name">${emoji} ${safeName}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.playBeep(900, 0.15);
    this.toast(`✅ تم توزيع الأدوار للمجموعة ${groupIdx + 1}`, 'success', 2000);
  },

  /* ============================================================
     🔔 إشارات الانتباه
     ============================================================ */
  openSignals() {
    openModal('🔔 إشارات الانتباه', (body, modal) => {
      modal.style.maxWidth = '900px';
      const signals = (window.APP_CONFIG && window.APP_CONFIG.SIGNALS) || [
        { icon: '🤫', label: 'هدوء', color: '#3b82f6' },
        { icon: '👏', label: 'تصفيق', color: '#f59e0b' },
        { icon: '🙋', label: 'رفع اليد', color: '#10b981' },
        { icon: '⏰', label: 'الوقت', color: '#ef4444' },
        { icon: '✅', label: 'أحسنت', color: '#10b981' },
        { icon: '🎉', label: 'احتفال', color: '#8b5cf6' }
      ];

      body.innerHTML = `
        <div class="signals-grid">
          ${signals.map((sig, i) => `
            <button class="signal-card" data-signal-idx="${i}" type="button">
              <div class="signal-icon">${sig.icon}</div>
              <div class="signal-label">${sig.label}</div>
            </button>
          `).join('')}
        </div>
      `;

      body.querySelectorAll('.signal-card').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.signalIdx);
          this.showSignalFullscreen(signals[idx]);
        };
      });
    });
  },

  showSignalFullscreen(signal) {
    if (typeof closeAllModals === 'function') closeAllModals();
    this.playBeep(1400, 0.2);
    
    const overlay = document.createElement('div');
    overlay.className = 'signal-fullscreen';
    overlay.style.background = signal.color || '#1e40af';
    overlay.innerHTML = `
      <div class="signal-topbar">
        <button class="signal-back-btn" type="button" aria-label="رجوع">
          <span>←</span> رجوع
        </button>
      </div>
      <div class="signal-content">
        <div class="signal-big-icon">${signal.icon}</div>
        <div class="signal-big-label">${signal.label}</div>
        <button class="btn btn-ghost signal-close" type="button">✕ إغلاق</button>
      </div>
    `;
    
    document.body.appendChild(overlay);

    overlay.querySelector('.signal-back-btn').onclick = () => {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
      this.openSignals();
    };

    overlay.querySelector('.signal-close').onclick = () => {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    };
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
        this.openSignals();
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  /* ============================================================
     أدوات داخلية — بدائل آمنة
     ============================================================ */
  shuffle(arr) {
    if (typeof window.shuffle === 'function') return window.shuffle(arr);
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  toast(msg, type = 'info', duration = 2500) {
    if (typeof window.toast === 'function') return window.toast(msg, type, duration);
    const container = document.getElementById('toast-container') || document.body;
    const el = document.createElement('div');
    el.className = `toast toast-${type} show`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }
};

/* ============================================================
   التهيئة — تصدير عالمي
   ============================================================ */
window.ToolsUI = ToolsUI;
window.Tools = ToolsUI;

function showTools() {
  return ToolsUI.render();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ tools.js جاهز — ToolsUI متاح على window');
  console.log('🎯 الأدوات: العجلة، المؤقت، المجموعات+الأدوار، الإشارات');
});