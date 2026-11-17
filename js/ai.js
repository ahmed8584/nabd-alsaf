/* ============================================================
   نبض الصف — المساعد الذكي (AI Assistant)
   ============================================================ */

const AIUI = {
  messages: [], // سجل المحادثة في الجلسة الحالية
  isGenerating: false,

  // ✅ اقتراحات سريعة جاهزة
  suggestions: [
    { icon: '📝', label: 'أسئلة اختبار', prompt: 'اقترح 5 أسئلة اختبار قصيرة تناسب طلاب الصف الحالي، مع الإجابات النموذجية.' },
    { icon: '💡', label: 'فكرة نشاط', prompt: 'أعطني فكرة نشاط صفي جماعي ممتع ومحفز لتنفيذه خلال 15 دقيقة.' },
    { icon: '💬', label: 'ملاحظة سلوك', prompt: 'اكتب ملاحظة إيجابية قصيرة لطالب أظهر تحسناً ملحوظاً في مشاركته الصفية.' },
    { icon: '📧', label: 'رسالة لولي الأمر', prompt: 'صغ رسالة مهذبة ومحترمة لولي أمر طالب يحتاج إلى تحسين في مستواه الدراسي.' },
    { icon: '🎯', label: 'أهداف الحصة', prompt: 'اقترح 3 أهداف تعليمية واضحة وقابلة للقياس لحصة قادمة.' },
    { icon: '🌟', label: 'عبارات تشجيع', prompt: 'أعطني 10 عبارات تشجيعية متنوعة يمكنني قولها لطلابي.' }
  ],

  async render() {
    const content = document.getElementById('content');

    content.innerHTML = `
      <div class="ai-container">
        <div class="ai-header">
          <div class="ai-header-icon">🤖</div>
          <div class="ai-header-info">
            <h2>المساعد الذكي</h2>
            <p>مساعدك التربوي — اسألني أي شيء عن التعليم والصف</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="ai-clear" type="button" title="محادثة جديدة">
            🔄 محادثة جديدة
          </button>
        </div>

        <div class="ai-chat" id="ai-chat"></div>

        <div class="ai-suggestions" id="ai-suggestions">
          ${this.suggestions.map((s, i) => `
            <button class="ai-suggestion-chip" data-suggestion-idx="${i}" type="button">
              <span>${s.icon}</span>
              <span>${s.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="ai-input-wrap">
          <textarea 
            id="ai-input" 
            class="ai-input" 
            placeholder="اكتب سؤالك أو طلبك... (مثال: اقترح نشاط لدرس الرياضيات)"
            rows="1"></textarea>
          <button class="ai-send-btn" id="ai-send" type="button" title="إرسال">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.renderChat();

    // ربط الأحداث
    document.getElementById('ai-clear').onclick = () => this.clearChat();
    document.getElementById('ai-send').onclick = () => this.sendMessage();
    
    const input = document.getElementById('ai-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // التمرير التلقائي لأسفل
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // ربط الاقتراحات
    document.querySelectorAll('.ai-suggestion-chip').forEach(chip => {
      chip.onclick = () => {
        const idx = Number(chip.dataset.suggestionIdx);
        const suggestion = this.suggestions[idx];
        if (suggestion) {
          input.value = suggestion.prompt;
          this.sendMessage();
        }
      };
    });

    // رسالة ترحيب أولية
    if (this.messages.length === 0) {
      this.addMessage('assistant', 'أهلاً بك! 👋\nأنا مساعدك التربوي الذكي. يمكنك سؤالي عن:\n\n📝 توليد أسئلة اختبار\n💡 اقتراح أنشطة صفية\n💬 كتابة ملاحظات للطلاب\n📧 رسائل لأولياء الأمور\n\nاكتب سؤالك في الأسفل، أو اختر اقتراحاً من الأعلى ⬆️', false);
    }
  },

  renderChat() {
    const chat = document.getElementById('ai-chat');
    if (!chat) return;

    if (this.messages.length === 0) {
      chat.innerHTML = '';
      return;
    }

    chat.innerHTML = this.messages.map((msg, i) => {
      const isUser = msg.role === 'user';
      const safeText = this.escapeAndFormat(msg.text);
      
      return `
        <div class="ai-message ${isUser ? 'ai-message-user' : 'ai-message-assistant'}">
          <div class="ai-message-avatar">
            ${isUser ? '👤' : '🤖'}
          </div>
          <div class="ai-message-content">
            <div class="ai-message-bubble">${safeText}</div>
            ${!isUser ? `
              <div class="ai-message-actions">
                <button class="ai-copy-btn" data-copy-idx="${i}" type="button" title="نسخ">
                  📋 نسخ
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // ربط أزرار النسخ
    chat.querySelectorAll('.ai-copy-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.copyIdx);
        const msg = this.messages[idx];
        if (msg) this.copyToClipboard(msg.text, btn);
      };
    });

    this.scrollToBottom();
  },

  addMessage(role, text, scroll = true) {
    this.messages.push({ role, text, timestamp: Date.now() });
    this.renderChat();
    if (scroll) this.scrollToBottom();
  },

    showTyping() {
    const chat = document.getElementById('ai-chat');
    if (!chat) return;
    
    const existing = document.getElementById('ai-typing');
    if (existing) return;

    const typingEl = document.createElement('div');
    typingEl.id = 'ai-typing';
    typingEl.className = 'ai-message ai-message-assistant';
    typingEl.innerHTML = `
      <div class="ai-message-avatar">🤖</div>
      <div class="ai-message-content">
        <div class="ai-message-bubble ai-typing-bubble">
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-status" id="ai-typing-status">أفكر...</span>
        </div>
      </div>
    `;
    chat.appendChild(typingEl);
    this.scrollToBottom();

    // ✅ تحديث النص كل ثانيتين
    const statuses = ['أفكر...', 'أجمع أفكاري...', 'أصيغ الرد...', 'تقريباً انتهيت...'];
    let idx = 0;
    this._typingInterval = setInterval(() => {
      idx = (idx + 1) % statuses.length;
      const statusEl = document.getElementById('ai-typing-status');
      if (statusEl) statusEl.textContent = statuses[idx];
    }, 2000);
  },

  hideTyping() {
    const typing = document.getElementById('ai-typing');
    if (typing) typing.remove();
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
      this._typingInterval = null;
    }
  },

  async sendMessage() {
    if (this.isGenerating) return;

    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;

    // إضافة رسالة المعلم
    this.addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';

    // إخفاء الاقتراحات بعد أول رسالة
    const suggestions = document.getElementById('ai-suggestions');
    if (suggestions) suggestions.style.display = 'none';

    this.isGenerating = true;
    this.showTyping();

    const sendBtn = document.getElementById('ai-send');
    if (sendBtn) sendBtn.disabled = true;

        try {
      // ✅ Context
      const context = this.buildContext(text);

      // ✅ Timeout 30 ثانية (بدل الانتظار للأبد)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت المهلة (30 ثانية). حاول سؤالاً أقصر.')), 30000)
      );

      const res = await Promise.race([
        Api.aiGenerate({ prompt: context }),
        timeoutPromise
      ]);

      this.hideTyping();

      if (res && res.configured === false) {
        this.addMessage('assistant', '⚠️ ' + (res.message || 'المساعد الذكي غير مكوّن.') + '\n\n' + (res.fallback || ''));
        this.isGenerating = false;
        if (sendBtn) sendBtn.disabled = false;
        return;
      }

      if (res && res.text) {
        this.addMessage('assistant', res.text);
        if (typeof playBeep === 'function') playBeep(880, 0.1);
      } else if (res && res.error) {
        this.addMessage('assistant', '❌ حدث خطأ: ' + res.error);
      } else {
        this.addMessage('assistant', '❌ لم أستطع توليد رد. حاول مرة أخرى.');
      }
    } catch (err) {
      this.hideTyping();
      const msg = err.message || 'تحقق من الإنترنت';
      this.addMessage('assistant', '❌ ' + msg);
      console.error(err);
    } finally {
      this.isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  },

  buildContext(newPrompt) {
    // ✅ إضافة سياق (اسم الفصل، عدد الطلاب) + آخر رسائل المحادثة
    let context = '';
    
    if (State.currentClass) {
      const className = State.currentClass.name || State.currentClass.grade || 'غير محدد';
      const studentCount = State.students.length;
      context += `[سياق: أنت مساعد تربوي ذكي. الفصل الحالي: ${className}. عدد الطلاب: ${studentCount}. أجب بالعربية الفصحى الواضحة والمباشرة.]\n\n`;
    }

    // آخر 4 رسائل للذاكرة (لتوفير tokens)
    const recentMessages = this.messages.slice(-4, -1);
    if (recentMessages.length > 0) {
      context += 'محادثة سابقة:\n';
      recentMessages.forEach(m => {
        context += `${m.role === 'user' ? 'المعلم' : 'المساعد'}: ${m.text}\n`;
      });
      context += '\n';
    }

    context += `طلب المعلم: ${newPrompt}`;
    return context;
  },

  clearChat() {
    if (!confirm('هل تريد بدء محادثة جديدة؟ سيتم مسح المحادثة الحالية.')) return;
    
    this.messages = [];
    this.renderChat();
    
    const suggestions = document.getElementById('ai-suggestions');
    if (suggestions) suggestions.style.display = 'flex';

    // إعادة رسالة الترحيب
    this.addMessage('assistant', 'أهلاً بك مجدداً! 👋\nكيف يمكنني مساعدتك الآن؟', false);
  },

  scrollToBottom() {
    const chat = document.getElementById('ai-chat');
    if (chat) {
      setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
      }, 100);
    }
  },

  escapeAndFormat(text) {
    // هروب HTML
    let escaped = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // ✅ تنسيق Markdown بسيط
    // Bold
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code blocks
    escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code
    escaped = escaped.replace(/`([^`]+?)`/g, '<code>$1</code>');
    // Line breaks
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
  },

  async copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const origText = btn.textContent;
        btn.textContent = '✅ تم النسخ';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = origText;
          btn.classList.remove('copied');
        }, 1500);
      }
      if (typeof toast === 'function') toast('✅ تم النسخ', 'success', 1500);
    } catch (err) {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      if (typeof toast === 'function') toast('✅ تم النسخ', 'success', 1500);
    }
  }
};

function showAI() {
  return AIUI.render();
}