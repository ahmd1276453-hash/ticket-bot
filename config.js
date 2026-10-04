module.exports = {
  // آيدي رتبة المشرفين / الإدارة
  staffRoleId: '1556305058927218779',

  // آيدي الكاتيجوري التي تُفتح فيها التذاكر (اختياري: اتركه فارغاً '' ليتم إنشاؤها خارج الكاتيجوري)
  categoryId: '',

  // قائمة التخصصات واختباراتها
  specializations: [
    {
      id: 'cleaner',
      label: 'التبييض',
      description: 'الاختبار مكون من 4 صور، المطلوب تنفيذ صورتين منهما.',
      duration: '3 ساعات',
      testUrl: 'https://drive.google.com/drive/folders/1xfrsEi3Cdg8_oZX6qr26-LM_jfzTgN88',
    },
    {
      id: 'typesetter',
      label: 'التحرير',
      description: 'اختبار التحرير والتنسيق الخطوط.',
      duration: '6 ساعات',
      testUrl: 'https://drive.google.com/drive/folders/1SRFLLfow1hwEBy26evxOT26q-vYnQkcN',
    },
    {
      id: 'korean_translator',
      label: 'الترجمة الكورية',
      description: 'اختبار الترجمة من اللغة الكورية إلى العربية.',
      duration: '4 ساعات',
      testUrl: 'https://drive.google.com/drive/folders/17-FETUE1NHbvrcGRBXRfEjWIA8SKXmEp',
    },
    {
      id: 'english_translator',
      label: 'الترجمة الإنجليزية',
      description: 'اختبار الترجمة من اللغة الإنجليزية إلى العربية.',
      duration: 'ساعتين',
      testUrl: 'https://drive.google.com/drive/folders/1K7CHG4U6VvNiUHznNtsB8uQhtA-O4-bF',
    },
  ],
};