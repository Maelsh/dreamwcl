# Internationalization (i18n) Documentation

## Overview

The Dueli platform implements comprehensive internationalization (i18n) support with RTL (Right-to-Left) language capabilities. The system supports multiple languages with a primary focus on English and Arabic, but is designed to be easily extensible for additional languages.

## Features

- **Multi-language Support**: English and Arabic with extensible architecture
- **RTL Language Support**: Full RTL layout and styling for Arabic and other RTL languages
- **Dynamic Language Switching**: Real-time language switching without page reload
- **Automatic Language Detection**: Browser-based language detection with localStorage persistence
- **Translation Management**: Organized translation files with nested structure
- **Date/Time Localization**: Locale-aware date and time formatting
- **Number Formatting**: Locale-aware number and currency formatting
- **Accessibility**: Screen reader friendly with proper ARIA labels

## Architecture

### Core Libraries

- **react-i18next**: React integration for i18next
- **i18next**: Core internationalization framework
- **i18next-browser-languagedetector**: Automatic language detection
- **i18next-http-backend**: Load translations from files

### File Structure

```
frontend/
├── public/
│   └── locales/
│       ├── en/
│       │   └── translation.json
│       └── ar/
│           └── translation.json
├── src/
│   ├── i18n.js                 # i18n configuration
│   ├── contexts/
│   │   └── LanguageContext.js  # Language context provider
│   ├── utils/
│   │   ├── rtl.js             # RTL utilities
│   │   └── i18n-test.js       # Test utilities
│   ├── styles/
│   │   └── rtl.css            # RTL-specific styles
│   └── components/
│       └── Navbar.js          # Language selector component
└── I18N_DOCUMENTATION.md      # This file
```

## Implementation Details

### 1. i18n Configuration

The main configuration is in `src/i18n.js`:

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: { 
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });
```

### 2. RTL Utilities

The `src/utils/rtl.js` file provides RTL detection and utilities:

```javascript
export const isRTL = (language) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

export const getDirection = (language) => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

export const applyRTL = (language) => {
  document.body.dir = getDirection(language);
  document.documentElement.lang = language;
};
```

### 3. Language Context

The `src/contexts/LanguageContext.js` provides global language state:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { applyRTL } from '../utils/rtl';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
    applyRTL(language);
  };

  useEffect(() => {
    applyRTL(currentLanguage);
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
```

### 4. Translation Files

#### English (`public/locales/en/translation.json`)

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "login": "Login",
    "register": "Register"
  },
  "home": {
    "heroTitle": "Debate, Compete, Earn",
    "heroSubtitle": "Join the world's most transparent debate platform"
  }
}
```

#### Arabic (`public/locales/ar/translation.json`)

```json
{
  "common": {
    "loading": "جاري التحميل...",
    "error": "خطأ",
    "success": "نجاح",
    "login": "تسجيل الدخول",
    "register": "التسجيل"
  },
  "home": {
    "heroTitle": "ناقش، تنافس، اربح",
    "heroSubtitle": "انضم إلى أكثر منصة مناظرة شفافية في العالم"
  }
}
```

### 5. RTL Styles

The `src/styles/rtl.css` file contains comprehensive RTL styling rules:

```css
/* RTL (Right-to-Left) Support Styles */
[dir="rtl"] {
  text-align: right;
}

/* Margin utilities for RTL */
[dir="rtl"] .ml-auto {
  margin-left: 0;
  margin-right: auto;
}

[dir="rtl"] .mr-auto {
  margin-right: 0;
  margin-left: auto;
}

/* Text alignment utilities */
[dir="rtl"] .text-left {
  text-align: right;
}

[dir="rtl"] .text-right {
  text-align: left;
}

/* Flexbox utilities */
[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}

[dir="rtl"] .space-x-2 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 1;
  margin-right: calc(0.5rem * var(--tw-space-x-reverse));
  margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
}
```

## Usage in Components

### Basic Translation

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.heroTitle')}</h1>
      <p>{t('home.heroSubtitle')}</p>
    </div>
  );
};
```

### With Interpolation

```javascript
const WelcomeMessage = ({ userName }) => {
  const { t } = useTranslation();
  
  return (
    <p>{t('admin.welcomeAdmin', { name: userName })}</p>
  );
};
```

### With RTL Support

```javascript
import { useLanguage } from '../contexts/LanguageContext';
import { isRTL } from '../utils/rtl';

const MyComponent = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  return (
    <div className={isRTL(currentLanguage) ? 'text-right' : 'text-left'}>
      <h1>{t('profile.fullName')}</h1>
    </div>
  );
};
```

## Language Selector Component

The language selector in the Navbar component:

```javascript
import { useLanguage } from '../contexts/LanguageContext';
import { GlobeIcon } from '@heroicons/react/24/outline';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];
  
  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Testing

### Translation Tests

Run the translation test suite:

```javascript
import { runAllTests } from './utils/i18n-test';

// In development mode
if (process.env.NODE_ENV === 'development') {
  runAllTests();
}
```

### Manual Testing

1. **Language Switching**: Test switching between English and Arabic
2. **RTL Layout**: Verify that Arabic content displays right-to-left
3. **Date Formatting**: Check that dates are formatted correctly for each locale
4. **Number Formatting**: Verify number and currency formatting
5. **Form Inputs**: Test RTL text input in forms
6. **Navigation**: Ensure navigation works correctly in RTL mode

## Best Practices

### 1. Translation Key Organization

- Use nested objects for better organization
- Group related translations together
- Use descriptive key names
- Maintain consistent naming conventions

```json
{
  "page": {
    "section": {
      "element": "Translation"
    }
  }
}
```

### 2. RTL Considerations

- Always check language direction before applying styles
- Use utility functions for margin/padding adjustments
- Test thoroughly with RTL languages
- Consider text overflow and wrapping

### 3. Performance

- Load translations asynchronously
- Cache translations in localStorage
- Use lazy loading for large translation files
- Optimize bundle size by splitting translations

### 4. Accessibility

- Maintain proper ARIA labels
- Ensure screen reader compatibility
- Test with assistive technologies
- Provide fallback content

## Extending for New Languages

### 1. Add Translation Files

Create new language files in `public/locales/`:

```
public/locales/
├── fr/
│   └── translation.json
├── es/
│   └── translation.json
└── de/
    └── translation.json
```

### 2. Update RTL Utilities

Add new RTL languages to the `rtlLanguages` array in `src/utils/rtl.js`:

```javascript
const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi'];
```

### 3. Update Language Selector

Add new languages to the language selector component:

```javascript
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];
```

### 4. Test Thoroughly

- Verify all translations are complete
- Test RTL functionality if applicable
- Check date/number formatting
- Ensure consistent UI across languages

## Troubleshooting

### Common Issues

1. **Translations not loading**: Check file paths and network requests
2. **RTL not working**: Verify CSS rules and body direction attribute
3. **Language not persisting**: Check localStorage and detection order
4. **Interpolation errors**: Ensure correct parameter names in translations

### Debug Mode

Enable debug mode in development:

```javascript
i18n.init({
  debug: process.env.NODE_ENV === 'development',
  // ... other options
});
```

## Conclusion

The i18n implementation provides a robust foundation for multi-language support with RTL capabilities. The modular architecture makes it easy to add new languages and maintain translations. Regular testing and following best practices will ensure a smooth user experience across all supported languages.

For questions or issues, refer to the [react-i18next documentation](https://react.i18next.com/) or create an issue in the project repository.