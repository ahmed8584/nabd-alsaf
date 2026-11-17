/* ============================================================
   نبض الصف — إدارة الطلاب
   ============================================================ */

const StudentsUI = {
  currentSemester: 's1', // ✅ الفصل النشط حالياً
  editing: null,
  searchQuery: '',

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

    content.innerHTML = `
      <div class="card">
        <!-- الترويسة (تم إصلاح التكرار هنا) -->
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <h2 class="card-title">👥 طلاب ${escapeHtml(State.currentClassName)}</h2>
          
          <!-- ✅ أزرار التبديل بين الفصلين -->
          <div class="flex-gap-2" style="margin-right: auto; margin-left: 16px;">
             <button class="btn btn-ghost btn-sm ${this.currentSemester === 's1' ? 'active' : ''}" id="btn-st-sem-s1">📘 ف1</button>
             <button class="btn btn-ghost btn-sm ${this.currentSemester === 's2' ? 'active' : ''}" id="btn-st-sem-s2">📗 ف2</button>
          </div>

          <!-- الأزرار الأساسية -->
          <div class="flex-gap-2" style="flex-wrap:wrap">
            <button class="btn btn-primary" id="btn-add-student">➕ طالب جديد</button>
            <button class="btn btn-ghost" id="btn-import-excel">📥 استيراد Excel</button>
            <button class="btn btn-ghost" id="btn-export-excel">📤 تصدير</button>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" id="students-search" placeholder="🔍 ابحث عن طالب...">
          <button class="btn btn-ghost" id="btn-reset-points" title="تصفير النقاط">🗑️ تصفير النقاط</button>
        </div>

        <div id="students-list">
          <div class="empty"><div class="empty-title">جارٍ التحميل...</div></div>
        </div>
      </div>
    `;

    // ربط أزرار الترويسة
    document.getElementById('btn-add-student').onclick = () => this.openForm();
    document.getElementById('btn-import-excel').onclick = () => this.openImportModal();
    document.getElementById('btn-export-excel').onclick = () => this.exportExcel();
    document.getElementById('btn-reset-points').onclick = () => this.resetPoints();
    document.getElementById('students-search').oninput = (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderList();
    };

    // ✅ ربط أزرار التبديل بين الفصلين
    const btnS1 = document.getElementById('btn-st-sem-s1');
    const btnS2 = document.getElementById('btn-st-sem-s2');
    
    if (btnS1 && btnS2) {
      btnS1.onclick = () => {
        this.currentSemester = 's1';
        btnS1.classList.add('active');
        btnS2.classList.remove('active');
        this.renderList(); // إعادة رسم البطاقات
      };
      btnS2.onclick = () => {
        this.currentSemester = 's2';
        btnS2.classList.add('active');
        btnS1.classList.remove('active');
        this.renderList();
      };
    }

    await State.loadStudents();
    this.renderList();
  },

  renderList() {
    const container = document.getElementById('students-list');
    if (!container) return;

    let students = State.students;
    if (this.searchQuery) {
      students = students.filter(s => s.name.toLowerCase().includes(this.searchQuery));
    }

    if (!students.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-title">${this.searchQuery ? 'لا توجد نتائج' : 'لا يوجد طلاب بعد'}</div>
          <div class="empty-desc">${this.searchQuery ? 'جرّب كلمة أخرى' : 'اضغط "➕ طالب جديد" أو "📥 استيراد Excel"'}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="students-grid-v2">
        ${students.map(s => this.studentCard(s)).join('')}
      </div>
    `;

    // ⭐ أزرار النقاط
    container.querySelectorAll('[data-add-points]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.addPoints;
        const delta = Number(btn.dataset.delta);
        this.quickPoints(id, delta);
      };
    });

    // ⭐ زر التصفير الفردي
    container.querySelectorAll('[data-reset-student]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.resetStudentPoints(btn.dataset.resetStudent);
      };
    });

    // تعديل
    container.querySelectorAll('[data-edit-student]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const s = State.students.find(x => x.id === btn.dataset.editStudent);
        if (s) this.openForm(s);
      };
    });

    // حذف
    container.querySelectorAll('[data-delete-student]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.deleteStudent(btn.dataset.deleteStudent);
      };
    });
  },

  studentCard(s) {
    const color = getStudentColor(s);
    const emoji = getAvatarEmoji(s);
    const total = (Number(s.s1) || 0) + (Number(s.s2) || 0);
    
    // مستوى الطالب
    const level = this.getStudentLevel(total);
    const borderColor = level.color;

    // ✅ تمييز الفصل النشط
    const isS1Active = this.currentSemester === 's1';
    const isS2Active = this.currentSemester === 's2';

    return `
      <div class="student-card-v3" style="
        --card-color: ${color};
        --level-color: ${borderColor};
      ">
        <!-- الأفاتار -->
        <div class="student-avatar-v3" style="
          background: linear-gradient(135deg, ${color}, ${color}dd);
        ">
          <span class="avatar-emoji">${emoji}</span>
          <span class="avatar-badge" title="${level.name}">${level.icon}</span>
        </div>
        
        <!-- المعلومات -->
        <div class="student-info-v3">
          <div class="student-name-v3">${escapeHtml(s.name)}</div>
          ${s.seat ? `<div class="student-seat-v3">🪑 ${escapeHtml(s.seat)}</div>` : ''}
          <div class="student-points-v3">
            <span class="point-chip f1 ${isS1Active ? 'active-chip' : ''}">ف1: <strong>${s.s1 || 0}</strong></span>
            <span class="point-chip f2 ${isS2Active ? 'active-chip' : ''}">ف2: <strong>${s.s2 || 0}</strong></span>
            <span class="point-chip total">⭐ ${total}</span>
          </div>
        </div>
        
        <!-- الأزرار -->
        <div class="student-actions-v3">
          <button class="action-btn btn-add" data-add-points="${s.id}" data-delta="1" type="button" title="+1">+1</button>
          <button class="action-btn btn-add-5" data-add-points="${s.id}" data-delta="5" type="button" title="+5">+5</button>
          <button class="action-btn btn-sub" data-add-points="${s.id}" data-delta="-1" type="button" title="-1">−1</button>
          <button class="action-btn btn-edit-v3" data-edit-student="${s.id}" type="button" title="تعديل">✏️</button>
          <button class="action-btn btn-reset-v3" data-reset-student="${s.id}" type="button" title="تصفير">🔄</button>
          <button class="action-btn btn-delete-v3" data-delete-student="${s.id}" type="button" title="حذف">🗑️</button>
        </div>
      </div>
    `;
  },

  /* ---------- تحديد المستوى ---------- */
  getStudentLevel(points) {
    if (points >= 100) return { name: 'أسطورة', icon: '👑', color: '#f59e0b' };
    if (points >= 50) return { name: 'بطل', icon: '🏆', color: '#d97706' };
    if (points >= 25) return { name: 'متميز', icon: '⭐', color: '#0ea5e9' };
    if (points >= 10) return { name: 'مبتكر', icon: '🌿', color: '#10b981' };
    return { name: 'مستكشف', icon: '🌱', color: '#64748b' };
  },

  async quickPoints(id, delta) {
    try {
      // ✅ استخدام الفصل النشط (s1 أو s2) بدلاً من s1 الثابتة
      const res = await Api.addPoints({ 
        id, 
        delta, 
        semester: this.currentSemester, 
        reason: 'نقاط سريعة' 
      });
      
      const s = State.students.find(x => x.id === id);
      if (s) s[res.semester] = res.newValue;
      
      // ⭐ تأثير بصري
      const cards = document.querySelectorAll(`.student-card-v3`);
      cards.forEach(card => {
        if (card.querySelector(`[data-add-points="${id}"]`)) {
          card.classList.add('point-added');
          setTimeout(() => card.classList.remove('point-added'), 500);
        }
      });
      
      this.renderList();
      toast(`${delta > 0 ? '+' : ''}${delta} نقطة`, delta > 0 ? 'success' : 'warn', 1500);
    } catch (e) {
      toast(e.message, 'error');
    }
  },

  async resetStudentPoints(id) {
    const s = State.students.find(x => x.id === id);
    if (!s) return;

    const ok = await confirmAction(
      `🔄 سيتم تصفير نقاط الطالب "<strong>${escapeHtml(s.name)}</strong>"<br>
      (ف1: ${s.s1 || 0} → 0 • ف2: ${s.s2 || 0} → 0)<br><br>متابعة؟`,
      'تصفير'
    );
    if (!ok) return;

    try {
      // تصفير الفصلين معاً
      await Api.resetStudentPoints(id, 's1');
      await Api.resetStudentPoints(id, 's2');
      
      s.s1 = 0;
      s.s2 = 0;
      
      this.renderList();
      toast(`✅ تم تصفير نقاط ${s.name}`, 'success');
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    }
  },

  openForm(existing = null) {
    this.editing = existing;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <button class="btn btn-ghost" id="btn-cancel-student" type="button">إلغاء</button>
      <button class="btn btn-primary" id="btn-save-student" type="button">💾 حفظ</button>
    `;

    openModal(existing ? '✏️ تعديل الطالب' : '➕ طالب جديد', (body) => {
      const currentEmoji = existing ? getAvatarEmoji(existing) : '🎓';
      
      body.innerHTML = `
        <label>الاسم الكامل</label>
        <input type="text" id="std-name" value="${existing ? escapeHtml(existing.name) : ''}" placeholder="مثال: أحمد محمد">

        <label>رقم المقعد (اختياري)</label>
        <input type="text" id="std-seat" value="${existing ? escapeHtml(existing.seat || '') : ''}" placeholder="مثال: 5">

        <label>اختر أفاتار الطالب</label>
        <div id="emoji-picker" class="emoji-picker">
          ${(window.APP_CONFIG.AVATAR_EMOJIS || []).map(emoji => `
            <button class="emoji-option ${emoji === currentEmoji ? 'selected' : ''}" 
                    type="button" 
                    data-emoji="${emoji}">
              ${emoji}
            </button>
          `).join('')}
        </div>

        <label>ملاحظات (اختياري)</label>
        <textarea id="std-notes" rows="2" placeholder="ملاحظات عن الطالب">${existing ? escapeHtml(existing.notes || '') : ''}</textarea>
      `;

      // اختيار الأفاتار
      let selectedEmoji = currentEmoji;
      
      body.querySelectorAll('.emoji-option').forEach(btn => {
        btn.onclick = () => {
          body.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedEmoji = btn.dataset.emoji;
        };
      });

      // حفظ الأفاتار مع الطالب
      this._selectedEmoji = selectedEmoji;
      
      document.getElementById('btn-save-student').onclick = () => {
        this.saveStudent(selectedEmoji);
      };
    }, { footer });

    document.getElementById('btn-cancel-student').onclick = closeAllModals;
  },

  async saveStudent(avatarEmoji = null) {
    const name = document.getElementById('std-name').value.trim();
    const seat = document.getElementById('std-seat').value.trim();
    const notes = document.getElementById('std-notes').value.trim();

    if (!name) {
      toast('أدخل اسم الطالب', 'warn');
      return;
    }

    const avatar = avatarEmoji || (this.editing ? getAvatarEmoji(this.editing) : '🎓');

    const btn = document.getElementById('btn-save-student');
    btn.disabled = true;
    btn.textContent = '⏳ جاري الحفظ...';

    try {
      if (this.editing) {
        await Api.updateStudent({ 
          id: this.editing.id, 
          name, seat, notes, avatar 
        });
        toast('تم تحديث الطالب ✓', 'success');
      } else {
        await Api.addStudent({ 
          classId: State.currentClassId, 
          name, seat, notes, avatar 
        });
        toast('تمت إضافة الطالب ✓', 'success');
      }
      closeAllModals();
      await State.loadStudents();
      this.renderList();
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = '💾 حفظ';
    }
  },

  async deleteStudent(id) {
    const s = State.students.find(x => x.id === id);
    if (!s) return;

    const ok = await confirmAction(
      `🗑️ سيتم حذف الطالب "<strong>${escapeHtml(s.name)}</strong>" مع نقاطه.<br><br>متابعة؟`,
      'حذف'
    );
    if (!ok) return;

    try {
      await Api.deleteStudent(id);
      toast('تم حذف الطالب ✓', 'success');
      await State.loadStudents();
      this.renderList();
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    }
  },

  openImportModal() {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <button class="btn btn-ghost" id="btn-cancel-import" type="button">إلغاء</button>
      <button class="btn btn-primary" id="btn-do-import" type="button" disabled>📥 استيراد</button>
    `;

    let selectedFile = null;

    openModal('📥 استيراد طلاب من Excel/CSV', (body) => {
      body.innerHTML = `
        <div style="padding:12px;background:var(--info-bg);border-radius:10px;margin-bottom:16px;font-size:13px;color:var(--info)">
          💡 العمود الأول: اسم الطالب.<br>
          💡 العمود الثاني (اختياري): رقم المقعد.
        </div>

        <div id="drop-zone" style="
          border: 2px dashed var(--primary);
          border-radius: 14px;
          padding: 32px 20px;
          text-align: center;
          background: var(--primary-50);
          cursor: pointer;
          transition: all 0.2s;
        ">
          <div style="font-size: 48px;">📄</div>
          <div style="font-weight: 700; color: var(--primary); margin-top: 8px;">
            اضغط لاختيار ملف أو اسحبه هنا
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            xlsx, xls, csv
          </div>
          <div id="file-name" style="font-size: 13px; color: var(--success); margin-top: 8px; font-weight: 700;"></div>
        </div>

        <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none">
      `;

      const dropZone = body.querySelector('#drop-zone');
      const fileInput = body.querySelector('#file-input');
      const fileName = body.querySelector('#file-name');
      const importBtn = document.getElementById('btn-do-import');

      dropZone.onclick = () => fileInput.click();
      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.background = 'var(--primary-100)'; };
      dropZone.ondragleave = () => { dropZone.style.background = 'var(--primary-50)'; };
      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.background = 'var(--primary-50)';
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      };

      fileInput.onchange = (e) => {
        const f = e.target.files[0];
        if (f) handleFile(f);
      };

      function handleFile(f) {
        selectedFile = f;
        fileName.textContent = '✓ ' + f.name;
        importBtn.disabled = false;
      }

      importBtn.onclick = async () => {
        if (!selectedFile) return;
        try {
          importBtn.disabled = true;
          importBtn.textContent = '⏳ جاري الاستيراد...';

          const students = await parseExcelFile(selectedFile);
          if (!students.length) {
            toast('لم يتم العثور على أسماء', 'warn');
            return;
          }

          const res = await Api.bulkStudents(State.currentClassId, students);
          toast(`✅ تم استيراد ${res.added} طالب (تم تجاهل ${res.skipped || 0})`, 'success');
          closeAllModals();
          await State.loadStudents();
          this.renderList();
        } catch (e) {
          toast('فشل: ' + e.message, 'error');
          importBtn.disabled = false;
          importBtn.textContent = '📥 استيراد';
        }
      };
    }, { footer });

    document.getElementById('btn-cancel-import').onclick = closeAllModals;
  },

  async exportExcel() {
    if (!State.students.length) {
      toast('لا يوجد طلاب لتصديرهم', 'warn');
      return;
    }

    try {
      const rows = [['م', 'الاسم', 'المقعد', 'ف1', 'ف2', 'المجموع', 'ملاحظات']];
      State.students.forEach((s, i) => {
        const s1 = Number(s.s1) || 0;
        const s2 = Number(s.s2) || 0;
        rows.push([i + 1, s.name, s.seat || '', s1, s2, s1 + s2, s.notes || '']);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');

      const className = State.currentClassName.replace(/[\/\\:*?"<>|]/g, '-');
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `طلاب_${className}_${date}.xlsx`);

      toast('✅ تم تصدير الملف', 'success');
    } catch (e) {
      toast('فشل التصدير: ' + e.message, 'error');
    }
  },

    async resetPoints() {
    const ok = await confirmAction(
      `⚠️ سيتم تصفير نقاط جميع طلاب الفصل (ف1 و ف2 معاً):<br><strong>${escapeHtml(State.currentClassName)}</strong><br><br>متابعة؟`,
      'تصفير'
    );
    if (!ok) return;

    try {
      // ✅ تصفير الفصل الأول
      await Api.resetPoints(State.currentClassId, 's1');
      
      // ✅ تصفير الفصل الثاني (هذا هو السطر المفقود)
      await Api.resetPoints(State.currentClassId, 's2');
      
      toast(`✅ تم تصفير نقاط جميع الطلاب في الفصلين`, 'success');
      
      // تحديث البيانات وإعادة الرسم
      await State.loadStudents();
      this.renderList();
    } catch (e) {
      toast('فشل: ' + e.message, 'error');
    }
  },
};

/* اجعلها متاحة عالمياً */
window.StudentsUI = StudentsUI;