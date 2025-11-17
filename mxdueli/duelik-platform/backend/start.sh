#!/bin/bash

echo "🚀 بدء تشغيل خادم Dueli Backend..."

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً."
    exit 1
fi

# التحقق من npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت. يرجى تثبيت npm أولاً."
    exit 1
fi

# التحقق من وجود package.json
if [ ! -f "package.json" ]; then
    echo "❌ ملف package.json غير موجود."
    exit 1
fi

# تثبيت التبعيات إذا لم تكن مثبتة
echo "📦 تثبيت التبعيات..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ فشل في تثبيت التبعيات."
    exit 1
fi

# التحقق من وجود ملف .env
if [ ! -f ".env" ]; then
    echo "⚠️  ملف .env غير موجود. جاري إنشاؤه من النموذج..."
    cp .env.example .env
    echo "✅ تم إنشاء ملف .env. يرجى تعديل الإعدادات حسب حاجتك."
fi

# التحقق من MongoDB
echo "🗄️  التحقق من قاعدة البيانات..."

# محاولة الاتصال بـ MongoDB المحلي
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.runCommand('ping')" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB يعمل محلياً."
    else
        echo "⚠️  MongoDB المحلي غير متاح. تأكد من تشغيله أو استخدم MongoDB Atlas."
    fi
elif command -v mongo &> /dev/null; then
    mongo --eval "db.runCommand('ping')" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB يعمل محلياً."
    else
        echo "⚠️  MongoDB المحلي غير متاح. تأكد من تشغيله أو استخدم MongoDB Atlas."
    fi
else
    echo "⚠️  أدوات MongoDB CLI غير مثبتة. تأكد من تشغيل MongoDB أو إعداد الاتصال في .env"
fi

# إنشاء مجلدات الضرورية
echo "📁 إنشاء المجلدات الضرورية..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

echo "🔧 إعدادات البيئة:"
echo "   - البيئة: ${NODE_ENV:-development}"
echo "   - المنفذ: ${PORT:-3001}"
echo "   - قاعدة البيانات: ${MONGODB_URI:-mongodb://localhost:27017/duelik}"

echo ""
echo "🌟 الخيارات المتاحة:"
echo "   1. تشغيل الخادم: npm start"
echo "   2. تشغيل في وضع التطوير: npm run dev"
echo "   3. تشغيل الاختبارات: npm test"
echo "   4. إنشاء نسخة احتياطية من قاعدة البيانات: npm run backup"
echo ""

# تشغيل الخادم
echo "🚀 بدء تشغيل الخادم..."
npm run dev