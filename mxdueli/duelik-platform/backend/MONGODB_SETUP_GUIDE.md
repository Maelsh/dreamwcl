# دليل إعداد قاعدة بيانات MongoDB Atlas - منصة Dueli

## نظرة عامة

هذا الدليل سيساعدك في إعداد قاعدة بيانات MongoDB Atlas حقيقية لاستبدال نظام Mock الحالي في منصة Dueli.

## الخطوات المطلوبة

### 1. إنشاء حساب MongoDB Atlas

1. اذهب إلى [MongoDB Atlas](https://cloud.mongodb.com/)
2. انقر على "Start Free" لإنشاء حساب جديد
3. سجل الدخول باستخدام Google أو GitHub أو إنشاء حساب جديد

### 2. إنشاء مشروع جديد

1. من لوحة التحكم، انقر على "New Project"
2. أدخل اسم المشروع: `Dueli Platform`
3. أضف أعضاء الفريق (اختياري)
4. انقر على "Create Project"

### 3. إنشاء Cluster

1. في لوحة تحكم المشروع، انقر على "Build a Database"
2. اختر الخطة المجانية (Free Tier)
3. اختر مزود السحابة:
   - AWS (مُوصى به)
   - Google Cloud
   - Azure
4. اختر المنطقة الأقرب لك:
   - الشرق الأوسط: `Middle East (Bahrain)` (me-central-1)
   - أوروبا: `Europe (Ireland)` (eu-west-1)
   - آسيا: `Asia Pacific (Singapore)` (ap-southeast-1)
5. اختر اسم Cluster: `Dueli-Cluster`
6. انقر على "Create Cluster"

### 4. إعداد الوصول والأمان

#### إضافة عنوان IP
1. انتظر حتى يتم إنشاء Cluster (2-3 دقائق)
2. من لوحة التحكم، انقر على "Network Access"
3. انقر على "Add IP Address"
4. اختر "Allow access from anywhere" (0.0.0.0/0) للاختبار
5. انقر على "Confirm"

#### إنشاء Database User
1. من لوحة التحكم، انقر على "Database Access"
2. انقر على "Add New Database User"
3. أضف المستخدم:
   - Authentication Method: Password
   - Username: `duelik_user`
   - Password: أنشئ كلمة مرور قوية (مثال: `DueliPass2024!`)
4. Privilege: Built-in role: `Atlas admin`
5. انقر على "Add User"

### 5. الحصول على Connection String

1. من لوحة التحكم، انقر على "Clusters"
2. انقر على "Connect" بجانب اسم Cluster
3. اختر "Connect your application"
4. انسخ Connection String - سيبدو مثل:
   ```
   mongodb+srv://duelik_user:<PASSWORD>@duelik-cluster.abcdef.mongodb.net/duelik?retryWrites=true&w=majority
   ```
5. استبدل `<PASSWORD>` بكلمة المرور التي أنشأتها

### 6. تحديث إعدادات البيئة

1. افتح ملف `backend/.env`
2. ابحث عن السطر `MONGODB_URI=`
3. استبدله بـ Connection String الذي نسخته:
   ```env
   MONGODB_URI=mongodb+srv://duelik_user:كلمة_المرور_هنا@duelik-cluster.abcdef.mongodb.net/duelik?retryWrites=true&w=majority
   ```

### 7. تحديث إعدادات نظام Dueli

في ملف `backend/.env`، تأكد من أن هذه القيم مُحدثة:

```env
SKIP_DB_CONNECTION=false
USE_MOCK_AUTH=false
FRONTEND_URL=http://localhost:8000
```

### 8. تشغيل setup script

أولاً، تأكد من تحديث .env، ثم:

```bash
# انتقل إلى مجلد backend
cd backend

# اختبر الاتصال
node mongodb-setup.js connect-test

# أضف البيانات التجريبية
node mongodb-setup.js seed
```

## البيانات التجريبية المُضافة

بعد تشغيل `seed` command، ستتم إضافة:

### المستخدمين:
- `ahmed@example.com` (Password123!) - منافس
- `fatima@example.com` (Password123!) - منافس  
- `sara@example.com` (Password123!) - مشاهد
- `mohamed@example.com` (Password123!) - منافس
- `admin@duelik.com` (Admin123!) - مدير

### التحديات:
- تطوير تطبيق إدارة المهام (برمجة)
- تصميم شعار هوية بصرية (تصميم)
- كتابة محتوى تسويقي (محتوى)

### التعليقات والتقييمات:
- تعليقات على التحديات
- تقييمات بأرقام من 1-5

## التحقق من الإعداد

### 1. فحص حالة الاتصال
```bash
node mongodb-setup.js connect-test
```

### 2. فحص إحصائيات قاعدة البيانات
```bash
node mongodb-setup.js stats
```

### 3. اختبار API
```bash
# تشغيل الخادم
npm start

# اختبار تسجيل الدخول
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahmed@example.com", "password": "Password123!"}'
```

## المراقبة والصيانة

### Atlas Dashboard
-_monitor database performance and usage
- Set up alerts for connection issues
- Monitor cluster utilization

### Security Best Practices
- Regularly update database passwords
- Restrict IP access to specific IPs for production
- Enable authentication and use strong passwords
- Regular backups (Atlas provides automatic backups)

## استكشاف الأخطاء

### مشاكل الاتصال
1. تأكد من أن IP access مُعد بشكل صحيح
2. تحقق من صحة username و password
3. تأكد من أن cluster يعمل بشكل طبيعي

### مشاكل البيانات
```bash
# مسح جميع البيانات والبدء من جديد
node mongodb-setup.js clear

# إضافة البيانات التجريبية مرة أخرى
node mongodb-setup.js seed
```

## الخطوات التالية

بعد إعداد MongoDB Atlas بنجاح:
1. اختبر جميع وظائف التطبيق
2. أضف بيانات حقيقية بدلاً من التجريبية
3. إعدادات الأمان للإنتاج
4. مراقبة الأداء والاستخدام

## نصائح للإنتاج

### الأمان
- استخدم IP whitelist بدلاً من 0.0.0.0/0
- فعّل SSL/TLS
- استخدم environment variables آمنة
- فعّل Network Encryption

### الأداء
- اختر region الأقرب للمستخدمين
- مراقبة usage وإضافة indexes عند الحاجة
- إعداد cluster sizing مناسب

### النسخ الاحتياطي
- فعّل automated backups
- إعداد retention policy مناسب
- اختبار عمليات الاستعادة