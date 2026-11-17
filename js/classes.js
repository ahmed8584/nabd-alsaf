/* ============================================================
   نبض الصف — إدارة الفصول
   ============================================================ */

const ClassesUI = {
  editing: null,

  async render() {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📚 الفصول الدراسية</h2>
          <button class="btn btn-primary" id="btn-new-class">➕ فصل جديد</button>
        </div>
        <div id="classes-list">
          <div class="empty">
            <div class="empty-title">جارٍ التحميل...</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-new-class').onclick = () => this.openForm();

    await this.renderList();
  },

  async renderList() {
    const container = document.getElementById('classes-list');
    try {
      await State.loadClasses();
      const classes = State.classes;

      if (!classes.length) {
        container.innerHTML = `
          <div class="empty">
            <div class="empty-title">لا توجد فصول بعد</div>
            <div class="empty-desc">اضغط "➕ فصل جديد" لإنشاء أول فصل</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="classes-grid">
          ${classes.map(c => this.classCard(c)).join('')}
        </div>
      `;

      container.querySelectorAll('[data-edit]').forEach(btn => {
        btn.onclick = () => {
          const cls = classes.find(c => c.id === btn.dataset.edit);
          if (cls) this.openForm(cls);
        };
      });

      container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.onclick = () => this.deleteClass(btn.dataset.delete);
      });

      container.querySelectorAll('[data-promote]').forEach(btn => {
        btn.onclick = () => this.promoteClass(btn.dataset.promote);
      });

      container.querySelectorAll('[data-open]').forEach(btn => {
        btn.onclick = () => {
          State.setCurrentClass(btn.dataset.open);
          if (typeof updateClassSelector === 'function') updateClassSelector();
          toast('تم اختيار الفصل', 'success');
          navigateTo('students');
        };
      });

    } catch (e) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-title">خطأ</div>
          <div class="empty-desc">${escapeHtml(e.message)}</div>
        </div>
      `;
    }
  },

  classCard(c) {
    const isActive = c.id === State.currentClassId;
    const joinCode = c.joinCode || '';
    return `
      <div class="class-card ${isActive ? 'active' : ''}">
        ${isActive ? '<div class="class-badge-active">✓ الحالي</div>' : ''}
        <div class="class-icon">📚</div>
        <div class="class-info">
          <div class="class-name">${escapeHtml(c.name)}</div>
          <div class="class-meta">
            ${escapeHtml(c.grade || '')} ${c.section ? '• شعبة ' + escapeHtml(c.section) : ''}
            ${c.subject ? '• ' + escapeHtml(c.subject) : ''}
          </div>
          ${joinCode ? `<div class="class-join-code">🔗 رمز الفصل: <strong>${escapeHtml(joinCode)}</strong></div>` : ''}
        </div>
        <div class="class-actions">
          <button class="btn btn-sm btn-primary" data-open="${c.id}" type="button">فتح</button>
          <button class="btn btn-sm btn-ghost" data-edit="${c.id}" type="button">✏️</button>
          <button class="btn btn-sm btn-ghost" data-promote="${c.id}" type="button" title="ترقية">🎓</button>
          <button class="btn btn-sm btn-danger" data-delete="${c.id}" type="button">🗑️</button>
        </div>
      </div>
    `;
  },

  openForm(existing = null) {
  this.editing = existing;

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="btn btn-ghost" id="btn-cancel-class" type="button">إلغاء</button>
    <button class="btn btn-primary" id="btn-save-class" type="button">💾 حفظ</button>
  `;

  openModal(existing ? '✏️ تعديل الفصل' : '➕ فصل جديد', (body) => {
    const grades = window.APP_CONFIG.GRADES_LIST;
    const sections = window.APP_CONFIG.SECTIONS_LIST;
    const subjects = window.APP_CONFIG.SUBJECTS_LIST;

    body.innerHTML = `
      <label>الصف الدراسي</label>
      <select id="cls-grade">
        <option value="">— اختر —</option>
        ${grades.map(g => `<option value="${g}" ${existing && existing.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select>

      <label>الشعبة</label>
      <select id="cls-section">
        <option value="">بدون شعبة</option>
        ${sections.map(s => `<option value="${s}" ${existing && existing.section === s ? 'selected' : ''}>شعبة ${s}</option>`).join('')}
      </select>

      <label>المادة</label>
      <select id="cls-subject">
        <option value="">— اختر —</option>
        ${subjects.map(s => `<option value="${s}" ${existing && existing.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>

      <div style="margin-top: 20px; padding: 14px; background: var(--primary-50); border-radius: 10px; border: 1px solid var(--primary-100);">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">سيتم إنشاء اسم الفصل تلقائياً:</div>
        <div id="cls-name-preview" style="font-size: 16px; font-weight: 800; color: var(--primary);">
          — اختر الصف أولاً —
        </div>
      </div>
    `;

    // تحديث المعاينة عند تغيير الصف أو الشعبة
    function updatePreview() {
      const grade = body.querySelector('#cls-grade').value;
      const section = body.querySelector('#cls-section').value;
      const preview = body.querySelector('#cls-name-preview');
      
      if (!grade) {
        preview.textContent = '— اختر الصف أولاً —';
        preview.style.color = 'var(--text-muted)';
        return;
      }
      
      const name = grade + (section ? ' - شعبة ' + section : '');
      preview.textContent = name;
      preview.style.color = 'var(--primary)';
    }

    body.querySelector('#cls-grade').onchange = updatePreview;
    body.querySelector('#cls-section').onchange = updatePreview;
    updatePreview();
  }, { footer });

  document.getElementById('btn-cancel-class').onclick = closeAllModals;
  document.getElementById('btn-save-class').onclick = () => this.saveClass();
},

  async saveClass() {
  const grade = document.getElementById('cls-grade').value;
  const section = document.getElementById('cls-section').value;
  const subject = document.getElementById('cls-subject').value;

  // ⭐ إنشاء الاسم تلقائياً
  if (!grade) {
    toast('اختر الصف الدراسي', 'warn');
    return;
  }

  const name = grade + (section ? ' - شعبة ' + section : '');

  // ... (باقي الكود كما هو)

    const btn = document.getElementById('btn-save-class');
    btn.disabled = true;
    btn.textContent = '⏳ جاري الحفظ...';

    try {
      if (this.editing) {
        await Api.updateClass({ id: this.editing.id, name, grade, section, subject });
        toast('تم تحديث الفصل ✓', 'success');
      } else {
        const created = await Api.createClass({ name, grade, section, subject });
        toast('تم إنشاء الفصل ✓', 'success');
        State.setCurrentClass(created.id);
      }
      closeAllModals();
      await this.renderList();
      if (typeof updateClassSelector === 'function') updateClassSelector();
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = '💾 حفظ';
    }
  },

  async deleteClass(id) {
    const cls = State.classes.find(c => c.id === id);
    if (!cls) return;

    const ok = await confirmAction(
      `⚠️ سيتم حذف "<strong>${escapeHtml(cls.name)}</strong>" مع جميع طلابه.<br><br>هل أنت متأكد؟`,
      'حذف'
    );
    if (!ok) return;

    try {
      const res = await Api.deleteClass(id);
      toast(`تم حذف الفصل و ${res.studentsDeleted || 0} طالب`, 'success');
      if (State.currentClassId === id) {
        State.setCurrentClass(null);
      }
      await this.renderList();
      if (typeof updateClassSelector === 'function') updateClassSelector();
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    }
  },

  async promoteClass(sourceId) {
    const cls = State.classes.find(c => c.id === sourceId);
    if (!cls) return;

    const grades = window.APP_CONFIG.GRADES_LIST;
    const currentIdx = grades.indexOf(cls.grade);
    const nextGrade = currentIdx >= 0 && currentIdx < grades.length - 1 ? grades[currentIdx + 1] : '';

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <button class="btn btn-ghost" id="btn-cancel-promote" type="button">إلغاء</button>
      <button class="btn btn-primary" id="btn-do-promote" type="button">🎓 ترقية</button>
    `;

    openModal('🎓 ترقية الفصل', (body) => {
      body.innerHTML = `
        <div style="padding:14px;background:var(--info-bg);border-radius:10px;margin-bottom:16px;font-size:13px;color:var(--info)">
          🎓 سيتم نقل طلاب "<strong>${escapeHtml(cls.name)}</strong>" إلى الفصل الجديد.
        </div>

        <label>الصف الهدف</label>
        <select id="prom-grade">
          ${grades.map(g => `<option value="${g}" ${g === nextGrade ? 'selected' : ''}>${g}</option>`).join('')}
        </select>

        <label>الشعبة</label>
        <select id="prom-section">
          <option value="">بدون شعبة</option>
          ${window.APP_CONFIG.SECTIONS_LIST.map(s => `<option value="${s}" ${s === cls.section ? 'selected' : ''}>شعبة ${s}</option>`).join('')}
        </select>

        <label style="display:flex;align-items:center;gap:8px;margin-top:16px;cursor:pointer">
          <input type="checkbox" id="prom-reset" checked style="width:auto">
          <span>تصفير النقاط</span>
        </label>

        <label style="display:flex;align-items:center;gap:8px;margin-top:8px;cursor:pointer">
          <input type="checkbox" id="prom-create" checked style="width:auto">
          <span>إنشاء الفصل الهدف إذا لم يكن موجوداً</span>
        </label>
      `;
    }, { footer });

    document.getElementById('btn-cancel-promote').onclick = closeAllModals;
    document.getElementById('btn-do-promote').onclick = async () => {
      const grade = document.getElementById('prom-grade').value;
      const section = document.getElementById('prom-section').value;
      const reset = document.getElementById('prom-reset').checked;
      const create = document.getElementById('prom-create').checked;

      const btn = document.getElementById('btn-do-promote');
      btn.disabled = true;
      btn.textContent = '⏳ جاري الترقية...';

      try {
        const res = await Api.promoteClass({
          sourceId, grade, section,
          reset: String(reset),
          create: String(create)
        });
        closeAllModals();
        toast(`✅ تم نقل ${res.moved} طالب`, 'success');
        await this.renderList();
        if (typeof updateClassSelector === 'function') updateClassSelector();
      } catch (e) {
        toast('فشل: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = '🎓 ترقية';
      }
    };
  }
};

/* اجعلها متاحة عالمياً */
window.ClassesUI = ClassesUI;