# Dueli Platform - MongoDB Atlas Integration Guide

## 🎯 نظرة عامة

هذا الدليل سيساعدك في إعداد قاعدة بيانات MongoDB Atlas حقيقية لتستبدل نظام Mock authentication الحالي في منصة Dueli.

## ⚡ البدء السريع

### 1. إنشاء حساب MongoDB Atlas

```bash
# انتقل إلى موقع MongoDB Atlas
# https://cloud.mongodb.com/
```

### 2. إعداد Connection String

```bash
# الطريقة السريعة باستخدام Node.js
node mongodb-setup.js connect-test

# أو باستخدام Bash script
bash setup-mongodb.sh status
```

### 3. تشغيل Setup

```bash
# تشغيل Setup التفاعلي
node mongodb-setup.js

# أو استخدام npm scripts
npm run db:setup
```

## 📋 الملفات المُضافة

### ملفات Setup الجديدة

| الملف | الوصف |
|------|--------|
| `mongodb-setup.js` | Script شامل لإعداد وإدارة MongoDB |
| `setup-mongodb.sh` | Script Bash سهل الاستخدام |
| `MONGODB_SETUP_GUIDE.md` | دليل مفصل لإعداد MongoDB Atlas |
| `.env.mongodb` | ملف إعدادات نموذجي لـ MongoDB Atlas |

### npm Scripts المُضافة

| Command | الوصف |
|---------|--------|
| `npm run db:setup` | إعداد وتعبئة قاعدة البيانات |
| `npm run db:clear` | مسح جميع البيانات |
| `npm run db:test` | اختبار الاتصال |
| `npm run db:stats` | عرض إحصائيات قاعدة البيانات |
| `npm run mongodb:init` | تشغيل Setup التفاعلي |

## 🏗️ هيكل قاعدة البيانات

### Collections المُضافة

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  fullName: String,
  userType: ['competitor', 'viewer', 'admin', 'moderator'],
  isVerified: Boolean,
  isActive: Boolean,
  statistics: {
    totalChallenges: Number,
    wins: Number,
    losses: Number,
    draws: Number
  },
  preferences: {
    language: String,
    theme: String,
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Challenges Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  type: ['programming', 'design', 'content', 'video', 'photography'],
  category: String,
  prize: Number,
  status: ['open', 'in_progress', 'completed', 'cancelled'],
  createdBy: ObjectId (ref: User),
  participants: [ObjectId],
  deadline: Date,
  rating: {
    average: Number,
    count: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Comments Collection
```javascript
{
  _id: ObjectId,
  content: String,
  type: ['general', 'question', 'suggestion'],
  createdBy: ObjectId (ref: User),
  targetType: ['challenge', 'user', 'comment'],
  targetId: ObjectId,
  likes: Number,
  parentComment: ObjectId (ref: Comment),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Ratings Collection
```javascript
{
  _id: ObjectId,
  rating: Number (1-5),
  createdBy: ObjectId (ref: User),
  targetType: ['challenge', 'user'],
  targetId: ObjectId,
  createdAt: Date
}
```

## 🌱 البيانات التجريبية

### المستخدمين المُضافة

| Email | Username | Password | Type |
|-------|----------|----------|------|
| ahmed@example.com | ahmed_mohamed | Password123! | competitor |
| fatima@example.com | fatima_ahmed | Password123! | competitor |
| sara@example.com | sara_ali | Password123! | viewer |
| mohamed@example.com | mohamed_hassan | Password123! | competitor |
| admin@duelik.com | admin | Admin123! | admin |

### التحديات المُضافة

1. **تطوير تطبيق إدارة المهام** - برمجة - $500
2. **تصميم شعار هوية بصرية** - تصميم - $300
3. **كتابة محتوى تسويقي إبداعي** - محتوى - $200

## 🔧 الأوامر الشائعة

### إعداد قاعدة البيانات
```bash
# الطريقة 1: Setup تلقائي
node mongodb-setup.js seed

# الطريقة 2: npm script
npm run db:setup

# الطريقة 3: Bash script
bash setup-mongodb.sh init "your-connection-string"
```

### إدارة البيانات
```bash
# مسح جميع البيانات
npm run db:clear

# عرض إحصائيات قاعدة البيانات
npm run db:stats

# اختبار الاتصال
npm run db:test
```

### تشغيل النظام
```bash
# تشغيل Backend
cd backend
npm start

# تشغيل Frontend (terminal آخر)
cd ../duelik-platform
npx serve -l 8000

# اختبار التطبيق
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahmed@example.com", "password": "Password123!"}'
```

## 🛠️ التكوين المتقدم

### متغيرات البيئة المُهمة

```env
# MongoDB Settings
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/duelik
SKIP_DB_CONNECTION=false
USE_MOCK_AUTH=false

# Server Settings
PORT=3003
FRONTEND_URL=http://localhost:8000

# JWT Settings
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=1d
```

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster-name>.<cluster-id>.mongodb.net/<database>?retryWrites=true&w=majority
```

مثال:
```
mongodb+srv://duelik_user:DueliPass2024@duelik-cluster.abcdef.mongodb.net/duelik?retryWrites=true&w=majority
```

## 🧪 الاختبار والتحقق

### 1. اختبار قاعدة البيانات
```bash
# اختبار الاتصال
node mongodb-setup.js connect-test

# عرض الإحصائيات
node mongodb-setup.js stats
```

### 2. اختبار APIs
```bash
# تسجيل الدخول
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahmed@example.com", "password": "Password123!"}'

# الحصول على التحديات
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3003/api/challenges
```

### 3. اختبار Frontend
```
# افتح المتصفح على
http://localhost:8000

# استخدم إحدى الحسابات التجريبية:
# ahmed@example.com / Password123!
```

## 🔍 استكشاف الأخطاء

### مشاكل شائعة

#### 1. Connection Failed
```bash
# تحقق من Connection String
bash setup-mongodb.sh status

# تحقق من إعدادات IP Access
# في MongoDB Atlas: Network Access → Add IP Address
```

#### 2. Authentication Failed
```bash
# تحقق من username و password
# في MongoDB Atlas: Database Access
```

#### 3. Data Not Found
```bash
# أضف البيانات التجريبية
node mongodb-setup.js seed

# أو امسح واعد الإنشاء
node mongodb-setup.js clear
node mongodb-setup.js seed
```

### Logs مفيدة
```bash
# عرض logs Backend
tail -f backend/logs/app.log

# عرض logs MongoDB (Atlas Dashboard)
# https://cloud.mongodb.com/ → Your Cluster → Logs
```

## 🚀 الإنتاج (Production)

### إعدادات الأمان
```env
# استخدام SSL
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/duelik?ssl=true&authSource=admin

# IP Whitelist محدد
MONGODB_URI=...

# Environment متغيرات آمنة
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
```

### مراقبة الأداء
```bash
# مراقبة Atlas
# https://cloud.mongodb.com/ → Performance Advisor

# إضافة Indexes عند الحاجة
db.users.createIndex({ "username": 1 })
db.challenges.createIndex({ "createdBy": 1, "status": 1 })
```

## 📞 الدعم

إذا واجهت أي مشاكل:

1. راجع `MONGODB_SETUP_GUIDE.md` للتفاصيل الكاملة
2. تحقق من logs قاعدة البيانات في Atlas Dashboard
3. تأكد من صحة connection string وإعدادات الشبكة
4. تحقق من صحة username و password

## ✅ قائمة التحقق النهائية

- [ ] إنشاء MongoDB Atlas Cluster
- [ ] إعداد IP Access و Database User
- [ ] نسخ Connection String
- [ ] تحديث .env file
- [ ] تشغيل setup script
- [ ] اختبار الاتصال
- [ ] إضافة البيانات التجريبية
- [ ] تشغيل Backend و Frontend
- [ ] اختبار تسجيل الدخول
- [ ] اختبار APIs الأساسية
- [ ] اختبار Frontend التطبيق

## 🎉 النتيجة النهائية

بعد إكمال هذه الخطوات، ستحصل على:

- ✅ قاعدة بيانات MongoDB Atlas حقيقية
- ✅ بيانات تجريبية لاختبار النظام
- ✅ APIs حقيقية تعمل مع قاعدة البيانات
- ✅ نظام مصادقة حقيقي (بدلاً من Mock)
- ✅ جميع ميزات Dueli Platform تعمل بالكامل