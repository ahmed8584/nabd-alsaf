/* ============================================================
   نبض الصف — قسم التقارير (Reports & Analytics)
   ============================================================ */

const ReportsUI = {
  currentTab: 'leaderboard',
  semester: 's1',
  currentHistoryStudent: null,
  chartInstance: null,

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
      <div class="reports-header">
        <div class="reports-header-content">
          <h2>📊 تقارير الفصل</h2>
          <p>${escapeHtml(State.currentClassName)} — نظرة شاملة على الأداء</p>
        </div>
        <div class="reports-header-actions">
          <button class="btn btn-ghost btn-sm" id="btn-export-excel" type="button">
            📥 تصدير Excel
          </button>
          <button class="btn btn-primary btn-sm" id="btn-print" type="button">
            🖨️ طباعة
          </button>
        </div>
      </div>

      <div class="reports-tabs" id="reports-tabs">
        <button class="report-tab active" data-tab="leaderboard" type="button">
          🏆 لوحة الصدارة
        </button>
        <button class="report-tab" data-tab="comparison" type="button">
          📊 مقارنة الفصلين
        </button>
        <button class="report-tab" data-tab="history" type="button">
          📜 سجل النقاط
        </button>
      </div>

      <div id="report-content" class="report-content"></div>
    `;

    // ربط التبويبات
    document.querySelectorAll('.report-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.renderTab();
      };
    });

    // تصدير Excel
    document.getElementById('btn-export-excel').onclick = () => this.exportExcel();

    // طباعة
    document.getElementById('btn-print').onclick = () => this.printReport();

    this.renderTab();
  },

  renderTab() {
    const container = document.getElementById('report-content');
    if (!container) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    switch (this.currentTab) {
      case 'leaderboard': this.renderLeaderboard(container); break;
      case 'comparison': this.renderComparison(container); break;
      case 'history': this.renderHistory(container); break;
    }
  },

  /* ============================================================
     🏆 لوحة الصدارة
     ============================================================ */
  renderLeaderboard(container) {
    const students = [...State.students]
      .map(s => ({
        ...s,
        total: (Number(s.s1) || 0) + (Number(s.s2) || 0),
        s1: Number(s.s1) || 0,
        s2: Number(s.s2) || 0
      }))
      .sort((a, b) => b.total - a.total);

    if (!students.length) {
      container.innerHTML = `<div class="empty"><div class="empty-title">لا يوجد طلاب</div></div>`;
      return;
    }

    // إحصائيات سريعة
    const totalPoints = students.reduce((sum, s) => sum + s.total, 0);
    const avgPoints = (totalPoints / students.length).toFixed(1);
    const maxPoints = students[0].total;
    const activeStudents = students.filter(s => s.total > 0).length;

    // شارات لبعض الطلاب
    const getBadge = (student, rank) => {
      if (rank === 0) return { emoji: '🥇', label: 'الأول', class: 'badge-gold' };
      if (rank === 1) return { emoji: '🥈', label: 'الثاني', class: 'badge-silver' };
      if (rank === 2) return { emoji: '🥉', label: 'الثالث', class: 'badge-bronze' };
      if (student.total >= 100) return { emoji: '💎', label: 'ماسي', class: 'badge-diamond' };
      if (student.total >= 50) return { emoji: '⭐', label: 'نجم', class: 'badge-star' };
      if (student.total >= 20) return { emoji: '✨', label: 'نشط', class: 'badge-active' };
      return null;
    };

    container.innerHTML = `
      <div class="report-stats">
        <div class="report-stat">
          <div class="report-stat-icon">👥</div>
          <div class="report-stat-value">${students.length}</div>
          <div class="report-stat-label">الطلاب</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-icon">⭐</div>
          <div class="report-stat-value">${totalPoints}</div>
          <div class="report-stat-label">مجموع النقاط</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-icon">📊</div>
          <div class="report-stat-value">${avgPoints}</div>
          <div class="report-stat-label">المتوسط</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-icon">🏆</div>
          <div class="report-stat-value">${maxPoints}</div>
          <div class="report-stat-label">الأعلى</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-icon">🔥</div>
          <div class="report-stat-value">${activeStudents}</div>
          <div class="report-stat-label">نشط</div>
        </div>
      </div>

      <div class="report-section-title">🏆 ترتيب الطلاب</div>
      <div class="leaderboard-list">
        ${students.map((s, i) => {
          const badge = getBadge(s, i);
          const initial = typeof getInitial === 'function' ? getInitial(s.name) : s.name.charAt(0);
          const color = typeof getStudentColor === 'function' ? getStudentColor(s) : '#4f46e5';
          const percent = maxPoints > 0 ? (s.total / maxPoints) * 100 : 0;
          return `
            <div class="leaderboard-item ${i < 3 ? 'top-' + (i + 1) : ''}">
              <div class="leaderboard-rank ${i < 3 ? 'rank-' + (i + 1) : ''}">
                ${i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
              </div>
              <div class="leaderboard-avatar" style="background: linear-gradient(135deg, ${color}, ${color}dd);">
                ${escapeHtml(initial)}
              </div>
              <div class="leaderboard-info">
                <div class="leaderboard-name">${escapeHtml(s.name)}</div>
                <div class="leaderboard-bar-wrap">
                  <div class="leaderboard-bar" style="width: ${percent}%; background: linear-gradient(90deg, ${color}, ${color}aa);"></div>
                </div>
              </div>
              ${badge ? `<div class="leaderboard-badge ${badge.class}" title="${badge.label}">${badge.emoji}</div>` : ''}
              <div class="leaderboard-points">
                <strong>${s.total}</strong>
                <span>نقطة</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /* ============================================================
     📊 مقارنة الفصلين
     ============================================================ */
  renderComparison(container) {
    const students = State.students.map(s => ({
      ...s,
      s1: Number(s.s1) || 0,
      s2: Number(s.s2) || 0,
      total: (Number(s.s1) || 0) + (Number(s.s2) || 0)
    }));

    if (!students.length) {
      container.innerHTML = `<div class="empty"><div class="empty-title">لا يوجد طلاب</div></div>`;
      return;
    }

    const totalS1 = students.reduce((sum, s) => sum + s.s1, 0);
    const totalS2 = students.reduce((sum, s) => sum + s.s2, 0);
    const diff = totalS2 - totalS1;
    const improved = students.filter(s => s.s2 > s.s1).length;
    const declined = students.filter(s => s.s2 < s.s1).length;

    container.innerHTML = `
      <div class="report-section-title">📊 إحصائيات الفصلين</div>
      
      <div class="comparison-summary">
        <div class="comparison-card comparison-card-s1">
          <div class="comparison-card-header">
            <span>📘</span>
            <span>الفصل الأول</span>
          </div>
          <div class="comparison-card-value">${totalS1}</div>
          <div class="comparison-card-label">نقطة</div>
        </div>
        
        <div class="comparison-diff">
          <div class="comparison-diff-icon">${diff >= 0 ? '📈' : '📉'}</div>
          <div class="comparison-diff-value ${diff >= 0 ? 'positive' : 'negative'}">
            ${diff >= 0 ? '+' : ''}${diff}
          </div>
          <div class="comparison-diff-label">الفرق</div>
        </div>
        
        <div class="comparison-card comparison-card-s2">
          <div class="comparison-card-header">
            <span>📗</span>
            <span>الفصل الثاني</span>
          </div>
          <div class="comparison-card-value">${totalS2}</div>
          <div class="comparison-card-label">نقطة</div>
        </div>
      </div>

      <div class="report-stats">
        <div class="report-stat">
          <div class="report-stat-icon">📈</div>
          <div class="report-stat-value text-success">${improved}</div>
          <div class="report-stat-label">تحسّن</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-icon">📉</div>
          <div class="report-stat-value text-danger">${declined}</div>
          <div class="report-stat-label">تراجع</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-icon">➡️</div>
          <div class="report-stat-value">${students.length - improved - declined}</div>
          <div class="report-stat-label">ثابت</div>
        </div>
      </div>

      <div class="report-section-title">📈 رسم بياني للمقارنة</div>
      <div class="chart-wrap">
        <canvas id="comparison-chart"></canvas>
      </div>
    `;

    // رسم بياني
    this.renderComparisonChart(students);
  },

  renderComparisonChart(students) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const sorted = [...students].sort((a, b) => b.total - a.total).slice(0, 15);

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s.name),
        datasets: [
          {
            label: '📘 الفصل الأول',
            data: sorted.map(s => s.s1),
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: '📗 الفصل الثاني',
            data: sorted.map(s => s.s2),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Tajawal, sans-serif', size: 14, weight: 'bold' },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Tajawal, sans-serif', size: 14, weight: 'bold' },
            bodyFont: { family: 'Tajawal, sans-serif', size: 13 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: { family: 'Tajawal, sans-serif', size: 12 },
              precision: 0
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: {
              font: { family: 'Tajawal, sans-serif', size: 11, weight: 'bold' }
            },
            grid: { display: false }
          }
        }
      }
    });
  },

  /* ============================================================
     📜 سجل النقاط
     ============================================================ */
  async renderHistory(container) {
    container.innerHTML = `
      <div class="report-section-title">📜 سجل النقاط</div>
      
      <div class="history-filters">
        <select id="history-student-filter" class="input">
          <option value="">— كل الطلاب —</option>
          ${State.students.map(s => `
            <option value="${s.id}">${escapeHtml(s.name)}</option>
          `).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="btn-load-history" type="button">
          🔍 عرض السجل
        </button>
      </div>
      
      <div id="history-results">
        <div class="empty">
          <div class="empty-title">اختر طالباً لعرض سجله</div>
          <div class="empty-desc">أو اضغط "عرض السجل" بدون اختيار لعرض آخر العمليات</div>
        </div>
      </div>
    `;

    document.getElementById('btn-load-history').onclick = () => {
      const studentId = document.getElementById('history-student-filter').value;
      this.loadHistory(studentId);
    };
  },

  async loadHistory(studentId) {
    const results = document.getElementById('history-results');
    if (!results) return;

    results.innerHTML = `<div class="empty"><div class="empty-title">⏳ جارٍ التحميل...</div></div>`;

    try {
      let logs = [];
      if (studentId) {
        logs = await Api.pointsHistory(studentId);
      } else {
        // جلب سجل آخر 10 طلاب
        const recentLogs = await Promise.all(
          State.students.slice(0, 10).map(async s => {
            try {
              const studentLogs = await Api.pointsHistory(s.id);
              return studentLogs.map(log => ({ ...log, studentName: s.name }));
            } catch { return []; }
          })
        );
        logs = recentLogs.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (!logs.length) {
        results.innerHTML = `
          <div class="empty">
            <div class="empty-title">📭 لا يوجد سجل بعد</div>
            <div class="empty-desc">ستظهر العمليات هنا بعد منح النقاط</div>
          </div>
        `;
        return;
      }

      results.innerHTML = `
        <div class="history-list">
          ${logs.slice(0, 50).map(log => {
            const delta = Number(log.delta) || 0;
            const isPositive = delta > 0;
            const date = new Date(log.createdAt);
            const dateStr = date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
            const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            const semLabel = log.semester === 's1' ? '📘 ف1' : '📗 ف2';
            
            return `
              <div class="history-entry">
                <div class="history-entry-icon ${isPositive ? 'positive' : 'negative'}">
                  ${isPositive ? '➕' : '➖'}
                </div>
                <div class="history-entry-info">
                  <div class="history-entry-name">${escapeHtml(log.studentName || '—')}</div>
                  <div class="history-entry-reason">${escapeHtml(log.reason || 'بدون سبب')}</div>
                </div>
                <div class="history-entry-sem">${semLabel}</div>
                <div class="history-entry-date">
                  <div>${dateStr}</div>
                  <div class="history-entry-time">${timeStr}</div>
                </div>
                <div class="history-entry-delta ${isPositive ? 'positive' : 'negative'}">
                  ${isPositive ? '+' : ''}${delta}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      results.innerHTML = `
        <div class="empty">
          <div class="empty-title">❌ تعذّر تحميل السجل</div>
          <div class="empty-desc">${escapeHtml(err.message || 'تحقق من الاتصال')}</div>
        </div>
      `;
    }
  },

  /* ============================================================
     📥 تصدير Excel
     ============================================================ */
  exportExcel() {
    if (typeof XLSX === 'undefined') {
      toast('مكتبة Excel غير متوفرة', 'error');
      return;
    }

    try {
      const students = [...State.students].map(s => ({
        'الاسم': s.name,
        'المقعد': s.seat || '—',
        'نقاط ف1': Number(s.s1) || 0,
        'نقاط ف2': Number(s.s2) || 0,
        'المجموع': (Number(s.s1) || 0) + (Number(s.s2) || 0)
      })).sort((a, b) => b['المجموع'] - a['المجموع']);

      const ws = XLSX.utils.json_to_sheet(students);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
      
      const fileName = `تقرير-${State.currentClassName || 'الفصل'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast('✅ تم تصدير التقرير', 'success');
    } catch (err) {
      console.error(err);
      toast('تعذّر التصدير: ' + err.message, 'error');
    }
  },

  /* ============================================================
     🖨️ الطباعة
     ============================================================ */
            async printReport() {
    const btn = document.getElementById('btn-print');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ جاري التجهيز...';
    }

    const content = document.getElementById('report-content');
    if (!content) return;

    // 1. تجهيز نسخة من المحتوى
    const contentClone = content.cloneNode(true);
    const canvases = contentClone.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const div = document.createElement('div');
      div.style.cssText = 'text-align:center; padding: 40px; color: #64748b; border: 2px dashed #e2e8f0; border-radius: 12px; margin: 20px 0; font-weight: bold; background: #f8fafc;';
      div.textContent = '📊 [الرسم البياني يظهر في المنصة فقط]';
      canvas.replaceWith(div);
    });

    // 2. إنشاء الحاوية
    const wrapper = document.createElement('div');
    wrapper.setAttribute('dir', 'rtl');
    wrapper.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 800px;
      background: white;
      padding: 40px;
      font-family: 'Tajawal', sans-serif;
      direction: rtl;
      color: #0f172a;
      z-index: 99999;
    `;

    wrapper.innerHTML = `
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid #4f46e5;">
        <h1 style="font-size: 28px; color: #4f46e5; margin: 0 0 8px; font-family: 'Tajawal', sans-serif;">📊 تقرير الفصل</h1>
        <p style="font-size: 16px; color: #64748b; margin: 0; font-family: 'Tajawal', sans-serif;">${State.currentClassName} — ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
      ${contentClone.innerHTML}
    `;

    const style = document.createElement('style');
    style.innerHTML = `
      .report-stats { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 12px !important; margin-bottom: 24px !important; }
      .report-stat { padding: 16px !important; border-radius: 12px !important; text-align: center !important; border: 2px solid #e2e8f0 !important; }
      .report-stat-icon { font-size: 24px !important; margin-bottom: 6px !important; }
      .report-stat-value { font-size: 22px !important; font-weight: 900 !important; color: #4f46e5 !important; }
      .report-stat-label { font-size: 12px !important; color: #64748b !important; font-weight: 700 !important; }
      
      .report-section-title { font-size: 18px !important; font-weight: 900 !important; margin: 24px 0 16px !important; color: #0f172a !important; }
      
      .leaderboard-item { display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px !important; margin-bottom: 8px !important; border: 2px solid #e2e8f0 !important; border-radius: 12px !important; }
      .leaderboard-rank { width: 32px !important; height: 32px !important; border-radius: 50% !important; background: #f1f5f9 !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 900 !important; }
      .leaderboard-avatar { width: 44px !important; height: 44px !important; border-radius: 50% !important; color: white !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 900 !important; font-size: 16px !important; }
      .leaderboard-info { flex: 1 !important; }
      .leaderboard-name { font-weight: 800 !important; font-size: 15px !important; margin-bottom: 4px !important; }
      .leaderboard-bar-wrap { height: 6px !important; background: #f1f5f9 !important; border-radius: 4px !important; overflow: hidden !important; }
      .leaderboard-bar { height: 100% !important; border-radius: 4px !important; }
      .leaderboard-points strong { font-size: 20px !important; color: #4f46e5 !important; }
      .leaderboard-points span { font-size: 12px !important; color: #64748b !important; margin-right: 4px !important; }
      
      .history-entry { display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px !important; border-bottom: 1px solid #f1f5f9 !important; }
      .history-entry-delta { font-weight: 900 !important; font-size: 18px !important; }
      .history-entry-delta.positive { color: #10b981 !important; }
      .history-entry-delta.negative { color: #ef4444 !important; }
      
      .comparison-summary { display: grid !important; grid-template-columns: 1fr auto 1fr !important; gap: 20px !important; align-items: center !important; margin-bottom: 24px !important; }
      .comparison-card { padding: 24px !important; border-radius: 16px !important; text-align: center !important; border: 2px solid #e2e8f0 !important; }
      .comparison-card-value { font-size: 32px !important; font-weight: 900 !important; color: #4f46e5 !important; }
      
      .report-tabs, .reports-header-actions, .history-filters, button, select { display: none !important; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(wrapper);

    // 3. تحويل الـ wrapper إلى صورة باستخدام htmlToImage
    setTimeout(async () => {
      if (typeof htmlToImage === 'undefined') {
        toast('مكتبة التصدير غير محملة. تحقق من الإنترنت.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '🖨️ طباعة'; }
        wrapper.remove();
        style.remove();
        return;
      }

      try {
        // ✅ استخدمنا toPng بدلاً من html2canvas
        const dataUrl = await htmlToImage.toPng(wrapper, {
          quality: 1,
          pixelRatio: 2, // دقة عالية
          backgroundColor: '#ffffff',
          // إجبار تحميل الخطوط
          fontEmbedCSS: ''
        });

        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        link.download = `تقرير_${State.currentClassName}_${dateStr}.png`;
        link.href = dataUrl;
        link.click();

        toast('✅ تم حفظ التقرير كصورة في جهازك', 'success');
      } catch (err) {
        console.error(err);
        toast('تعذّر إنشاء الصورة: ' + err.message, 'error');
      } finally {
        wrapper.remove();
        style.remove();
        if (btn) { btn.disabled = false; btn.textContent = '🖨️ طباعة'; }
      }
    }, 800); // انتظر قليلاً حتى يتم تحميل الخط والأنماط
  },
};

function showReports() {
  return ReportsUI.render();
}