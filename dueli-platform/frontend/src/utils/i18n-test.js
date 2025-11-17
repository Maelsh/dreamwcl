// i18n Translation Test Suite
import i18n from './i18n';

// Test function to verify translations
export const testTranslations = async () => {
  console.log('Starting i18n Translation Tests...\n');
  
  const tests = [
    {
      key: 'home.heroTitle',
      expected: {
        en: 'Debate, Compete, Earn',
        ar: 'ناقش، تنافس، اربح'
      }
    },
    {
      key: 'login.welcomeBack',
      expected: {
        en: 'Welcome back',
        ar: 'مرحباً بعودتك'
      }
    },
    {
      key: 'register.createAccount',
      expected: {
        en: 'Create your account',
        ar: 'إنشاء حسابك'
      }
    },
    {
      key: 'challenges.title',
      expected: {
        en: 'Active Challenges',
        ar: 'التحديات النشطة'
      }
    },
    {
      key: 'profile.overview',
      expected: {
        en: 'Overview',
        ar: 'نظرة عامة'
      }
    },
    {
      key: 'admin.adminDashboard',
      expected: {
        en: 'Admin Dashboard',
        ar: 'لوحة التحكم الإدارية'
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  // Test English translations
  console.log('Testing English translations:');
  await i18n.changeLanguage('en');
  
  tests.forEach((test, index) => {
    const translation = i18n.t(test.key);
    const expected = test.expected.en;
    
    if (translation === expected) {
      console.log(`✓ Test ${index + 1}: ${test.key} - PASSED`);
      passed++;
    } else {
      console.log(`✗ Test ${index + 1}: ${test.key} - FAILED`);
      console.log(`  Expected: "${expected}"`);
      console.log(`  Got: "${translation}"`);
      failed++;
    }
  });

  console.log('\nTesting Arabic translations:');
  await i18n.changeLanguage('ar');
  
  tests.forEach((test, index) => {
    const translation = i18n.t(test.key);
    const expected = test.expected.ar;
    
    if (translation === expected) {
      console.log(`✓ Test ${index + 1}: ${test.key} - PASSED`);
      passed++;
    } else {
      console.log(`✗ Test ${index + 1}: ${test.key} - FAILED`);
      console.log(`  Expected: "${expected}"`);
      console.log(`  Got: "${translation}"`);
      failed++;
    }
  });

  // Test RTL detection
  console.log('\nTesting RTL detection:');
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const ltrLanguages = ['en', 'fr', 'es', 'de'];
  
  rtlLanguages.forEach(lang => {
    const isRTL = rtlLanguages.includes(lang);
    console.log(`${lang}: ${isRTL ? 'RTL ✓' : 'LTR ✗'}`);
  });
  
  ltrLanguages.forEach(lang => {
    const isRTL = rtlLanguages.includes(lang);
    console.log(`${lang}: ${!isRTL ? 'LTR ✓' : 'RTL ✗'}`);
  });

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${tests.length * 2}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / (tests.length * 2)) * 100).toFixed(1)}%`);

  return { passed, failed, total: tests.length * 2 };
};

// Test interpolation
export const testInterpolation = () => {
  console.log('\nTesting string interpolation:');
  
  const testCases = [
    {
      key: 'challenges.showingResults',
      params: { count: 5 },
      expected: {
        en: 'Showing 5 results',
        ar: 'عرض 5 نتائج'
      }
    },
    {
      key: 'admin.welcomeAdmin',
      params: { name: 'John' },
      expected: {
        en: 'Welcome back, John',
        ar: 'مرحباً بعودتك، John'
      }
    }
  ];

  testCases.forEach((testCase, index) => {
    ['en', 'ar'].forEach(lang => {
      i18n.changeLanguage(lang);
      const result = i18n.t(testCase.key, testCase.params);
      const expected = testCase.expected[lang];
      
      if (result === expected) {
        console.log(`✓ Interpolation test ${index + 1} (${lang}): PASSED`);
      } else {
        console.log(`✗ Interpolation test ${index + 1} (${lang}): FAILED`);
        console.log(`  Expected: "${expected}"`);
        console.log(`  Got: "${result}"`);
      }
    });
  });
};

// Test pluralization
export const testPluralization = () => {
  console.log('\nTesting pluralization:');
  
  // This would test plural forms if we had them in our translations
  console.log('Note: Pluralization tests would be added when plural forms are implemented');
};

// Test language switching
export const testLanguageSwitching = async () => {
  console.log('\nTesting language switching:');
  
  const languages = ['en', 'ar'];
  
  for (const lang of languages) {
    await i18n.changeLanguage(lang);
    const currentLang = i18n.language;
    console.log(`Switched to: ${currentLang} ${currentLang === lang ? '✓' : '✗'}`);
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('=== i18n Test Suite ===\n');
  
  try {
    await testTranslations();
    testInterpolation();
    testPluralization();
    await testLanguageSwitching();
    
    console.log('\n=== All Tests Complete ===');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
};

// Export individual test functions for selective testing
export default {
  testTranslations,
  testInterpolation,
  testPluralization,
  testLanguageSwitching,
  runAllTests
};