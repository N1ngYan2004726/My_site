// 主题切换逻辑
(function() {
  'use strict';
  
  const STORAGE_KEY = 'site-theme';
  
  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }
  
  function setStoredTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  
  function getPreferredTheme() {
    const stored = getStoredTheme();
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  // 初始化主题
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);
  
  // 绑定点击事件 - 立即执行以确保事件监听器被绑定
(function() {
  let toggleBtn = null;
  
  // 通过图标类名查找 (Quarto 生成的按钮结构)
  const icon = document.querySelector('i.bi-circle-half');
  if (icon) {
    toggleBtn = icon.closest('a');
  }
  
  // 备用: 通过 aria-label 查找
  if (!toggleBtn) {
    toggleBtn = document.querySelector('a[aria-label="切换主题"]');
  }
  
  // 备用: 查找导航栏中最后一个带图标的链接
  if (!toggleBtn) {
    const navIcons = document.querySelectorAll('.navbar .nav-link i.bi');
    if (navIcons.length > 0) {
      const lastIcon = navIcons[navIcons.length - 1];
      if (lastIcon.classList.contains('bi-circle-half') || 
          lastIcon.classList.contains('bi-sun') || 
          lastIcon.classList.contains('bi-moon')) {
        toggleBtn = lastIcon.closest('a');
      }
    }
  }
  
  if (toggleBtn) {
    toggleBtn.id = 'theme-toggle'; // 确保设置 ID 以便样式应用
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const isDark = document.documentElement.classList.contains('dark');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      setStoredTheme(newTheme);
    });
  }
})();
