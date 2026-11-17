/* ============================================================
   نبض الصف — الإعدادات
   ============================================================ */

window.APP_CONFIG = {
  /* اسم المنصة */
  APP_NAME: 'نبض الصف',
  APP_VERSION: '1.0.0',
  
  /* رابط الخادم (Apps Script) — يُملأ بعد النشر */
  API_URL: 'https://script.google.com/macros/s/AKfycbxA-N-JJyVIH_WBWkkiDqVJ7_SvADuA7oAWHzXW5PmESzlM62S3g0vsCjeJITUGkLBU/exec',
  /* معلومات المدرسة (يمكن تعديلها من الإعدادات) */
  SCHOOL_NAME: 'مدرسة ________',
  
  /* الدورة الزمنية للتحديث (Polling) */
  POLL_INTERVAL: 3000,
  
  /* الصفوف الدراسية */
  GRADES_LIST: [
    'خامس', 'سادس', 'سابع', 'ثامن',
    'تاسع', 'عاشر', 'حادي عشر', 'ثاني عشر'
  ],
  
  /* الشعب */
  SECTIONS_LIST: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  
  /* المواد الدراسية الشائعة */
  SUBJECTS_LIST: [
    'رياضيات', 'لغة عربية', 'لغة إنجليزية', 'علوم',
    'دراسات اجتماعية', 'تربية إسلامية', 'تقنية معلومات',
    'فنون', 'تربية رياضية', 'مهارات حياتية'
  ],
  
  /* ألوان الأفاتار */
  AVATAR_COLORS: [
    '#1e40af', '#3b82f6', '#0ea5e9', '#0284c7', '#7c3aed',
    '#8b5cf6', '#d97706', '#b45309', '#059669', '#64748b'
  ],

 AVATAR_EMOJIS: [
  // رياضة وأنشطة
  '⚽', '🏀', '🎾', '🏐', '🏈', '🎱', '🎯', '🎳', '🏓', '🏸', '🥊', '⛹️', '🏊', '🚴',
  // فنون وإبداع
  '🎨', '🎭', '🎬', '📸', '🎸', '🎹', '🎺', '🎤', '🎧', '✏️', '🖌️', '📝',
  // علوم وتقنية
  '🔬', '🧪', '💻', '🖥️', '📱', '🔭', '🌌', '🚀', '🧬', '🧮', '📐',
  // طبيعة
  '🌳', '🌸', '🌻', '🌹', '🍀', '🌈', '☀️', '🌙', '⭐', '🌊', '🏔️', '🔥',
  // شخصيات ملهمة
  '🦸', '🦸‍♀️', '🧙', '🧚', '🤴', '👸', '👑', '🎓', '🎩', '🥇', '🏅', '💎',
  // رموز
  '🌟', '✨', '💫', '⚡', '🎯', '🚀', '🏆', '🎪', '🎉', '🎊'
],
  
  /* ألوان المجموعات */
  GROUP_COLORS: [
    { name: 'أزرق', color: '#1e40af', icon: '🔷' },
    { name: 'سماوي', color: '#0ea5e9', icon: '🔹' },
    { name: 'بنفسجي', color: '#7c3aed', icon: '🟣' },
    { name: 'ذهبي', color: '#d97706', icon: '🟡' },
    { name: 'أخضر', color: '#059669', icon: '🟢' },
    { name: 'رمادي', color: '#64748b', icon: '⚪' },
    { name: 'نيلي', color: '#4338ca', icon: '🔵' },
    { name: 'فيروزي', color: '#0891b2', icon: '🔷' }
  ],
  /* معايير منح النقاط (يمكن للمعلم تعديلها) */
  POINTS_CRITERIA: [
    { id: 'participation', label: 'مشاركة فعالة', points: 2, icon: '🙋' },
    { id: 'cooperation', label: 'تعاون مع الزملاء', points: 2, icon: '🤝' },
    { id: 'instructions', label: 'التزام بالتعليمات', points: 1, icon: '✅' },
    { id: 'task_done', label: 'إنجاز مهمة', points: 3, icon: '🎯' },
    { id: 'helping', label: 'مساعدة الآخرين', points: 2, icon: '💚' },
    { id: 'creativity', label: 'إبداع', points: 3, icon: '✨' },
    { id: 'perseverance', label: 'مثابرة', points: 2, icon: '💪' }
  ],
  
  /* الشارات */
  BADGES: [
    { id: 'star_participation', name: 'نجم المشاركة', icon: '⭐', threshold: 10, color: '#f59e0b' },
    { id: 'cooperation_hero', name: 'بطل التعاون', icon: '🤝', threshold: 15, color: '#10b981' },
    { id: 'creative', name: 'المبدع', icon: '🎨', threshold: 20, color: '#7c3aed' },
    { id: 'fast_finisher', name: 'المنجز السريع', icon: '⚡', threshold: 12, color: '#f97316' },
    { id: 'persistent', name: 'المثابر', icon: '💪', threshold: 25, color: '#ef4444' },
    { id: 'leader', name: 'القائد', icon: '👑', threshold: 30, color: '#ec4899' }
  ],
  
  /* المستويات */
  LEVELS: [
    { level: 1, name: 'مستكشف', minPoints: 0, icon: '🌱' },
    { level: 2, name: 'مبتكر', minPoints: 25, icon: '🌿' },
    { level: 3, name: 'متميز', minPoints: 50, icon: '🌳' },
    { level: 4, name: 'بطل', minPoints: 100, icon: '🏆' },
    { level: 5, name: 'أسطورة', minPoints: 200, icon: '👑' }
  ],
  
  /* إشارات الانتباه */
  SIGNALS: [
    { id: 'eyes_here', label: 'العيون هنا', icon: '👀', color: '#0d9488' },
    { id: 'listen_time', label: 'وقت الاستماع', icon: '👂', color: '#0ea5e9' },
    { id: 'discuss_group', label: 'ناقش مع مجموعتك', icon: '💬', color: '#7c3aed' },
    { id: 'start_work', label: 'ابدأ العمل', icon: '✏️', color: '#f97316' },
    { id: 'quiet_time', label: 'وقت الهدوء', icon: '🤫', color: '#10b981' },
    { id: 'time_up', label: 'انتهى الوقت', icon: '⏰', color: '#ef4444' }
  ],
  
  /* الأدوار الصفية */
  ROLES: [
    { id: 'leader', name: 'قائد المجموعة', icon: '👑' },
    { id: 'coordinator', name: 'المنسق', icon: '📋' },
    { id: 'speaker', name: 'المتحدث', icon: '🎤' },
    { id: 'supplies', name: 'مسؤول الأدوات', icon: '🧰' },
    { id: 'recorder', name: 'المقرر', icon: '✍️' },
    { id: 'timekeeper', name: 'حارس الوقت', icon: '⏱️' },
    { id: 'cleaner', name: 'مسؤول النظافة', icon: '🧹' },
    { id: 'helper', name: 'المساعد', icon: '🤝' }
  ],
  
  /* المؤقت — إعدادات جاهزة (بالدقائق) */
  TIMER_PRESETS: [1, 3, 5, 10, 15, 20, 30],
  
  /* رسائل تشجيعية */
  ENCOURAGEMENT_MESSAGES: [
    '🌟 أحسنت!',
    '👏 عمل رائع!',
    '💪 استمر!',
    '🎯 إنجاز مميز!',
    '🏆 أنت بطل!',
    '✨ إبداع حقيقي!',
    '💚 تعاون رائع!',
    '🚀 تقدّم مذهل!',
    '🌱 خطوة في الطريق الصحيح!',
    '🎨 فكرة ملهمة!'
  ],
  
  /* الوضع الليلي */
  THEME_KEY: 'nabd_alsaf_theme',
  
  /* الجلسة */
  SESSION_KEY: 'nabd_alsaf_session',
  CLASS_KEY: 'nabd_alsaf_current_class'

  
};