
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
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('quarto-dark');
      document.body.classList.remove('quarto-light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-bs-theme', 'light');
      document.body.classList.remove('quarto-dark');
      document.body.classList.add('quarto-light');
    }
  }
  
  // 查找主题切换按钮的多种方式
  function findToggleButton() {
    // 方式1: 通过图标类名查找
    const icon = document.querySelector('i.bi-circle-half, .bi-circle-half');
    if (icon) {
      const btn = icon.closest('a');
      if (btn) return btn;
    }
    
    // 方式2: 通过 aria-label 查找
    const btnByLabel = document.querySelector('[aria-label="切换主题"], [aria-label="Toggle theme"]');
    if (btnByLabel) return btnByLabel;
    
    // 方式3: 通过 data-theme-toggle 属性查找
    const btnByAttr = document.querySelector('[data-theme-toggle]');
    if (btnByAttr) return btnByAttr;
    
    // 方式4: 查找导航栏中包含 circle-half 图标的链接
    const navLinks = document.querySelectorAll('.navbar a.nav-link');
    for (const link of navLinks) {
      if (link.querySelector('.bi-circle-half') || link.querySelector('i[class*="circle"]')) {
        return link;
      }
    }
    
    return null;
  }
  
  // 绑定点击事件
  function bindToggleButton() {
    const toggleBtn = findToggleButton();
    if (toggleBtn) {
      toggleBtn.id = 'theme-toggle';
      // 移除可能的默认行为
      toggleBtn.setAttribute('href', '#');
      
      toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
        setStoredTheme(newTheme);
        // 触发自定义事件以便其他组件响应
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
      });
      
      return true;
    }
    return false;
  }
  
  // 初始化主题
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);
  setStoredTheme(initialTheme);
  
  // 立即尝试绑定
  if (!bindToggleButton()) {
    // 如果立即绑定失败，等待DOM加载完成后重试
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindToggleButton);
    } else {
      // 延迟一点时间后重试
      setTimeout(bindToggleButton, 100);
    }
  }
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!getStoredTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
})();
