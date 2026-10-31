منصة بوابة الكلية - HTML/CSS/JavaScript + Supabase

التشغيل:
1) أنشئ مشروعاً في https://supabase.com
2) افتح SQL Editor وشغّل كامل ملف supabase/schema.sql
3) من Project Settings > API انسخ Project URL و anon/public key.
4) ضعهما في assets/js/config.js (لا تستخدم service_role مطلقاً).
5) Authentication > Users > Add user: أنشئ حساب المدير ببريد وكلمة مرور.
6) بعد إنشاء المستخدم شغّل في SQL Editor:
   update public.profiles set role='admin'
   where id=(select id from auth.users where email='EMAIL_HERE');
   واستبدل EMAIL_HERE ببريد المدير.
7) ارفع المجلد إلى استضافة صفحات ثابتة، أو للتجربة:
   python -m http.server 8000
   ثم افتح http://localhost:8000/students/

روابط:
الطلبة: /students/index.html
الإدارة: /admin/login.html

استخدم anon/public key فقط. لا تضع service_role في ملفات JavaScript.
النسخة أساس عملي قابل للتطوير، ويجب اختبار إعدادات مشروع Supabase قبل النشر العام.
