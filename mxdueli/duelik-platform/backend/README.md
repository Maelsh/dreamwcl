# Backend API - منصة Dueli

## نظرة عامة
Backend API كامل لمنصة Dueli للمنافسات التفاعلية، مبني باستخدام Node.js، Express.js، MongoDB، و Socket.IO.

## المميزات

### 🔐 نظام المصادقة
- تسجيل الدخول والخروج
- تسجيل مستخدم جديد
- إعادة تعيين كلمة المرور
- تحديث كلمة المرور
- التحقق من البريد الإلكتروني
- JWT Tokens مع Refresh Token
- الحماية من Brute Force attacks
- Lock Account مؤقت بعد محاولات فاشلة

### 👥 إدارة المستخدمين
- ملفات شخصية قابلة للتخصيص
- رفع وحذف الصور الشخصية
- نظام المتابعة/إلغاء المتابعة
- إعدادات الخصوصية
- الإحصائيات الشخصية
- البحث في المستخدمين

### 🏆 نظام المنافسات
- إنشاء منافسات جديدة
- جدولة المنافسات
- إدارة المتنافسين
- فئات فرعية متنوعة
- إعدادات التوقيت والقواعد
- البث المباشر

### ⭐ نظام التقييمات
- تقييمات فورية أثناء المنافسة
- تقييمات بعد انتهاء المنافسة
- فئات تقييم متعددة
- نظام التحقق من التقييمات
- حماية من التلاعب

### 💬 نظام التعليقات
- التعليقات المباشرة أثناء المنافسة
- نظام الردود
- التفاعل (إعجاب/عدم إعجاب)
- إشراف المحتوى
- البحث في التعليقات

### 📊 نظام البلاغات
- بلاغات على المستخدمين والمحتوى
- تصنيف البلاغات
- إدارة المشرفين للبلاغات
- تتبع الإجراءات المتخذة

### 💰 النظام المالي
- تتبع الأرباح
- طلبات السحب
- معالجة المدفوعات
- الرسوم والإحصائيات
- التوافق مع أنظمة دفع متعددة

### ⚙️ إعدادات النظام
- إعدادات عامة
- إعدادات الأمان
- إعدادات الأداء
- إشارات الميزات

## المتطلبات التقنية

### البرمجيات المطلوبة
- Node.js (الإصدار 18 أو أحدث)
- MongoDB (الإصدار 5.0 أو أحدث)
- Redis (اختياري - للـ caching)
- npm أو yarn

### متطلبات النظام
- ذاكرة: 1GB RAM على الأقل
- مساحة تخزين: 5GB على الأقل
- معالج: CPU ثنائي النواة على الأقل

## التثبيت والإعداد

### 1. تثبيت التبعيات
```bash
cd backend
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env
# تحرير ملف .env وإعداد المتغيرات المطلوبة
```

### 3. إعداد قاعدة البيانات
```bash
# تشغيل MongoDB
mongod

# أو استخدام MongoDB Atlas السحابي
# تحديث MONGODB_URI في ملف .env
```

### 4. تشغيل الخادم
```bash
# للتطوير
npm run dev

# للإنتاج
npm start
```

## البنية المعمارية

```
backend/
├── config/              # ملفات التكوين
│   ├── database.js      # إعداد MongoDB
│   ├── socket.js        # إعداد WebSocket
│   └── logger.js        # إعداد التسجيل
├── controllers/         # منطق الأعمال (سيتم إنشاؤه)
├── middleware/          # Middleware functions
│   ├── auth.js          # المصادقة
│   ├── errorHandler.js  # معالجة الأخطاء
│   └── validateRequest.js # التحقق من البيانات
├── models/              # نماذج MongoDB
│   ├── User.js          # نموذج المستخدم
│   ├── Challenge.js     # نموذج المنافسة
│   ├── Rating.js        # نموذج التقييم
│   ├── Comment.js       # نموذج التعليق
│   ├── Report.js        # نموذج البلاغ
│   ├── Finance.js       # نموذج المالية
│   └── SystemSettings.js # نموذج الإعدادات
├── routes/              # API Routes
│   ├── auth.js          # مسارات المصادقة
│   ├── users.js         # مسارات المستخدمين
│   ├── challenges.js    # مسارات المنافسات (سيتم إنشاؤه)
│   ├── ratings.js       # مسارات التقييمات (سيتم إنشاؤه)
│   ├── comments.js      # مسارات التعليقات (سيتم إنشاؤه)
│   ├── reports.js       # مسارات البلاغات (سيتم إنشاؤه)
│   ├── finances.js      # مسارات المالية (سيتم إنشاؤه)
│   └── system.js        # مسارات النظام (سيتم إنشاؤه)
├── utils/               # Utilities
│   ├── email.js         # إرسال البريد الإلكتروني
│   ├── upload.js        # رفع الملفات
│   └── validation.js    # دوال التحقق
├── logs/                # ملفات السجلات
├── uploads/             # الملفات المرفوعة
├── server.js            # الخادم الرئيسي
└── package.json         # تبعيات المشروع
```

## API Documentation

### المصادقة
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `POST /api/auth/refresh-token` - تجديد الرمز المميز
- `POST /api/auth/forgot-password` - نسيان كلمة المرور
- `PATCH /api/auth/reset-password/:token` - إعادة تعيين كلمة المرور
- `PATCH /api/auth/change-password` - تغيير كلمة المرور
- `GET /api/auth/me` - معلومات المستخدم الحالي

### المستخدمون
- `GET /api/users/profile` - عرض الملف الشخصي
- `PATCH /api/users/profile` - تحديث الملف الشخصي
- `POST /api/users/avatar` - رفع صورة شخصية
- `DELETE /api/users/avatar` - حذف الصورة الشخصية
- `POST /api/users/:id/follow` - متابعة/إلغاء متابعة مستخدم
- `GET /api/users/:id/followers` - قائمة المتابعين
- `GET /api/users/:id/following` - قائمة المتابَعين
- `GET /api/users/search` - البحث في المستخدمين
- `PATCH /api/users/preferences` - تحديث التفضيلات
- `DELETE /api/users/account` - حذف الحساب

### المنافسات (سيتم إنشاؤها)
- `GET /api/challenges` - قائمة المنافسات
- `POST /api/challenges` - إنشاء منافسة جديدة
- `GET /api/challenges/:id` - تفاصيل منافسة
- `PATCH /api/challenges/:id` - تحديث منافسة
- `DELETE /api/challenges/:id` - حذف منافسة
- `POST /api/challenges/:id/join` - الانضمام لمنافسة
- `POST /api/challenges/:id/start` - بدء منافسة
- `POST /api/challenges/:id/end` - إنهاء منافسة

## WebSocket Events

### المصادقة
- `authentication` - مصادقة الاتصال

### المنافسات
- `join_challenge` - الانضمام لمنافسة
- `leave_challenge` - الخروج من منافسة
- `competition_update` - تحديث حالة المنافسة
- `viewer_count_update` - تحديث عدد المشاهدين

### التفاعل
- `send_message` - إرسال رسالة
- `submit_vote` - إرسال تقييم
- `user_status` - تحديث حالة المستخدم

### الإدارة
- `admin_command` - أوامر المشرف

## الأمان

### حماية البيانات
- تشفير كلمات المرور باستخدام bcrypt
- Token-based authentication مع JWT
- Input validation و sanitization
- Rate limiting للحماية من DDoS
- CORS configuration
- Helmet.js للأمان

### إشراف المحتوى
- Auto-moderation للمحتوى المشبوه
- نظام البلاغات
- مراجعة المشرفين للمحتوى المبلغ عنه

## المراقبة والتسجيل

### ملفات السجلات
- `combined.log` - جميع العمليات
- `error.log` - الأخطاء فقط
- `exceptions.log` - الاستثناءات
- `rejections.log` - الـ Promise rejections

### المراقبة
- Health checks
- Performance monitoring
- Error tracking
- User activity logging

## التطوير والاختبار

###_environmentات
- `development` - للتطوير
- `production` - للإنتاج
- `staging` - للاختبار

### الاختبارات
```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات مخصصة
npm run test:unit
npm run test:integration
npm run test:api
```

## النشر

### Docker
```bash
# بناء الصورة
docker build -t duelik-backend .

# تشغيل الحاوية
docker run -p 3001:3001 duelik-backend
```

### PM2 (Production)
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name "duelik-backend"

# مراقبة التطبيق
pm2 monit
```

## المساهمة

### دليل التطوير
1. إنشاء branch جديد
2. كتابة الكود مع التوثيق
3. إضافة الاختبارات
4. التأكد من اجتياز جميع الاختبارات
5. إرسال Pull Request

### معايير الكود
- استخدام ESLint
- تسمية المتغيرات والدوال بوضوح
- إضافة تعليقات للكود المعقد
- الالتزام بـ RESTful conventions

## الدعم الفني

### المشاكل الشائعة
1. **خطأ في الاتصال بقاعدة البيانات**
   - التأكد من تشغيل MongoDB
   - فحص MONGODB_URI في ملف .env

2. **مشاكل في المصادقة**
   - فحص JWT_SECRET في ملف .env
   - التأكد من صحة الرموز المميزة

3. **مشاكل في رفع الملفات**
   - فحص صلاحيات مجلد uploads
   - التأكد من إعدادات multer

### السجلات والمراقبة
- فحص ملفات السجلات في مجلد `logs/`
- استخدام MongoDB Compass للمراقبة
- مراقبة استخدام الذاكرة والمعالج

## الترخيص
هذا المشروع مرخص تحت رخصة MIT. راجع ملف LICENSE للتفاصيل.

## الفريق
تم تطوير هذا المشروع بواسطة فريق MiniMax Agent

---

**ملاحظة**: هذا Backend API يوفر جميع الوظائف الأساسية لمنصة Dueli. يمكن توسيعه وإضافة مميزات جديدة حسب الحاجة.