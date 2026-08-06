-- שעון אחד לסנכרון "החדש מנצח":
-- הלקוח כותב updated_at משלו בכל upsert (cloud-storage.ts), אבל טריגר
-- BEFORE UPDATE דרס אותו ב-now() של השרת. התוצאה: השוואת חותמות זמן
-- בין שעון דפדפן לשעון Postgres — מכשיר עם שעון מהיר ניצח כל קונפליקט
-- ודרס בשקט נתונים חדשים ממכשיר אחר.
-- מרגע זה updated_at של user_data הוא באחריות הלקוח בלבד, בשני המסלולים
-- (insert ו-update), כך שההשוואה ב-syncOnLogin נעשית תמיד באותו שעון.
DROP TRIGGER IF EXISTS update_user_data_updated_at ON public.user_data;
