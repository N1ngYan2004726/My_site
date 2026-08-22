
/**
 * Image Lightbox v2.0
 * Features:
 *   - Click any image in main.content to zoom
 *   - Wheel/pinch zoom, drag pan, double-tap toggle
 *   - Swipe gestures, keyboard nav, ESC close
 *   - Loading spinner, zoom indicator, image counter
 */
(function() {
  'use strict';

  var modal = null;
  var modalImg = null;
  var overlay = null;
  var closeBtn = null;
  var zoomIndicator = null;
  var counter = null;
  var loadingSpinner = null;

  var images = [];
  var currentIndex = 0;
  var scale = 1;
  var translateX = 0;
  var translateY = 0;
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragStartTranslateX = 0;
  var dragStartTranslateY = 0;
  var initialPinchDistance = 0;
  var initialScale = 1;
  var animFrame = null;

  function init() {
    images = Array.prototype.slice.call(
      document.querySelectorAll('main.content img')
    ).filter(function(img) {
      return !img.closest('.no-lightbox') && img.src;
    });

    if (images.length === 0) return;

    buildModal();
    bindEvents();
  }

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.innerHTML =
      '<div class="lb-overlay"></div>' +
      '<div class="lb-container">' +
        '<img class="lb-image" alt="">' +
      '</div>' +
      '<div class="lb-loading"></div>' +
      '<button class="lb-close" aria-label="关闭">&times;</button>' +
      '<div class="lb-controls">' +
        '<span class="lb-zoom-indicator">100%</span>' +
        '<span class="lb-counter"></span>' +
      '</div>';

    document.body.appendChild(modal);
    overlay = modal.querySelector('.lb-overlay');
    modalImg = modal.querySelector('.lb-image');
    closeBtn = modal.querySelector('.lb-close');
    zoomIndicator = modal.querySelector('.lb-zoom-indicator');
    counter = modal.querySelector('.lb-counter');
    loadingSpinner = modal.querySelector('.lb-loading');
  }

  function bindEvents() {
    images.forEach(function(img, index) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function(e) {
        e.preventDefault();
        open(index);
      });
    });

    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    modalImg.addEventListener('dblclick', onDoubleClick);
    modalImg.addEventListener('wheel', onWheel, { passive: false });

    modalImg.addEventListener('touchstart', onTouchStart, { passive: false });
    modalImg.addEventListener('touchmove', onTouchMove, { passive: false });
    modalImg.addEventListener('touchend', onTouchEnd);

    modalImg.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    document.addEventListener('keydown', onKeyDown);

    modal.addEventListener('transitionend', function(e) {
      if (e.target === modal && modal.classList.contains('visible')) {
        modal.style.opacity = '1';
      }
    });
  }

  function open(index) {
    currentIndex = index;
    var img = images[index];

    modalImg.src = img.src;
    modalImg.alt = img.alt || '';
    modalImg.style.transform = '';
    scale = 1;
    translateX = 0;
    translateY = 0;

    updateZoomIndicator();
    updateCounter();
    showLoading(true);

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';

    modalImg.addEventListener('load', function onLoad() {
      showLoading(false);
      modalImg.removeEventListener('load', onLoad);
    });
  }

  function close() {
    modal.classList.remove('visible');
    modalImg.style.transform = '';
    scale = 1;
    translateX = 0;
    translateY = 0;
    document.body.style.overflow = '';
  }

  function onDoubleClick() {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.15 : 0.15;
    var newScale = Math.max(0.5, Math.min(5, scale + delta));
    setScale(newScale);
  }

  function setScale(newScale) {
    scale = Math.round(newScale * 100) / 100;
    applyTransform();
    updateZoomIndicator();
  }

  function applyTransform() {
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(function() {
      modalImg.style.transform =
        'translate(' + translateX + 'px, ' + translateY + 'px) ' +
        'scale(' + scale + ')';
    });
  }

  function updateZoomIndicator() {
    if (zoomIndicator) {
      zoomIndicator.textContent = Math.round(scale * 100) + '%';
      zoomIndicator.style.opacity = scale === 1 ? '0.5' : '1';
    }
  }

  function updateCounter() {
    if (counter && images.length > 1) {
      counter.textContent = (currentIndex + 1) + ' / ' + images.length;
      counter.style.display = 'inline';
    } else if (counter) {
      counter.style.display = 'none';
    }
  }

  function showLoading(show) {
    if (!loadingSpinner) return;
    if (show) {
      loadingSpinner.style.display = 'block';
    } else {
      loadingSpinner.style.display = 'none';
    }
  }

  function onDragStart(e) {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartTranslateX = translateX;
    dragStartTranslateY = translateY;
    modalImg.style.transition = 'none';
  }

  function onDragMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    var deltaX = e.clientX - dragStartX;
    var deltaY = e.clientY - dragStartY;
    translateX = dragStartTranslateX + deltaX;
    translateY = dragStartTranslateY + deltaY;
    applyTransform();
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    modalImg.style.transition = '';
  }

  function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      var dist = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchDistance = dist;
      initialScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragStartTranslateX = translateX;
      dragStartTranslateY = translateY;
      modalImg.style.transition = 'none';
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      var dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (initialPinchDistance > 0) {
        var ratio = dist / initialPinchDistance;
        setScale(Math.max(0.5, Math.min(5, initialScale * ratio)));
      }
    } else if (e.touches.length === 1 && isDragging) {
      var deltaX = e.touches[0].clientX - dragStartX;
      var deltaY = e.touches[0].clientY - dragStartY;
      translateX = dragStartTranslateX + deltaX;
      translateY = dragStartTranslateY + deltaY;
      applyTransform();
    }
  }

  function onTouchEnd() {
    isDragging = false;
    initialPinchDistance = 0;
    modalImg.style.transition = '';
  }

  function getTouchDistance(t1, t2) {
    var dx = t1.clientX - t2.clientX;
    var dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onKeyDown(e) {
    if (!modal.classList.contains('visible')) return;

    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowRight') {
      navigate(1);
    } else if (e.key === 'ArrowLeft') {
      navigate(-1);
    } else if (e.key === '+' || e.key === '=') {
      setScale(Math.min(5, scale + 0.25));
    } else if (e.key === '-' || e.key === '_') {
      setScale(Math.max(0.5, scale - 0.25));
    } else if (e.key === '0') {
      setScale(1);
      translateX = 0;
      translateY = 0;
      applyTransform();
    }
  }

  function navigate(direction) {
    if (images.length <= 1) return;
    currentIndex = (currentIndex + direction + images.length) % images.length;
    open(currentIndex);
  }

  function injectStyles() {
    if (document.getElementById('lightbox-styles')) return;
    var style = document.createElement('style');
    style.id = 'lightbox-styles';
    style.textContent =
      '.lightbox-modal{' +
      'position:fixed;inset:0;z-index:9999;' +
      'display:flex;align-items:center;justify-content:center;' +
      'opacity:0;visibility:hidden;' +
      'transition:opacity 0.35s cubic-bezier(0.2,0.8,0.2,1),visibility 0s 0.35s;' +
      'user-select:none;-webkit-user-select:none;' +
      '}' +
      '.lightbox-modal.visible{' +
      'opacity:1;visibility:visible;' +
      'transition:opacity 0.35s cubic-bezier(0.2,0.8,0.2,1),visibility 0s 0s;' +
      '}' +
      '.lb-overlay{' +
      'position:absolute;inset:0;' +
      'background:rgba(0,0,0,0.88);' +
      'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
      '}' +
      '.lb-container{' +
      'position:relative;max-width:92vw;max-height:85vh;' +
      'display:flex;align-items:center;justify-content:center;' +
      '}' +
      '.lb-image{' +
      'max-width:92vw;max-height:85vh;' +
      'object-fit:contain;' +
      'border-radius:8px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.5);' +
      'transform-origin:center center;' +
      'transition:transform 0.25s cubic-bezier(0.2,0.8,0.2,1);' +
      'cursor:zoom-out;' +
      '-webkit-user-drag:none;' +
      '}' +
      '.lb-image:not([src]),.lb-image[src=""]{display:none;}' +
      '.lb-close{' +
      'position:absolute;top:24px;right:24px;' +
      'width:42px;height:42px;border-radius:50%;' +
      'background:rgba(255,255,255,0.12);' +
      'border:1px solid rgba(255,255,255,0.2);' +
      'color:#ffffff;font-size:24px;font-weight:300;' +
      'cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'line-height:1;padding:0;' +
      'transition:all 0.2s ease;' +
      'z-index:10;' +
      '}' +
      '.lb-close:hover{' +
      'background:rgba(255,255,255,0.22);' +
      'transform:scale(1.06);' +
      '}' +
      '.lb-controls{' +
      'position:absolute;bottom:28px;left:50%;' +
      'transform:translateX(-50%);' +
      'display:flex;gap:16px;align-items:center;' +
      'z-index:10;' +
      '}' +
      '.lb-zoom-indicator,.lb-counter{' +
      'background:rgba(255,255,255,0.1);' +
      'border:1px solid rgba(255,255,255,0.15);' +
      'color:#ffffff;font-size:13px;font-weight:500;' +
      'padding:6px 12px;border-radius:9999px;' +
      'letter-spacing:0.02em;' +
      'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
      '}' +
      '.lb-counter{display:none;}' +
      '.lb-loading{' +
      'display:none;' +
      'position:absolute;top:50%;left:50%;' +
      'transform:translate(-50%,-50%);' +
      'width:32px;height:32px;' +
      'border:3px solid rgba(255,255,255,0.15);' +
      'border-top-color:#ffffff;' +
      'border-radius:50%;' +
      'animation:lb-spin 0.8s linear infinite;' +
      'z-index:5;' +
      '}' +
      '@keyframes lb-spin{' +
      'to{transform:translate(-50%,-50%) rotate(360deg);}' +
      '}' +
      '@media (max-width:600px){' +
      '.lb-close{top:14px;right:14px;width:38px;height:38px;font-size:22px;}' +
      '.lb-controls{bottom:18px;gap:10px;}' +
      '.lb-zoom-indicator,.lb-counter{font-size:12px;padding:5px 10px;}' +
      '}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectStyles();
      setTimeout(init, 150);
    });
  } else {
    injectStyles();
    setTimeout(init, 150);
  }

  document.addEventListener('page:navigate', function() {
    if (modal && modal.classList.contains('visible')) {
      close();
    }
    setTimeout(init, 300);
  });
})();
