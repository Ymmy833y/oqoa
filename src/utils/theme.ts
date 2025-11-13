export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

/**
 * Retrieves the current theme from localStorage.
 * If not set, returns 'dark' or 'light' based on the browser's color scheme.
 * @returns {Theme} 'dark' or 'light'
 */
export function getCurrentTheme() {
  const storedTheme = localStorage.getItem('editorTheme');
  if (storedTheme) {
    return storedTheme === 'dark' ? Theme.DARK : Theme.LIGHT;
  } else {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  }
}

/**
 * Saves the given theme to localStorage.
 * @param {Theme} theme - 'dark' or 'light'
 */
export function setCurrentTheme(theme: Theme) {
  localStorage.setItem('editorTheme', theme);
  applyGlobalTheme(theme);
}

/**
 * Toggles the stored theme between 'dark' and 'light'
 * and returns the updated theme.
 */
export function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  setCurrentTheme(newTheme);
  return newTheme;
}

/**
 * Applies the given theme globally.
 * If the theme is 'dark', adds the 'dark' class to the <html> element;
 * otherwise, removes it.
 * This is useful for Tailwind CSS dark mode.
 * @param {Theme} theme - 'dark' or 'light'
 */
export function applyGlobalTheme(theme: Theme) {
  if (theme === Theme.DARK) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

setCurrentTheme(getCurrentTheme());
