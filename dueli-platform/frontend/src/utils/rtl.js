export const isRTL = (language) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

export const getDirection = (language) => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

export const applyDirection = (language) => {
  const direction = getDirection(language);
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', language);
  
  // Apply RTL styles if needed
  if (direction === 'rtl') {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
};