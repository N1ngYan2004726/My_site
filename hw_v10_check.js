
/**
 * Handwriting Pixel Welcome Overlay v10.0
 * - Blank page with dot-matrix guide marks (writing preparation)
 * - Stroke-order pixel block animation
 * - Text: "你好，我是" (line 1) / "N1ngYan" (line 2)
 * - Button: "按下Enter或点击此按钮进入" (blends with bg)
 * - No early entry; Enter + click triggers
 *
 * FIX v10.0 (three UX issues):
 *   (1) Prevent flash of home-page content BEFORE overlay: inject a blocking
 *       CSS style synchronously at parse-time, then lift it after overlay
 *       is rendered + fonts loaded + animation finished -> enterSite.
 *   (2) Improve text clarity: BLOCK 12 -> 8 (finer pixel grid), SS 3 -> 4
 *       (higher supersample precision), alpha threshold 30 -> 20 (captures
 *       antialiased edges), and larger on-screen font ratio (0.18/0.16).
 *   (3) Keep dot-matrix guide visible throughout: guide canvas is no longer
 *       faded out; it remains as a subtle texture behind the animation
 *       (and fades only when exiting to the main site).
 * FIX v9.0: removed white background fill on supersample canvas so that
 * alpha channel correctly identifies text pixels.
 */
(function() {
  'use strict';

  var SESSION_KEY = 'ny_welcomed_v10';
  var BLOCK = 8;          // finer pixel blocks (was 12) for sharper glyphs
  var LINE1 = '你好，我是';
  var LINE2 = 'N1ngYan';

  var overlay = null;
  var guideCanvas = null, guideCtx = null;
  var mainCanvas = null, mainCtx = null;
  var W = 0, H = 0;
  var rafId = null;
  var animationComplete = false;
  var themeInterval = null;
  var entered = false;
  /* ----------------------------------------------------------------
   * UX FIX #1: <head> 中会预置 #hwPrerollPre 样式（在这个脚本执行前就生效），
   *            它会立即把 body > *:not([data-hw-overlay="1"]) 隐藏起来，
   *            从而防止任何首页内容在 overlay 之前闪现。
   *            - 如果需要显示 overlay：overlay 带 data-hw-overlay="1" 属性，
   *              因此能绕过预置样式显示出来；
   *            - 如果不需要 overlay（SESSION_KEY 存在或非首页）：
   *              removePrerollBlock() 会立即删除 #hwPrerollPre 预置样式，
   *              恢复首页正常显示。
   * ---------------------------------------------------------------- */
  var isHomePage = function() {
    var p = window.location.pathname;
    return p === '/' || p.endsWith('/index.html') || p === '' || /\/index\.html?$/.test(p);
  };

  var needsOverlay = (function() {
    try {
      return isHomePage() && !sessionStorage.getItem(SESSION_KEY);
    } catch (e) {
      return isHomePage();
    }
  })();

  var forceLight = function() {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-bs-theme', 'light');
    if (document.body) {
      document.body.classList.remove('quarto-dark');
      document.body.classList.add('quarto-light');
    }
    document.documentElement.style.setProperty('background', '#FFFFFF', 'important');
    document.documentElement.style.setProperty('background-color', '#FFFFFF', 'important');
    document.documentElement.style.setProperty('background-image', 'none', 'important');
    if (document.body) {
      document.body.style.setProperty('background', '#FFFFFF', 'important');
      document.body.style.setProperty('background-color', '#FFFFFF', 'important');
      document.body.style.setProperty('background-image', 'none', 'important');
    }
  };

  var removePrerollBlock = function() {
    try {
      // 解除 <head> 中预置的 #hwPrerollPre 阻塞样式
      var pre = document.getElementById('hwPrerollPre');
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      // 兼容旧版本：清理可能残留的 data-hw-preroll 属性
      if (document.body) document.body.removeAttribute('data-hw-preroll');
    } catch (e) {}
  };

  var init = function() {
    if (!isHomePage()) { removePrerollBlock(); return; }
    if (!needsOverlay) { removePrerollBlock(); return; }

    forceLight();
    [50, 200, 500, 1000, 2000, 4000].forEach(function(d) {
      setTimeout(forceLight, d);
    });

    themeInterval = setInterval(function() {
      if (document.documentElement.classList.contains('dark') ||
          (document.body && document.body.classList.contains('quarto-dark'))) {
        forceLight();
      }
    }, 100);

    try {
      var obs = new MutationObserver(function() {
        if (document.documentElement.classList.contains('dark') ||
            (document.body && document.body.classList.contains('quarto-dark'))) {
          forceLight();
        }
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      if (document.body) {
        obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      }
    } catch (e) {}

    overlay = document.createElement('div');
    overlay.setAttribute('data-hw-overlay', '1');
    var s = overlay.style;
    s.setProperty('position', 'fixed', 'important');
    s.setProperty('top', '0', 'important');
    s.setProperty('right', '0', 'important');
    s.setProperty('bottom', '0', 'important');
    s.setProperty('left', '0', 'important');
    s.setProperty('width', '100%', 'important');
    s.setProperty('height', '100%', 'important');
    s.setProperty('z-index', '999999', 'important');
    s.setProperty('background', '#FFFFFF', 'important');
    s.setProperty('background-color', '#FFFFFF', 'important');
    s.setProperty('background-image', 'none', 'important');
    s.setProperty('overflow', 'hidden', 'important');
    s.setProperty('visibility', 'visible', 'important');
    s.setProperty('opacity', '1', 'important');

    // UX FIX #3: guideCanvas 不再淡出，点阵始终显示在动画下方（z-index:1）
    // guide dots 颜色稍微调浅一点，作为背景纹理。
    overlay.innerHTML =
      '<canvas id="hwGuide" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;opacity:0;transition:opacity 0.7s ease;"></canvas>' +
      '<canvas id="hwCanvas" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:3;"></canvas>' +
      '<div id="hwAccText" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">' + LINE1 + ' ' + LINE2 + '</div>' +
      '<div id="hwBtnArea" style="position:absolute;bottom:14vh;left:0;width:100%;z-index:10;display:flex;justify-content:center;pointer-events:none;opacity:0;transition:opacity 0.6s ease;">' +
        '<button id="hwEnter" style="pointer-events:none;padding:14px 36px;font-family:-apple-system,&quot;PingFang SC&quot;,&quot;Microsoft YaHei&quot;,sans-serif;font-size:15px;color:#333;background:rgba(255,255,255,0.5);border:1px solid #d0d0d0;border-radius:6px;cursor:default;letter-spacing:1px;transition:border-color 0.3s ease,background 0.3s ease,box-shadow 0.3s ease;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);">' +
          '按下Enter或点击此按钮进入' +
        '</button>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var btn = document.getElementById('hwEnter');

    var tryEnter = function() {
      if (!animationComplete) return;
      enterSite();
    };

    btn.addEventListener('click', tryEnter);

    var keyHandler = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (animationComplete) {
          tryEnter();
          document.removeEventListener('keydown', keyHandler);
        }
      }
    };
    document.addEventListener('keydown', keyHandler);

    btn.addEventListener('mouseenter', function() {
      if (!animationComplete) return;
      btn.style.borderColor = '#333';
      btn.style.background = 'rgba(0,0,0,0.03)';
      btn.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
    });
    btn.addEventListener('mouseleave', function() {
      if (!animationComplete) return;
      btn.style.borderColor = '#d0d0d0';
      btn.style.background = 'rgba(255,255,255,0.5)';
      btn.style.boxShadow = 'none';
    });

    if (!document.getElementById('hwPulseStyle')) {
      var st = document.createElement('style');
      st.id = 'hwPulseStyle';
      st.textContent = '@keyframes hwPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,0,0,0.12); } 50% { box-shadow: 0 0 0 10px rgba(0,0,0,0); } }';
      document.head.appendChild(st);
    }

    loadFonts(startAnim);
  };

  var enterSite = function() {
    if (entered) return;
    entered = true;
    if (themeInterval) clearInterval(themeInterval);
    overlay.style.transition = 'opacity 0.6s ease-out';
    overlay.style.opacity = '0';
    document.body.style.overflow = '';
    sessionStorage.setItem(SESSION_KEY, 'true');
    if (rafId) cancelAnimationFrame(rafId);
    // UX FIX #1: 进入网站时解除首页内容的可见性阻塞
    removePrerollBlock();
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 600);
  };

  var loadFonts = function(cb) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Long+Cang&family=Caveat:wght@700&display=swap';
    document.head.appendChild(link);

    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('48px "Ma Shan Zheng"'),
        document.fonts.load('48px "Caveat"'),
        document.fonts.load('48px "Long Cang"')
      ]).then(function() { setTimeout(cb, 200); })
        .catch(function() { setTimeout(cb, 1500); });
    } else {
      setTimeout(cb, 2000);
    }
  };

  var startAnim = function() {
    guideCanvas = document.getElementById('hwGuide');
    mainCanvas = document.getElementById('hwCanvas');
    if (!guideCanvas || !mainCanvas) { removePrerollBlock(); return; }

    guideCtx = guideCanvas.getContext('2d');
    mainCtx = mainCanvas.getContext('2d');

    W = window.innerWidth;
    H = window.innerHeight;
    guideCanvas.width = W; guideCanvas.height = H;
    mainCanvas.width = W; mainCanvas.height = H;

    mainCtx.clearRect(0, 0, W, H);
    guideCtx.clearRect(0, 0, W, H);

    var data = buildData(W, H);
    drawGuideDots(data.bbox);

    // fade in guide dots (writing preparation marks)
    requestAnimationFrame(function() {
      guideCanvas.style.opacity = '1';
    });

    setTimeout(function() {
      // UX FIX #3: guideCanvas 保持显示，不淡出
      // guideCanvas.style.opacity = '0';  <-- 移除！
      runReveal(data);
    }, 1100);
  };

  var buildData = function(W, H) {
    var gridW = Math.floor(W / BLOCK);
    var gridH = Math.floor(H / BLOCK);
    var SS = 4;   // UX FIX #2: higher supersample for smoother glyph edges (was 3)

    var ss = document.createElement('canvas');
    ss.width = gridW * SS;
    ss.height = gridH * SS;
    var sc = ss.getContext('2d');

    // UX FIX #2: 放大屏幕上的字体比例，让文字更清晰、占比更合理
    // 中文: min(H*18%, W*16%)，英文保持 0.82 比例
    var cnFontSz = Math.min(H * 0.18, W * 0.16) * SS / BLOCK;
    var enFontSz = cnFontSz * 0.82;
    var gapSz = Math.floor(H * 0.04 * SS / BLOCK);
    var totalH = cnFontSz + gapSz + enFontSz;
    var startY = Math.floor((ss.height - totalH) / 2);
    var cx = Math.floor(ss.width / 2);

    sc.fillStyle = '#1a1a1a';
    sc.textAlign = 'center';
    sc.textBaseline = 'middle';

    var cy1 = startY + Math.floor(cnFontSz / 2);
    var cnFont = cnFontSz + "px 'Ma Shan Zheng','Long Cang',cursive";
    sc.font = cnFont;
    sc.fillText(LINE1, cx, cy1);

    var cy2 = startY + cnFontSz + gapSz + Math.floor(enFontSz / 2);
    var enFont = enFontSz + "px 'Caveat',cursive";
    sc.font = enFont;
    sc.fillText(LINE2, cx, cy2);

    sc.font = cnFont;
    var l1Width = sc.measureText(LINE1).width;
    var l1CharW = l1Width / LINE1.length;
    var l1Start = cx - l1Width / 2;

    sc.font = enFont;
    var l2Width = sc.measureText(LINE2).width;
    var l2CharW = l2Width / LINE2.length;
    var l2Start = cx - l2Width / 2;

    var img = sc.getImageData(0, 0, ss.width, ss.height).data;
    var blocks = [];

    for (var gy = 0; gy < gridH; gy++) {
      for (var gx = 0; gx < gridW; gx++) {
        var sumA = 0, cnt = 0;
        var sy0 = gy * SS, sx0 = gx * SS;
        for (var sy = sy0; sy < sy0 + SS && sy < ss.height; sy++) {
          for (var sx = sx0; sx < sx0 + SS && sx < ss.width; sx++) {
            sumA += img[(sy * ss.width + sx) * 4 + 3];
            cnt++;
          }
        }
        var avg = sumA / cnt;
        // UX FIX #2: alpha 阈值从 30 降低到 20，保留抗锯齿边缘像素，字形更完整
        if (avg > 20) {
          var blockCenterSx = gx * SS + SS / 2;
          var blockCenterSy = gy * SS + SS / 2;
          var charInfo;
          if (blockCenterSy < cy2 - enFontSz * 0.4) {
            var ci = Math.floor((blockCenterSx - l1Start) / l1CharW);
            ci = Math.max(0, Math.min(LINE1.length - 1, ci));
            charInfo = { line: 1, idx: ci };
          } else {
            var ci2 = Math.floor((blockCenterSx - l2Start) / l2CharW);
            ci2 = Math.max(0, Math.min(LINE2.length - 1, ci2));
            charInfo = { line: 2, idx: ci2 };
          }
          blocks.push({
            lx: gx, ly: gy,
            px: gx * BLOCK, py: gy * BLOCK,
            alpha: Math.min(1, avg / 200),
            line: charInfo.line, charIdx: charInfo.idx
          });
        }
      }
    }

    var groups = {};
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var k = b.line + '-' + b.charIdx;
      if (!groups[k]) groups[k] = [];
      groups[k].push(b);
    }

    var all = [];
    var charStart = 0;
    var totalChars = LINE1.length + LINE2.length;

    for (var c = 0; c < totalChars; c++) {
      var line = c < LINE1.length ? 1 : 2;
      var ci3 = c < LINE1.length ? c : c - LINE1.length;
      var g = groups[line + '-' + ci3];
      if (!g || g.length === 0) continue;

      g.sort(function(a, b) {
        if (Math.abs(a.ly - b.ly) <= 1) return a.lx - b.lx;
        return a.ly - b.ly;
      });

      var shuffled = [];
      // BLOCK 更小 -> 每字块数更多 -> chunk 适当增大以保持自然书写节奏
      var CHUNK = line === 1 ? 6 : 5;
      for (var i2 = 0; i2 < g.length; i2 += CHUNK) {
        var chunk = g.slice(i2, Math.min(i2 + CHUNK, g.length));
        if (Math.random() > 0.6) chunk.reverse();
        shuffled = shuffled.concat(chunk);
      }

      // 因为 BLOCK=8，每字块数约是 BLOCK=12 的 (12/8)^2=2.25 倍
      // 所以每块写入时间从 *6.5/4.5 降低至 *3.0/2.0，总时长与之前保持相当
      var dur = line === 1 ? Math.max(550, shuffled.length * 3.0) : Math.max(220, shuffled.length * 2.0);
      var pause = c === 0 ? 0 : (line === 1 ? 160 : 90);
      if (c > 0 && c === LINE1.length) pause = 320;

      for (var j = 0; j < shuffled.length; j++) {
        var rel = j / shuffled.length;
        var eased = rel < 0.5 ? 2 * rel * rel : 1 - Math.pow(-2 * rel + 2, 2) / 2;
        var sv = 0.7 + Math.random() * 0.6;
        shuffled[j].writeTime = charStart + pause + eased * dur / sv;
        shuffled[j].color = '#1a1a1a';
        all.push(shuffled[j]);
      }

      charStart += pause + dur;
    }

    all.sort(function(a, b) { return a.writeTime - b.writeTime; });

    var maxW = Math.max(l1Width, l2Width);
    var bbox = {
      x: Math.floor((cx - maxW / 2) / SS) * BLOCK - BLOCK,
      y: Math.floor(startY / SS) * BLOCK - BLOCK,
      w: Math.ceil(maxW / SS) * BLOCK + BLOCK * 2,
      h: Math.ceil(totalH / SS) * BLOCK + BLOCK * 2
    };

    return { blocks: all, totalDuration: charStart + 400, bbox: bbox };
  };

  var drawGuideDots = function(bbox) {
    // UX FIX #3: 点阵颜色稍微调浅，并降低点阵密度/扩大步长，作为背景纹理不突兀
    guideCtx.fillStyle = '#e8e8e8';
    var step = BLOCK * 1;
    for (var y = bbox.y; y < bbox.y + bbox.h; y += step) {
      for (var x = bbox.x; x < bbox.x + bbox.w; x += step) {
        guideCtx.fillRect(x + step / 2 - 1, y + step / 2 - 1, 2, 2);
      }
    }
  };

  var runReveal = function(data) {
    var blocks = data.blocks;
    var total = data.totalDuration;
    var startTs = null;
    var lastIdx = -1;

    var frame = function(ts) {
      if (!startTs) startTs = ts;
      var elapsed = ts - startTs;

      mainCtx.imageSmoothingEnabled = false;

      for (var i = lastIdx + 1; i < blocks.length; i++) {
        if (blocks[i].writeTime <= elapsed) {
          mainCtx.globalAlpha = blocks[i].alpha || 1;
          mainCtx.fillStyle = blocks[i].color;
          mainCtx.fillRect(blocks[i].px, blocks[i].py, BLOCK, BLOCK);
          lastIdx = i;
        } else {
          break;
        }
      }
      mainCtx.globalAlpha = 1;

      if (elapsed < total) {
        rafId = requestAnimationFrame(frame);
      } else {
        for (var i2 = lastIdx + 1; i2 < blocks.length; i2++) {
          mainCtx.globalAlpha = blocks[i2].alpha || 1;
          mainCtx.fillStyle = blocks[i2].color;
          mainCtx.fillRect(blocks[i2].px, blocks[i2].py, BLOCK, BLOCK);
        }
        mainCtx.globalAlpha = 1;
        animationComplete = true;
        showButton();
      }
    };

    rafId = requestAnimationFrame(frame);
  };

  var showButton = function() {
    var btn = document.getElementById('hwEnter');
    var btnArea = document.getElementById('hwBtnArea');
    if (btn) {
      btn.style.pointerEvents = 'auto';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 0 0 0 rgba(0,0,0,0.15)';
      btn.style.animation = 'hwPulse 2.4s ease-in-out infinite';
    }
    if (btnArea) btnArea.style.opacity = '1';
  };

  // Script 可能在 head 中执行；此时 body 可能还不存在，需要等待
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
