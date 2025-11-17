# دليل التشغيل السريع - منصة ديلوك
## Dueli Platform - Quick Start Guide

### 🚀 النظام يعمل الآن بنجاح!

**حالة الخوادم:**
- ✅ Backend Server: http://localhost:3003
- ✅ Frontend Server: http://localhost:8000
- ✅ MongoDB: Mock Mode (مؤقتاً)

### 🔑 بيانات الدخول التجريبية:
```
Email: testuser123@example.com
Password: TestPassword123!
```

### 🧪 اختبار سريع:
```bash
# اختبار API
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser123@example.com", "password": "TestPassword123!"}'

# اختبار التحديات
curl -X GET http://localhost:3003/api/challenges
```

### 🌐 اختبار من المتصفح:
افتح المتصفح وانتقل إلى: **http://localhost:8000**

### 🔧 إعادة تشغيل المنصة:
```bash
# شغل الخوادم مرة أخرى
cd /workspace/duelik-platform/backend && npm start &
cd /workspace/duelik-platform && npx serve -l 8000
```

---

## 📋 إعداد MongoDB Atlas الحقيقي:

### المشكلة في الـ Connection String:
الـ connection string الذي قدمته يحتوي على:
```
mongodb+srv://duelik_admin:YourPassword123@cluster0.xxxxx.mongodb.net/duelik
```

المشكلة: يحتوي على `xxxxx` وهو placeholder، وليس العنوان الحقيقي.

### خطوات الحصول على الـ Connection String الصحيح:

1. **اذهب إلى:** https://cloud.mongodb.com/
2. **اختر مشروعك أو أنشئ مشروع جديد**
3. **انقر على "Connect" بجوار الـ Cluster**
4. **اختر "Connect your application"**
5. **انسخ الـ Connection String الحقيقي**

يجب أن يكون بالتنسيق:
```
mongodb+srv://username:password@cluster-name.mongodb.net/database?retryWrites=true&w=majority
```

### 🔧 إعداد MongoDB الحقيقي:
```bash
cd /workspace/duelik-platform/backend
node setup-mongodb-interactively.js
```

ثم اختر "1" للـ Quick Setup وأدخل الـ connection string الحقيقي.

---

## 🏗️ تشغيل المنصة على سيرفرك الخاص:

### 1. تحميل المشروع:
```bash
# انسخ جميع الملفات إلى سيرفرك
scp -r duelik-platform/ user@your-server:/home/user/
```

### 2. تثبيت Node.js والمكتبات:
```bash
# تثبيت Node.js (إذا لم يكن مثبتاً)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت المكتبات
cd duelik-platform/backend && npm install
cd ../duelik-platform && npm install
```

### 3. إعداد MongoDB:

#### الخيار أ: MongoDB Atlas (مستحسن)
- أنشئ حساب MongoDB Atlas
- أنشئ Database وقاعدة بيانات
- احصل على connection string
- شغل: `node setup-mongodb-interactively.js`

#### الخيار ب: MongoDB محلي
```bash
# تثبيت MongoDB
sudo apt install mongodb

# تشغيل MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# تحديث .env
MONGODB_URI=mongodb://localhost:27017/duelik
SKIP_DB_CONNECTION=false
USE_MOCK_AUTH=false
```

### 4. إعداد متغيرات البيئة:
```bash
# أنشئ ملف .env
cp .env.mongodb .env
nano .env  # عدّل البيانات
```

### 5. تشغيل الخوادم:

#### الطريقة أ: PM2 (للمشروع الإنتاجي)
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل الخوادم
pm2 start backend/server.js --name "duelik-backend" -p 3003
pm2 start "npx serve -l 8000" --name "duelik-frontend" --cwd ./duelik-platform

# حفظ إعدادات PM2
pm2 save
pm2 startup
```

#### الطريقة ب: تشغيل عادي
```bash
# Terminal 1 - Backend
cd duelik-platform/backend && npm start

# Terminal 2 - Frontend
cd duelik-platform && npx serve -l 8000
```

#### الطريقة ج: خدمة systemd
```bash
# أنشئ ملف خدمة للـ Backend
sudo nano /etc/systemd/system/duelik-backend.service

# أضف المحتوى:
[Unit]
Description=Duelik Backend Server
After=network.target

[Service]
User=www-data
WorkingDirectory=/home/user/duelik-platform/backend
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target

# فعّل الخدمة
sudo systemctl daemon-reload
sudo systemctl enable duelik-backend
sudo systemctl start duelik-backend
```

### 6. إعداد Nginx (Proxy):
```bash
sudo nano /etc/nginx/sites-available/duelik
```

أضف:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# فعّل الموقع
sudo ln -s /etc/nginx/sites-available/duelik /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. إعداد HTTPS (SSL):
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com
```

### 8. إعدادات الأمان:
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# إعداد firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

---

## 🐳 Docker (بديل سهل):

### إنشاء Dockerfile:
```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3003
CMD ["npm", "start"]

# Frontend
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
EXPOSE 8000
CMD ["npx", "serve", "-l", "8000"]
```

### تشغيل Docker:
```bash
docker-compose up -d
```

---

## 🔍 استكشاف الأخطاء:

### فحص حالة الخوادم:
```bash
# حالة Backend
curl http://localhost:3003/api/health

# حالة Frontend
curl http://localhost:8000
```

### فحص السجلات:
```bash
# PM2 logs
pm2 logs duelik-backend
pm2 logs duelik-frontend

# أو
journalctl -u duelik-backend -f
```

### فحص المنافذ:
```bash
sudo netstat -tlnp | grep :3003
sudo netstat -tlnp | grep :8000
```

---

## 📞 الدعم الفني:

إذا واجهت أي مشاكل:
1. تأكد من تشغيل جميع الخدمات
2. فحص السجلات للأخطاء
3. تأكد من إعدادات .env
4. تحقق من اتصال الإنترنت

---

**✅ المنصة جاهزة للاستخدام الآن على: http://localhost:8000**
