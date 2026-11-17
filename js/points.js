/* ============================================================
   نبض الصف — نظام التحفيز والنقاط (Phase 3.7 — نسخة نهائية)
   ============================================================ */

const PointsUI = {
  selectedStudents: new Set(),
  currentCriterion: null,
  semester: 's1',

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
    this.selectedStudents.clear();

    content.innerHTML = `
      <!-- ✅ إحصائيات -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🏆 التحفيز — ${escapeHtml(State.currentClassName)}</h2>
          <div class="flex-gap-2">
            <button class="btn btn-ghost btn-sm ${this.semester === 's1' ? 'active' : ''}" 
                    data-semester="s1" id="btn-sem-s1">📘 ف1</button>
            <button class="btn btn-ghost btn-sm ${this.semester === 's2' ? 'active' : ''}" 
                    data-semester="s2" id="btn-sem-s2">📗 ف2</button>
          </div>
        </div>
        <div id="points-stats" class="points-stats"></div>
      </div>

      <!-- ✅ قسم منح النقاط — فاخر -->
      <div class="card points-award-card">
        <div class="points-header">
          <h2 class="points-header-title">
            <span>🎁</span>
            <span>منح النقاط</span>
          </h2>
          <div class="points-header-hint">
            اضغط على معيار → اختر الطلاب → منح
          </div>
        </div>

        <div class="criteria-grid" id="criteria-grid"></div>

        <!-- قسم مخصص (اختياري) -->
        <div class="points-custom">
          <label>قيمة مخصصة (نقاط)</label>
          <input type="number" id="custom-points" value="1" min="1" max="20">
          <input type="text" id="custom-reason" placeholder="السبب (اختياري)" style="flex:1">
          <button class="btn btn-primary" id="btn-custom-apply">تطبيق</button>
        </div>
      </div>

      <!-- ✅ قائمة الطلاب -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">👥 الطلاب (<span id="selected-count">0</span> محدد)</h2>
          <button class="btn btn-ghost btn-sm" id="btn-select-all">✓ تحديد الكل</button>
        </div>
        <div id="points-students-list">
          <div class="empty"><div class="empty-title">جارٍ التحميل...</div></div>
        </div>
      </div>
    `;

    this.renderStats();
    this.renderCriteria();
    this.renderStudents();

    // أزرار الفصل الدراسي
    document.getElementById('btn-sem-s1').onclick = () => {
      this.semester = 's1';
      document.getElementById('btn-sem-s1').classList.add('active');
      document.getElementById('btn-sem-s2').classList.remove('active');
      this.renderStudents();
      this.renderStats();
    };
    document.getElementById('btn-sem-s2').onclick = () => {
      this.semester = 's2';
      document.getElementById('btn-sem-s2').classList.add('active');
      document.getElementById('btn-sem-s1').classList.remove('active');
      this.renderStudents();
      this.renderStats();
    };

    // تحديد الكل في قائمة الطلاب
    document.getElementById('btn-select-all').onclick = () => {
      const all = this.selectedStudents.size === State.students.length;
      if (all) {
        this.selectedStudents.clear();
      } else {
        State.students.forEach(s => this.selectedStudents.add(s.id));
      }
      this.renderStudents();
    };

    // تطبيق مخصص
    document.getElementById('btn-custom-apply').onclick = () => {
      const points = Number(document.getElementById('custom-points').value) || 1;
      const reason = document.getElementById('custom-reason').value.trim() || 'نقاط مخصصة';
      this.applyPoints(points, reason);
    };
  },

  renderStats() {
    const container = document.getElementById('points-stats');
    if (!container) return;

    const sem = this.semester;
    const totalPoints = State.students.reduce((sum, s) => sum + (Number(s[sem]) || 0), 0);
    const avgPoints = State.students.length ? (totalPoints / State.students.length).toFixed(1) : 0;
    const maxPoints = Math.max(...State.students.map(s => Number(s[sem]) || 0), 0);

    container.innerHTML = `
      <div class="stat-box stat-box-blue">
        <div class="stat-box-icon">👥</div>
        <div class="stat-box-value">${State.students.length}</div>
        <div class="stat-box-label">الطلاب</div>
      </div>
      <div class="stat-box stat-box-gold">
        <div class="stat-box-icon">⭐</div>
        <div class="stat-box-value">${totalPoints}</div>
        <div class="stat-box-label">مجموع النقاط</div>
      </div>
      <div class="stat-box stat-box-teal">
        <div class="stat-box-icon">📊</div>
        <div class="stat-box-value">${avgPoints}</div>
        <div class="stat-box-label">المتوسط</div>
      </div>
      <div class="stat-box stat-box-purple">
        <div class="stat-box-icon">🏆</div>
        <div class="stat-box-value">${maxPoints}</div>
        <div class="stat-box-label">الأعلى</div>
      </div>
    `;
  },

  /* ============================================================
     ✅ المعايير (تصميم فاخر)
     ============================================================ */
  renderCriteria() {
    const container = document.getElementById('criteria-grid');
    if (!container) return;

    const criteria = window.APP_CONFIG.POINTS_CRITERIA || [];

    container.innerHTML = criteria.map(c => `
      <button class="criterion-card" data-criterion="${c.id}" data-points="${c.points}" type="button">
        <div class="criterion-badge">+${c.points}</div>
        <div class="criterion-icon-wrap">
          <span class="criterion-icon">${c.icon}</span>
        </div>
        <div class="criterion-label">${c.label}</div>
        <div class="criterion-arrow">›</div>
      </button>
    `).join('');

    container.querySelectorAll('.criterion-card').forEach(btn => {
      btn.onclick = () => {
        const criterionId = btn.dataset.criterion;
        const criterion = criteria.find(c => c.id === criterionId);
        if (criterion) {
          this.openStudentSelector(criterion);
        }
      };
    });
  },

  /* ============================================================
     ✅ نافذة اختيار الطلاب (تصميم فاخر جديد)
     ============================================================ */
    openStudentSelector(criterion) {
    if (!State.students || !State.students.length) {
      toast('لا يوجد طلاب في الفصل', 'warn');
      return;
    }

    const selectedIds = new Set();

    openModal(`اختيار الطلاب — ${criterion.icon} ${criterion.label}`, (body, modal) => {
      modal.style.maxWidth = '760px';
      
      body.innerHTML = `
        <div class="student-selector">
          <div class="selector-info">
            <div class="selector-info-icon">${criterion.icon}</div>
            <div>
              <div class="selector-info-title">${criterion.label}</div>
              <div class="selector-info-desc">
                كل طالب تحددّه سيحصل على <strong>+${criterion.points}</strong> نقطة
              </div>
            </div>
          </div>

          <div class="selector-toolbar">
            <button class="btn btn-sm btn-ghost" id="btn-select-all-students" type="button">✓ تحديد الكل</button>
            <button class="btn btn-sm btn-ghost" id="btn-clear-selection" type="button">✕ إلغاء</button>
            <span class="selector-count" id="selector-count">0 محدد</span>
          </div>

          <div class="selector-grid" id="selector-grid">
            ${State.students.map(s => {
              const emoji = typeof getAvatarEmoji === 'function' ? getAvatarEmoji(s) : '🎓';
              const safeName = typeof escapeHtml === 'function' ? escapeHtml(s.name) : s.name;
              const color = typeof getStudentColor === 'function' ? getStudentColor(s) : '#4f46e5';
              return `
                <div class="selector-card" data-student-id="${s.id}" style="--student-color: ${color};">
                  <div class="selector-card-check">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div class="selector-card-avatar" style="background: linear-gradient(135deg, ${color}30, ${color}10); border: 2px solid ${color};">
                    ${emoji}
                  </div>
                  <div class="selector-card-body">
                    <div class="selector-card-name">${safeName}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="selector-footer">
            <button class="btn btn-ghost" id="selector-cancel" type="button">إلغاء</button>
            <button class="btn btn-primary btn-lg" id="selector-confirm" type="button" disabled>
              ✅ منح النقاط
            </button>
          </div>
        </div>
      `;

      const grid = document.getElementById('selector-grid');
      const countEl = document.getElementById('selector-count');
      const confirmBtn = document.getElementById('selector-confirm');

      // تحديث العداد وزر التأكيد
      const updateCount = () => {
        countEl.textContent = `${selectedIds.size} محدد`;
        confirmBtn.disabled = selectedIds.size === 0;
        confirmBtn.textContent = selectedIds.size > 0
          ? `✅ منح +${criterion.points} × ${selectedIds.size}`
          : '✅ منح النقاط';
      };

      // ✅ تفعيل النقر على البطاقة بالكامل
      grid.querySelectorAll('.selector-card').forEach(card => {
        card.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const id = this.dataset.studentId;
          if (selectedIds.has(id)) {
            selectedIds.delete(id);
            this.classList.remove('selected');
          } else {
            selectedIds.add(id);
            this.classList.add('selected');
          }
          updateCount();
        });
      });

      // تحديد الكل
      document.getElementById('btn-select-all-students').onclick = () => {
        State.students.forEach(s => selectedIds.add(s.id));
        grid.querySelectorAll('.selector-card').forEach(el => el.classList.add('selected'));
        updateCount();
      };

      // إلغاء التحديد
      document.getElementById('btn-clear-selection').onclick = () => {
        selectedIds.clear();
        grid.querySelectorAll('.selector-card').forEach(el => el.classList.remove('selected'));
        updateCount();
      };

      // إلغاء النافذة
      document.getElementById('selector-cancel').onclick = () => {
        if (typeof closeAllModals === 'function') closeAllModals();
      };

      // ✅ تأكيد المنح (تم تصحيحه ليعمل بسلاسة)
      confirmBtn.onclick = async () => {
        if (selectedIds.size === 0) return;
        
        const origText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.textContent = '⏳ جارٍ المنح...';

        try {
          const ids = Array.from(selectedIds);
          
          // إرسال البيانات إلى الخادم
          const res = await window.Api.addPointsBulk(
            ids,
            criterion.points,
            criterion.label,
            this.semester
          );

          // تحديث حالة الطلاب محلياً
          if (Array.isArray(res)) {
            res.forEach(r => {
              const s = State.students.find(x => x.id === r.id);
              if (s && r.newValue !== undefined) {
                s[this.semester] = r.newValue;
              }
            });
          }

          // احتفال + صوت
          if (typeof celebrate === 'function' && criterion.points >= 3) {
            celebrate(`🎉 +${criterion.points} × ${ids.length}`, 2000);
          }
          if (typeof playBeep === 'function') {
            playBeep(880, 0.15);
            setTimeout(() => playBeep(1100, 0.2), 120);
          }

          toast(`✅ مُنحت +${criterion.points} نقطة لـ ${ids.length} طالب`, 'success');

          // إغلاق وتحديث
          if (typeof closeAllModals === 'function') closeAllModals();
          await this.render();
        } catch (err) {
          console.error('❌ خطأ في منح النقاط:', err);
          toast('تعذّر المنح: ' + (err.message || 'خطأ غير معروف'), 'error', 4000);
          confirmBtn.disabled = false;
          confirmBtn.textContent = origText;
        }
      };

      // التحديث الأولي
      updateCount();
    });
  },

  /* ============================================================
     ✅ قائمة الطلاب
     ============================================================ */
  renderStudents() {
    const container = document.getElementById('points-students-list');
    const countEl = document.getElementById('selected-count');
    if (!container) return;

    if (!State.students.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-title">لا يوجد طلاب</div>
          <div class="empty-desc">أضف طلاباً من صفحة "👥 الطلاب" أولاً</div>
        </div>
      `;
      return;
    }

    const sem = this.semester;

    container.innerHTML = `
      <div class="students-grid-v2">
        ${State.students.map(s => this.studentCard(s, sem)).join('')}
      </div>
    `;

    if (countEl) countEl.textContent = this.selectedStudents.size;

    container.querySelectorAll('.student-select-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.studentId;
        if (this.selectedStudents.has(id)) {
          this.selectedStudents.delete(id);
        } else {
          this.selectedStudents.add(id);
        }
        this.renderStudents();
      };
    });

    container.querySelectorAll('[data-quick]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.quick;
        const delta = Number(btn.dataset.delta);
        this.quickPoints(id, delta);
      };
    });
  },

    studentCard(s, sem) {
    const color = typeof getStudentColor === 'function' ? getStudentColor(s) : '#4f46e5';
    const initial = typeof getInitial === 'function' ? getInitial(s.name) : s.name.charAt(0);
    const isSelected = this.selectedStudents.has(s.id);
    const points = Number(s[sem]) || 0;
    const seat = s.seat ? `مقعد ${s.seat}` : '';

    return `
      <div class="student-card-v3 ${isSelected ? 'selected' : ''}" style="--card-color: ${color}; --level-color: ${color};">
        <button class="student-select-btn" data-student-id="${s.id}" type="button" title="${isSelected ? 'إلغاء التحديد' : 'تحديد'}">
          ${isSelected ? '✓' : '○'}
        </button>
        
        <div class="student-avatar-v3" style="background: linear-gradient(135deg, ${color}30, ${color}10); border: 2px solid ${color};">
          <div class="avatar-emoji">${escapeHtml(initial)}</div>
        </div>
        
        <div class="student-info-v3">
          <div class="student-name-v3">${escapeHtml(s.name)}</div>
          ${seat ? `<div class="student-seat-v3">${seat}</div>` : ''}
          <div class="student-points-v3">
            <span class="point-chip ${sem === 's1' ? 'f1' : 'f2'}">
              ${sem === 's1' ? 'ف1' : 'ف2'}: <strong>${points}</strong>
            </span>
          </div>
        </div>
        
        <div class="student-actions-v3">
          <button class="action-btn btn-add" data-quick="${s.id}" data-delta="1" type="button" title="+1">+1</button>
          <button class="action-btn btn-add-5" data-quick="${s.id}" data-delta="5" type="button" title="+5">+5</button>
        </div>
      </div>
    `;
  },
  async quickPoints(id, delta) {
    try {
      const res = await Api.addPoints({
        id, delta,
        reason: delta > 0 ? 'نقاط سريعة' : 'خصم سريع',
        semester: this.semester
      });
      const s = State.students.find(x => x.id === id);
      if (s) s[this.semester] = res.newValue;
      this.renderStudents();
      this.renderStats();
      toast(`${delta > 0 ? '+' : ''}${delta} نقطة`, delta > 0 ? 'success' : 'warn', 1500);
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    }
  },

  async applyPoints(points, reason) {
    if (!this.selectedStudents.size) {
      toast('اختر طالباً واحداً على الأقل', 'warn');
      return;
    }

    const ids = Array.from(this.selectedStudents);

    try {
      const res = await Api.addPointsBulk(ids, points, reason, this.semester);
      
      res.forEach(r => {
        const s = State.students.find(x => x.id === r.id);
        if (s) s[this.semester] = r.newValue;
      });

      this.selectedStudents.clear();
      this.renderStudents();
      this.renderStats();
      
      toast(`✅ ${points} نقطة لـ ${res.length} طالب`, 'success');
      
      if (typeof celebrate === 'function' && points >= 3) {
        celebrate('🎉 أحسنتم!', 1500);
      }
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    }
  }
};

function showPoints() {
  return PointsUI.render();
}