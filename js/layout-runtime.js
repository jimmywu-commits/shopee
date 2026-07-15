/*!
 * layout-runtime.js
 * 所有排版版位共用的執行邏輯
 * 由各版位 HTML 載入：<script src="../js/layout-runtime.js"></script>
 */
(function(){

(function () {
  var urlId = parseInt(new URLSearchParams(location.search).get('bnid')) || 0;
  var fname = decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/i, ''));

  function loadCSS(href, cb) {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = cb || function(){};
    l.onerror = function(){ if(cb) cb(); };
    document.head.appendChild(l);
  }
  var loaded = 0;
  function onBothLoaded() {
    loaded++;
    if (loaded < 2) return;
    /* CSS 兩個都載完後，等字型也載完再 init
       document.fonts.ready 在字型下載完成後 resolve，
       保證 scrollWidth / getComputedStyle 拿到的是正確字型的量測值 */
    waitFontsAndInit();
  }

  function waitFontsAndInit() {
    /* 統一入口：CSS 載入完成或 window load fallback 都必須等字型 ready。
       避免慢速電腦先用 fallback 字型完成排版，造成畫布文字位置/寬度錯誤。 */
    function doInit() {
      requestAnimationFrame(function(){ requestAnimationFrame(init); });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(doInit).catch(doInit);
    } else {
      setTimeout(doInit, 300);
    }
  }

  loadCSS(fname + '.css',        onBothLoaded);
  loadCSS(fname + '.config.css', onBothLoaded);
  window.addEventListener('load', function(){ setTimeout(waitFontsAndInit, 600); });
  var inited = false;

  function init() {
    if (inited) return;
    inited = true;
    var root = getComputedStyle(document.documentElement);
    var canvas = document.getElementById('canvas');
    var W = parseFloat(root.getPropertyValue('--canvas-w')) || parseFloat(document.body.dataset.fw) || 900;
    var H = parseFloat(root.getPropertyValue('--canvas-h')) || parseFloat(document.body.dataset.fh) || 600;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    var bgRaw = root.getPropertyValue('--bg-img').trim();
    var bimgInit = document.getElementById('底圖');
    if (bgRaw && bgRaw !== 'none' && bgRaw !== '') {
      var bsrc = bgRaw.replace(/^url\(["']?/,'').replace(/["']?\)$/,'').trim();
      if (bimgInit) { bimgInit.src = bsrc; bimgInit.style.display = 'block'; }
    } else if (bimgInit) {
      /* 原始 html 裡 #底圖 這個 <img> 標籤預設帶 src=""（空字串），
         瀏覽器對空字串 src 會發出一個「請求頁面自己網址」的圖片請求，
         這個請求一定會失敗，顯示瀏覽器預設的「破圖」小圖示——
         即使這個元素本身是 display:none，下載截圖工具（html2canvas）
         走訪 DOM 時仍可能把這個破圖圖示畫進截圖結果的左上角
         （#底圖 這個元素本來就固定在 top:0,left:0）。
         這裡明確整個移除 src 屬性（不是留著空字串），從根本避免這個
         幽靈請求發生，而不是只依賴 display:none 去隱藏它。 */
      bimgInit.removeAttribute('src');
    }

    var ctaRaw = root.getPropertyValue('--cta-classes').trim().replace(/^["']/,'').replace(/["']$/,'');
    var ctaSet = {};
    if (ctaRaw) ctaRaw.split(',').forEach(function(s){ var k=s.trim(); if(k) ctaSet[k]=true; });

    var layersRaw = root.getPropertyValue('--layers').trim().replace(/^["']/,'').replace(/["']$/,'');
    if (layersRaw) {
      layersRaw.split(',').forEach(function(s) {
        s = s.trim(); if (!s) return;
        var parts = s.split('|'), cls = parts[0].trim(), txt = parts.length>1 ? parts[1].trim() : '';
        if (!cls) return;
        var el = document.createElement('div');
        el.className = cls;
        if (ctaSet[cls]) {
          var s1 = document.createElement('span'); s1.className = 'cta-text'; if(txt) s1.textContent = txt;
          var s2 = document.createElement('span'); s2.className = 'cta-arrow';
          el.appendChild(s1); el.appendChild(s2);
        } else { if(txt) el.textContent = txt; }
        canvas.appendChild(el);
      });

      /* IG logo card：固定壓在背景色/背景圖/保護色塊上方，但低於主要文字與 logo */
      var bgLayer = canvas.querySelector('.bg');
      var isIGLayout = /^IG/i.test(fname);
      if (isIGLayout && bgLayer) {
        var card = document.getElementById('ig-shopee-logo-card');
        if (!card) {
          card = document.createElement('img');
          card.id = 'ig-shopee-logo-card';
          card.alt = '';
          card.src = 'img/ig-shopee-logo-card.png';
        }
        card.style.cssText =
          'position:absolute;left:0;top:0;width:100%;height:100%;' +
          'object-fit:cover;pointer-events:none;z-index:4;';
        bgLayer.insertAdjacentElement('afterend', card);
      }
    }

    /* ── 讀 --canvas-bg 套用初始背景色（--layers DOM 建立後才做，.bg/.背景色 已存在）
          init 時就設好，不依賴父層 bn-color；
          避免 iframe reload 後背景色消失，或父層重新同步時閃回預設顏色。
          父層之後發 bn-color 仍可覆蓋（同為 inline style）。── */
    var canvasBgRaw = root.getPropertyValue('--canvas-bg').trim();
    if (canvasBgRaw && canvasBgRaw !== 'none' && canvasBgRaw !== '') {
      var _bgEl = canvas.querySelector('.背景色') || canvas.querySelector('.bg') || canvas.querySelector('.底色');
      if (_bgEl) {
        _bgEl.style.backgroundColor = canvasBgRaw;
      } else {
        canvas.style.background = canvasBgRaw;
      }
    }

    function fit() {
      if (window.parent !== window) {
        canvas.style.transform = 'none';
        var st = document.getElementById('stage');
        if (st) { st.style.width = W+'px'; st.style.height = H+'px'; }
        return;
      }
      var sc = Math.min(window.innerWidth/W, window.innerHeight/H);
      var st = document.getElementById('stage');
      canvas.style.transform = 'scale('+sc+')';
      st.style.width  = (W*sc)+'px';
      st.style.height = (H*sc)+'px';
    }
    window.addEventListener('resize', fit);
    fit();
    if (window.parent !== window && urlId)
      window.parent.postMessage({type:'bn-iframe-ready',id:urlId,w:W,h:H},'*');

    /* 掛標：自動依目前版位檔名讀 html/img/tag/版位名_r 或 _w，預設紅色。
       修正版：同時建立紅/白兩張疊圖，切換時只控制 display，避免 iframe postMessage 時機與瀏覽器快取造成不切換。 */
    var _bnTagColor = 'red';
    var _bnTagWrap = null;
    var _bnTagImgs = { red: null, white: null };
    var _bnTagSrcs = { red: '', white: '' };
    var _bnTagSeq = 0;

    function _bnDecodeSharpU(str){
      return String(str || '').replace(/#U([0-9a-fA-F]{4,6})/g, function(_, hex){
        try { return String.fromCodePoint(parseInt(hex, 16)); } catch(e) { return _; }
      });
    }
    function _bnUnique(arr){
      var out = [];
      arr.forEach(function(v){
        v = String(v || '').trim();
        if(v && out.indexOf(v) === -1) out.push(v);
      });
      return out;
    }
    function _bnNormalizeTagName(str){
      return _bnDecodeSharpU(String(str || ''))
        .toLowerCase()
        .replace(/\.html$/i, '')
        .replace(/[_\-\s]/g, '')
        .replace(/(方logo|橫logo|方式logo|橫式logo|方標|橫標|方版|橫版|排版|logo)/g, '');
    }
    function _bnPushTagBase(arr, v){
      v = String(v || '').trim();
      if(!v) return;
      arr.push(v);
      try { arr.push(_bnDecodeSharpU(v)); } catch(_) {}
      try { arr.push(encodeURIComponent(v)); } catch(_) {}
      try { arr.push(v.replace(/ /g, '%20')); } catch(_) {}
      arr.push(v.toLowerCase());
    }
    function _bnTagBases(){
      var base = fname || '';
      var decodedPath = '';
      try { decodedPath = decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/i, '')); } catch(_) {}
      var zhBase = _bnDecodeSharpU(base);
      var zhPath = _bnDecodeSharpU(decodedPath || base);
      var norm = _bnNormalizeTagName(zhPath || zhBase || base);

      // 已知的固定命名別名優先嘗試（img/tag 資料夾裡實際存在的檔名多是這種命名），
      // 這樣通常第 1～2 次就能找到圖，不會浪費一堆請求去試不存在的檔名組合。
      var aliases = [];
      if(/coin/i.test(norm)) aliases.push('Coinpage','coinpage','Coin_pageBN_APP','Coin_pageBN');
      if(/ddcard/i.test(norm)) aliases.push('ddcard','DDCard','DD Card');
      if(/hbn/i.test(norm)) aliases.push('HBN','hbn');
      if(/fbpost|facebook|^fb/i.test(norm)) aliases.push('fbpost','FB_POST','FB','facebook');
      if(/ig|instagram/i.test(norm)) aliases.push('IG','ig','instagram');
      if(/lpbnapp/i.test(norm)) aliases.push('LPBN_APP','lpbn_app');
      if(/lpbnpc/i.test(norm)) aliases.push('LPBN_PC','lpbn_pc');
      if(/scbn/i.test(norm)) aliases.push('SCBN_APP','SCBN','scbn');
      if(/searchimage1/i.test(norm)) aliases.push('Search_Image1logo','Search_Image1','searchimage1');
      if(/searchimage2/i.test(norm)) aliases.push('Search_Image2logo','Search_Image2','searchimage2');
      if(/searchimage3/i.test(norm)) aliases.push('Search_Image3logo','Search_Image3','searchimage3');

      var arr = [];
      aliases.forEach(function(v){ _bnPushTagBase(arr, v); });
      [base, decodedPath, zhBase, zhPath, norm].forEach(function(v){ _bnPushTagBase(arr, v); });
      return _bnUnique(arr);
    }
    function _bnBuildTagCandidates(color){
      var suffix = color === 'white' ? 'w' : 'r';
      var candidates = [];
      // 只嘗試實際會用到的副檔名（png 為主，jpg/webp 備用），避免每個檔名都要試 6 種副檔名
      // 造成組合爆炸（過多無效請求容易被 GitHub Pages 判定為 429 太多請求）。
      ['png','jpg','webp'].forEach(function(ext){
        _bnTagBases().forEach(function(base){
          candidates.push('img/tag/' + base + '_' + suffix + '.' + ext);
          candidates.push('html/img/tag/' + base + '_' + suffix + '.' + ext);
        });
      });
      // 安全上限：最多只嘗試前 40 個候選網址，找不到就放棄，不繼續往下試。
      return _bnUnique(candidates).slice(0, 40);
    }
    function _bnTagCacheKey(color){
      return 'bnTag:' + (fname || '') + ':' + color;
    }
    function _bnFindFirstImage(srcs, cb){
      var idx = 0;
      function next(){
        if(idx >= srcs.length){ cb(''); return; }
        var src = srcs[idx++];
        var probe = new Image();
        probe.onload = function(){ cb(src); };
        probe.onerror = next;
        // 探測階段不加時間戳記，讓瀏覽器對重複探測的失敗結果保有快取的機會，
        // 避免同一批候選網址在多個 iframe / 多次重新排版時被重複打好幾次。
        probe.src = src;
      }
      next();
    }

    function _bnIsTagDisabledForLayout(){
      var n = _bnNormalizeTagName(fname);
      return n === 'ddcard' || n.indexOf('ddcard') !== -1;
    }

    function _bnEnsureTagLayers(){
      if(_bnIsTagDisabledForLayout()) return null;
      if(!_bnTagWrap){
        _bnTagWrap = document.getElementById('bn-auto-tag-wrap');
      }
      if(!_bnTagWrap){
        _bnTagWrap = document.createElement('div');
        _bnTagWrap.id = 'bn-auto-tag-wrap';
      }
      _bnTagWrap.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9998;display:none;';

      ['red','white'].forEach(function(color){
        var img = _bnTagImgs[color] || document.getElementById('bn-auto-tag-' + color);
        if(!img){
          img = document.createElement('img');
          img.id = 'bn-auto-tag-' + color;
          img.alt = '';
        }
        img.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none;display:none;';
        if(img.parentNode !== _bnTagWrap) _bnTagWrap.appendChild(img);
        _bnTagImgs[color] = img;
      });

      if(_bnTagWrap.parentNode !== canvas){
        var bgLayer = canvas.querySelector('.bg') || canvas.querySelector('.背景色') || canvas.querySelector('.底色');
        if(bgLayer && bgLayer.parentNode === canvas) bgLayer.insertAdjacentElement('afterend', _bnTagWrap);
        else canvas.appendChild(_bnTagWrap);
      }
      return _bnTagWrap;
    }
    function _bnRefreshTagVisibility(){
      if(_bnIsTagDisabledForLayout()) return;
      _bnEnsureTagLayers();
      var visible = false;
      ['red','white'].forEach(function(color){
        var img = _bnTagImgs[color];
        var show = color === _bnTagColor && !!_bnTagSrcs[color];
        if(img) img.style.display = show ? 'block' : 'none';
        if(show) visible = true;
      });
      _bnTagWrap.style.display = visible ? 'block' : 'none';
    }
    function _bnLoadTagLayers(){
      if(_bnIsTagDisabledForLayout()) return;
      var seq = ++_bnTagSeq;
      _bnEnsureTagLayers();
      ['red','white'].forEach(function(color){
        var cacheKey = _bnTagCacheKey(color);
        var cached = null;
        try { cached = window.sessionStorage.getItem(cacheKey); } catch(_) {}
        if(cached !== null){
          // 曾經探測過的結果（找到的網址，或空字串代表確認找不到），直接沿用，不用再打一輪請求。
          if(seq !== _bnTagSeq) return;
          _bnTagSrcs[color] = cached || '';
          var cimg = _bnTagImgs[color];
          if(cached && cimg){
            cimg.onload = function(){ _bnRefreshTagVisibility(); };
            cimg.onerror = function(){ _bnTagSrcs[color] = ''; _bnRefreshTagVisibility(); };
            cimg.src = cached + (cached.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
          }
          _bnRefreshTagVisibility();
          return;
        }
        _bnFindFirstImage(_bnBuildTagCandidates(color), function(src){
          try { window.sessionStorage.setItem(cacheKey, src || ''); } catch(_) {}
          if(seq !== _bnTagSeq) return;
          _bnTagSrcs[color] = src || '';
          var img = _bnTagImgs[color];
          if(src && img){
            img.onload = function(){ _bnRefreshTagVisibility(); };
            img.onerror = function(){ _bnTagSrcs[color] = ''; _bnRefreshTagVisibility(); };
            img.src = src + (src.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
          }
          _bnRefreshTagVisibility();
        });
      });
    }
    function _bnSetTagColor(color){
      if(_bnIsTagDisabledForLayout()) return;
      _bnTagColor = (color === 'white') ? 'white' : 'red';
      _bnRefreshTagVisibility();
      if(!_bnTagSrcs.red && !_bnTagSrcs.white) _bnLoadTagLayers();
    }
    window._bnSetTagColor = _bnSetTagColor;
    window._bnApplyTag = _bnLoadTagLayers;
    _bnLoadTagLayers();

    /* 蝦皮LOGO：比照掛標的疊圖機制，但圖片固定為 img/tag/shopeelogo_w.png（白）
       與 img/tag/shopeelogo_o.png（橘），不像掛標依版位檔名找圖，預設白色。
       只有 FB_POST 版位需要這個功能，其他版位一律不啟用。 */
    function _bnIsShopeeLogoEnabledForLayout(){
      return (fname || '').toLowerCase().indexOf('fb_post') !== -1;
    }
    var _bnLogoColor = 'white';
    var _bnShopeeWrap = null;
    var _bnShopeeImgs = { white: null, orange: null };
    var _bnShopeeSrcs = { white: '', orange: '' };
    var _bnShopeeSeq = 0;

    function _bnShopeeCacheKey(color){
      return 'bnShopeeLogo:' + color;
    }
    function _bnShopeeCandidates(color){
      var suffix = color === 'orange' ? 'o' : 'w';
      return ['img/tag/shopeelogo_' + suffix + '.png', 'html/img/tag/shopeelogo_' + suffix + '.png'];
    }
    function _bnEnsureShopeeLayers(){
      if(!_bnIsShopeeLogoEnabledForLayout()) return null;
      if(!_bnShopeeWrap){
        _bnShopeeWrap = document.getElementById('bn-shopee-logo-wrap');
      }
      if(!_bnShopeeWrap){
        _bnShopeeWrap = document.createElement('div');
        _bnShopeeWrap.id = 'bn-shopee-logo-wrap';
      }
      _bnShopeeWrap.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9997;display:none;';

      ['white','orange'].forEach(function(color){
        var img = _bnShopeeImgs[color] || document.getElementById('bn-shopee-logo-' + color);
        if(!img){
          img = document.createElement('img');
          img.id = 'bn-shopee-logo-' + color;
          img.alt = '';
        }
        img.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none;display:none;';
        if(img.parentNode !== _bnShopeeWrap) _bnShopeeWrap.appendChild(img);
        _bnShopeeImgs[color] = img;
      });

      if(_bnShopeeWrap.parentNode !== canvas){
        /* 疊在掛標之上（若掛標已存在），否則接在背景層之後 */
        var afterEl = (_bnTagWrap && _bnTagWrap.parentNode === canvas)
          ? _bnTagWrap
          : (canvas.querySelector('.bg') || canvas.querySelector('.背景色') || canvas.querySelector('.底色'));
        if(afterEl) afterEl.insertAdjacentElement('afterend', _bnShopeeWrap);
        else canvas.appendChild(_bnShopeeWrap);
      }
      return _bnShopeeWrap;
    }
    function _bnRefreshShopeeVisibility(){
      if(!_bnIsShopeeLogoEnabledForLayout()) return;
      _bnEnsureShopeeLayers();
      var visible = false;
      ['white','orange'].forEach(function(color){
        var img = _bnShopeeImgs[color];
        var show = color === _bnLogoColor && !!_bnShopeeSrcs[color];
        if(img) img.style.display = show ? 'block' : 'none';
        if(show) visible = true;
      });
      _bnShopeeWrap.style.display = visible ? 'block' : 'none';
    }
    function _bnLoadShopeeLayers(){
      if(!_bnIsShopeeLogoEnabledForLayout()) return;
      var seq = ++_bnShopeeSeq;
      _bnEnsureShopeeLayers();
      ['white','orange'].forEach(function(color){
        var cacheKey = _bnShopeeCacheKey(color);
        var cached = null;
        try { cached = window.sessionStorage.getItem(cacheKey); } catch(_) {}
        if(cached !== null){
          if(seq !== _bnShopeeSeq) return;
          _bnShopeeSrcs[color] = cached || '';
          var cimg = _bnShopeeImgs[color];
          if(cached && cimg){
            cimg.onload = function(){ _bnRefreshShopeeVisibility(); };
            cimg.onerror = function(){ _bnShopeeSrcs[color] = ''; _bnRefreshShopeeVisibility(); };
            cimg.src = cached + (cached.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
          }
          _bnRefreshShopeeVisibility();
          return;
        }
        _bnFindFirstImage(_bnShopeeCandidates(color), function(src){
          try { window.sessionStorage.setItem(cacheKey, src || ''); } catch(_) {}
          if(seq !== _bnShopeeSeq) return;
          _bnShopeeSrcs[color] = src || '';
          var img = _bnShopeeImgs[color];
          if(src && img){
            img.onload = function(){ _bnRefreshShopeeVisibility(); };
            img.onerror = function(){ _bnShopeeSrcs[color] = ''; _bnRefreshShopeeVisibility(); };
            img.src = src + (src.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
          }
          _bnRefreshShopeeVisibility();
        });
      });
    }
    function _bnSetLogoColor(color){
      if(!_bnIsShopeeLogoEnabledForLayout()) return;
      _bnLogoColor = (color === 'orange') ? 'orange' : 'white';
      _bnRefreshShopeeVisibility();
      if(!_bnShopeeSrcs.white && !_bnShopeeSrcs.orange) _bnLoadShopeeLayers();
    }
    window._bnSetLogoColor = _bnSetLogoColor;
    window._bnApplyShopeeLogo = _bnLoadShopeeLayers;
    _bnLoadShopeeLayers();


    /* Search_Image：動態置中 */
    if(fname.toLowerCase().indexOf('search_image') !== -1){
      /* Search_Image2：兩個 logo 各自垂直置中，水平位置由 PS CSS 決定 */
      if(fname.toLowerCase().indexOf('search_image2') !== -1 || fname.toLowerCase().indexOf('search_image3') !== -1){
        var _si23H = H;
        /* 所有 logo 範圍垂直置中 */
        ['logo範圍_左','logo範圍_中','logo範圍_右'].forEach(function(cls){
          var el = canvas.querySelector('.'+cls);
          if(!el) return;
          var elH = parseFloat(window.getComputedStyle(el).height) || 121;
          el.style.top = ((_si23H - elH) / 2) + 'px';
        });
        /* 間隔線垂直置中（支援單名和左右命名）*/
        ['.logo間隔直線','.logo間隔直線_左','.logo間隔直線_右'].forEach(function(sel){
          var el = canvas.querySelector(sel);
          if(!el) return;
          var elH = parseFloat(window.getComputedStyle(el).height) || 55;
          el.style.top = ((_si23H - elH) / 2) + 'px';
        });
        return;
      }
      var _siLogo = canvas.querySelector('.logo範圍');
      var _siText = canvas.querySelector('.副標案型七字內');
      if(_siLogo && _siText){
        var _siCanvasH = H;
        /* 文案區：紅底右邊緣 ~ CTA 左邊緣 */
        var _siRedEl  = canvas.querySelector('.蝦皮商城logo紅底');
        var _siCtaEl  = canvas.querySelector('.cta圓底');
        var _siAreaLeft  = _siRedEl  ?
          parseFloat(window.getComputedStyle(_siRedEl).left) + parseFloat(window.getComputedStyle(_siRedEl).width) : 299;
        var _siAreaRight = _siCtaEl  ?
          parseFloat(window.getComputedStyle(_siCtaEl).left) : 1007;
        var _siAreaCenter = (_siAreaLeft + _siAreaRight) / 2;

        /* logo 固定尺寸（從 CSS 讀，之後不變）*/
        var _siLogoW = parseFloat(window.getComputedStyle(_siLogo).width)  || 120;
        var _siLogoH = parseFloat(window.getComputedStyle(_siLogo).height) || 121;

        function siLayout(){
          /* canvas 縮放比例（用於把 getBoundingClientRect 轉回原始座標）*/
          var m = canvas.style.transform && canvas.style.transform.match(/scale\(([\d.]+)\)/);
          var scale = m ? parseFloat(m[1]) : 1;

          /* 副標實際視覺寬高（原始座標）
             getBoundingClientRect 回傳的是螢幕像素，除以 scale 得原始大小
             但文字有 matrix transform，用 scrollWidth 更準確 */
          var textW = _siText.scrollWidth;
          /* matrix scale 也會影響視覺寬度 */
          var matStyle = window.getComputedStyle(_siText).transform;
          var matM = matStyle && matStyle.match(/matrix\(([^,]+)/);
          var matScale = matM ? parseFloat(matM[1]) : 1;
          var visTextW = textW * matScale;

          var visTextH = parseFloat(window.getComputedStyle(_siText).fontSize) * matScale;

          /* 整體寬度：logo + 26px 間距 + 副標視覺寬 */
          var totalW = _siLogoW + 26 + visTextW;

          /* 左右置中在文案區 */
          var startX = _siAreaCenter - totalW / 2;
          _siLogo.style.left = startX + 'px';
          _siText.style.left = (startX + _siLogoW + 26) + 'px';

          /* 上下置中：logo 和文字各自垂直置中 */
          _siLogo.style.top = ((_siCanvasH - _siLogoH) / 2) + 'px';
          _siText.style.top = ((_siCanvasH - visTextH) / 2) + 'px';
        }

        /* 等字型載完再算位置，避免 fallback 字型造成 scrollWidth 偏差 */
        window._siRelayout = siLayout;
        function runSiLayout() {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function() {
              siLayout();
            });
          } else {
            /* 不支援 document.fonts：延遲兩幀保守等待 */
            requestAnimationFrame(function(){
              requestAnimationFrame(siLayout);
            });
          }
        }
        runSiLayout();
      }
    } /* end search_image */

    /* CTA 永遠最上層，不被任何物件（商品圖、logo、掛標、蝦皮LOGO等）擋住。
       各版位對 CTA 的命名不一樣（cta底/逛逛去/cta三角標/放心買_安心退/
       逛逛去底/逛逛去三角標/cta圓底/cta白線/cta三角箭頭...），這裡把所有
       已知的 CTA 相關 class 一次性強制蓋成最高 z-index。 */
    (function _bnForceCtaTopmost(){
      var CTA_SELECTORS = [
        '.cta底', '.cta圓底', '.cta白線', '.cta三角標', '.cta三角箭頭', '.cta符號',
        '.逛逛去', '.逛逛去底', '.逛逛去三角標', '.放心買_安心退',
        '.cta-text', '.cta-arrow'
      ];
      canvas.querySelectorAll(CTA_SELECTORS.join(',')).forEach(function(el){
        el.style.setProperty('z-index', '10000', 'important');
        /* 若原本是 static 定位（沒有 position），z-index 不會生效，補上 relative */
        var pos = window.getComputedStyle(el).position;
        if(pos === 'static') el.style.position = 'relative';
      });
    })();

    /* 啟用畫布文字直接編輯 */
    attachEditableToAll();
  }

  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'bn-text') {
      var d = e.data.data||{};
      ['品牌名','主標','副標','日期','ICON獨立文案'].forEach(function(cls) {
        if (d[cls]===undefined) return;
        document.querySelectorAll('.'+cls).forEach(function(el) {
          var ct = el.querySelector('.cta-text');
          if(ct) ct.textContent = d[cls];
          else if(!el.children.length) el.textContent = d[cls];
        });
        /* Search_Image：副標案型七字內 連動副標（雙向同步）*/
        if(cls === '副標'){
          var siEl = document.querySelector('.副標案型七字內');
          if(siEl && !siEl.children.length) {
            siEl.textContent = d[cls];
            if(typeof window._siRelayout === 'function'){
              if(document.fonts && document.fonts.ready){
                document.fonts.ready.then(function(){ window._siRelayout(); });
              } else {
                setTimeout(window._siRelayout, 150);
              }
            }
          }
        }
        if(cls === '副標案型七字內'){
          var subEl = document.querySelector('.副標');
          /* 副標案型七字內 編輯時不反向同步到其他版位的 .副標，由 bn-text-update 統一處理 */
        }
      });
    }

    /* 畫布直接編輯完成後，父層轉換好再推回來 */
    if (e.data.type === 'bn-text-set') {
      var cls = e.data.field;
      var val = e.data.value;
      if(!cls) return;
      document.querySelectorAll('.'+cls).forEach(function(el) {
        var ct = el.querySelector('.cta-text');
        /* 編輯中不更新，避免跟 contenteditable 衝突 */
        if(el.contentEditable === 'true') return;
        if(ct) ct.textContent = val;
        else if(!el.children.length) el.textContent = val;
      });
    }

    if (e.data.type === 'bn-color') {
      var c = e.data.data||{}, cv = document.getElementById('canvas');
      /* SearchICON_LOGO / SearchICON_PRODUCT / SearchICON_TEXT 這三個版位的
         .背景色是圖示本身的圓形底色，使用者確認過：這個圓形範圍的底色
         要跟其他版位一樣，正常套用全域背景色設定，不用排除。
         （画布最外圍、圓角以外那一小圈的白底，是另一個獨立的東西，
         本來就沒有被這裡的邏輯影響過，不用特別處理。） */
      if (c.canvasBg) {
        /* 支援 .背景色 和 .bg 兩種 class 名稱 */
        var bg = cv.querySelector('.背景色') || cv.querySelector('.bg') || cv.querySelector('.底色');
        if(bg) bg.style.backgroundColor = c.canvasBg; else cv.style.background = c.canvasBg;
        /* 漸層顏色跟著背景色同步（讀 CSS --grad-dir 變數）*/
        /* 漸層顏色同步：transparent → rgba(r,g,b,0) 避免截圖變黑 */
        function _toRgba0rt(color){
          var m=color.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/);
          if(m) return 'rgba('+m[1]+','+m[2]+','+m[3]+',0)';
          var h=color.replace('#','');
          if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
          if(h.length===6) return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+',0)';
          return 'rgba(0,0,0,0)';
        }
        var _dirsRt = {'漸層左':'to right','漸層右':'to left','漸層上':'to bottom','漸層下':'to top'};
        ['漸層左','漸層右','漸層上','漸層下'].forEach(function(cls){
          var gel = cv.querySelector('.'+cls);
          if(!gel) return;
          var dir = _dirsRt[cls] || window.getComputedStyle(gel).getPropertyValue('--grad-dir').trim();
          if(dir){
            gel.style.background = 'linear-gradient(' + dir + ', ' + c.canvasBg + ' 0%, ' + _toRgba0rt(c.canvasBg) + ' 100%)';
          }
        });
        /* 所有保護色塊跟著背景色同步 */
        ['.文案保護','.右側保護','.左側保護','.上方保護','.下方保護','.上保護','.下保護','.底色'].forEach(function(sel){
          var el = cv.querySelector(sel);
          if(el) el.style.background = c.canvasBg;
        });
        /* .bg 純色塊也同步（Coin 等版位） */
        var bgEl2 = cv.querySelector('.bg');
        if(bgEl2 && !cv.querySelector('.背景色')) bgEl2.style.backgroundColor = c.canvasBg;
      }
      function ac(cls,col){ if(!col)return; document.querySelectorAll('.'+cls).forEach(function(el){ if(!el.querySelector('.cta-text')) el.style.color=col; }); }
      ac('主標',c.mainText); ac('副標',c.subText); ac('日期',c.dateText); ac('品牌名',c.brandText);
      /* Search_Image：副標案型七字內 顏色跟著副標文字色連動 */
      document.querySelectorAll('.副標案型七字內').forEach(function(el){ if(c.subText) el.style.setProperty('color', c.subText, 'important'); });
      /* SearchICON_TEXT：ICON獨立文案顏色跟著主標(mainText)連動——
         這兩個顏色在面板上是同一個顏色點(共用 mainText)，這裡負責
         把畫布上實際的文字顏色也同步過去。 */
      document.querySelectorAll('.ICON獨立文案').forEach(function(el){ if(c.mainText) el.style.setProperty('color', c.mainText, 'important'); });
      document.querySelectorAll('.cta-text').forEach(function(el){ if(c.ctaText) el.style.color=c.ctaText; });
      document.querySelectorAll('.cta-arrow').forEach(function(el){ if(c.ctaText) el.style.borderLeftColor=c.ctaText; });
      /* CTA 底色：.逛逛去按鈕 / .cta底 / .逛逛去底 */
      document.querySelectorAll('.逛逛去按鈕,.cta底,.逛逛去底').forEach(function(el){ if(c.ctaBg) el.style.backgroundColor=c.ctaBg; });
      /* Search Image CTA 底色：只影響 Search_Image 版型的圓形 CTA */
      document.querySelectorAll('.cta圓底').forEach(function(el){ if(c.searchImageCtaBg) el.style.setProperty('background-color', c.searchImageCtaBg, 'important'); });
      if(c.tagColor){
        if(typeof window._bnSetTagColor === 'function') window._bnSetTagColor(c.tagColor);
        else {
          _bnTagColor = (c.tagColor === 'white') ? 'white' : 'red';
          if(typeof window._bnApplyTag === 'function') window._bnApplyTag();
        }
      }
      if(c.logoColor){
        if(typeof window._bnSetLogoColor === 'function') window._bnSetLogoColor(c.logoColor);
        else {
          _bnLogoColor = (c.logoColor === 'orange') ? 'orange' : 'white';
          if(typeof window._bnApplyShopeeLogo === 'function') window._bnApplyShopeeLogo();
        }
      }
      /* CTA 文字色：.放心買_安心退 / .逛逛去 */
      document.querySelectorAll('.放心買_安心退,.逛逛去').forEach(function(el){ if(c.ctaText) el.style.color=c.ctaText; });
      /* CTA 三角色：.cta三角標 / .逛逛去三角標 */
      document.querySelectorAll('.cta三角標').forEach(function(el){ if(c.ctaText) el.style.borderLeftColor=c.ctaText; });
      document.querySelectorAll('.逛逛去三角標').forEach(function(el){ if(c.ctaText) el.style.borderLeftColor=c.ctaText; });
    }

    if (e.data.type === 'bn-logo' || e.data.type === 'bn-logos') {
      var zone = null;
      /* Search_Image2：依 logo index 分左右 zone */
      var _fname2 = decodeURIComponent(location.pathname.split('/').pop()).toLowerCase();
      if(_fname2.indexOf('search_image2') !== -1 || _fname2.indexOf('search_image3') !== -1){
        var logos2 = Array.isArray(e.data.logos) ? e.data.logos :
                     (e.data.src ? [e.data] : []);
        var _is3 = _fname2.indexOf('search_image3') !== -1;
        /* 2logo：左/右；3logo：左/中/右 */
        var _zoneNames = _is3
          ? ['logo範圍_左','logo範圍_中','logo範圍_右']
          : ['logo範圍_左','logo範圍_右'];
        function _siPlaceLogo(zn, lg){
          if(!zn||!lg) return;
          Array.from(zn.querySelectorAll('img.bn-logo-img')).forEach(function(i){i.remove();});
          zn.style.background = 'transparent'; zn.style.opacity = '1'; zn.style.overflow = 'hidden';
          zn.style.display = 'flex'; zn.style.alignItems = 'center'; zn.style.justifyContent = 'center';
          var img = new Image(); img.className = 'bn-logo-img';
          img.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;pointer-events:none;display:block;';
          if(lg.round) img.style.borderRadius = '10px';
          img.src = lg.src;
          zn.appendChild(img);
        }
        _zoneNames.forEach(function(cls, i){
          var zn = document.querySelector('.'+cls);
          if(logos2[i]) _siPlaceLogo(zn, logos2[i]);
        });
        return;
      }
      ['logo範圍','LOGO範圍'].forEach(function(n){ if(!zone){ var z=document.querySelector('.'+n); if(z) zone=z; } });
      if (!zone) return;

      Array.from(zone.querySelectorAll('img.bn-logo-img')).forEach(function(i){i.remove();});
      /* 還原 display 避免舊設定殘留 */
      zone.style.display = ''; zone.style.alignItems = '';

      var fn = decodeURIComponent(location.pathname.split('/').pop());
      var fnLow = fn.toLowerCase();
      var _logoZone = document.querySelector('.logo範圍') || document.querySelector('.LOGO範圍');
      var _logoIsWide = _logoZone &&
        (parseFloat(window.getComputedStyle(_logoZone).width) >
         parseFloat(window.getComputedStyle(_logoZone).height) * 1.5);
      /* HBN：檔名含 hbn，或已知左對齊版位 → 左對齊 absolute 並排 */
      var _leftAlignNames = ['hbn','coin','fb_post','lpbn'];
      var _isLeftAlign = _leftAlignNames.some(function(n){ return fnLow.indexOf(n) !== -1; });
      var isHBN = _isLeftAlign;
      /* 多張置中：logo範圍是橫條 且 不是左對齊版位 → flex 置中並排（ddcard橫、IG橫等）*/
      var isMultiCenter = !isHBN && !!_logoIsWide;
      /* IG方/ddcard方/Search_Image：單張 contain 置中 */
      var isIGSquare = !isHBN && !isMultiCenter &&
        (fn.indexOf('方') !== -1 || fnLow.indexOf('search_image') !== -1);
      /* ddcard：檔名含 ddcard */
      var isDDCard = fnLow.indexOf('ddcard') !== -1;
      /* 方 Logo 系列：不依「橫 Logo」文字判斷，而是針對實際上傳圖片比例做 fit。 */
      var isSquareLogoLayout = (fn.indexOf('方') !== -1);

      var logos = [];
      if (e.data.type === 'bn-logos') logos = e.data.logos || [];
      else if (e.data.dataUrl) logos = [{id:'single', src:e.data.dataUrl}];

      if (!logos.length) { zone.style.opacity=''; zone.style.background=''; return; }

      /* IG方 / 方 Logo 系列：只取第一張，避免方版 logo 區多張擠壓或裁切。 */
      if (isIGSquare || isSquareLogoLayout) logos = logos.slice(0, 1);
      /* ddcard橫：isMultiCenter → 多張，不限制；ddcard方（isIGSquare）→ 單張 */

      zone.style.background = 'transparent';
      zone.style.opacity    = '1';
      /* 不覆蓋 position，保持 CSS 的 absolute 定位 */
      zone.style.overflow   = 'hidden';

      function _fitHorizontalLogos(logosToPlace, alignMode){
        var gap = 15;
        var zoneW = parseFloat(window.getComputedStyle(zone).width) || 490;
        var zoneH = parseFloat(window.getComputedStyle(zone).height) || 50;
        var maxTotal = Math.min(490, zoneW);
        var imgs = [];
        /* 不要把 CSS 的 position:absolute 覆蓋成 relative。
           ddcard 橫 logo 的 .logo範圍 原本靠 CSS absolute 定位；
           工單匯入後 iframe 會重建並重新套 logo，如果這裡改成 relative，
           logo 區會掉回正常文件流，造成畫布上的 logo 往下偏移。 */
        var _zonePos = window.getComputedStyle(zone).position;
        if(!_zonePos || _zonePos === 'static') zone.style.position = 'relative';
        zone.style.overflow = 'visible';
        zone.style.display = 'block';
        zone.style.alignItems = '';
        zone.style.justifyContent = '';
        zone.style.gap = '';
        zone.style.transformOrigin = '';
        function relayout(){
          var widths = imgs.map(function(img){
            var ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
            return Math.min(200, Math.max(1, Math.round(zoneH * ratio)));
          });
          var total = widths.reduce(function(a,b){ return a + b; }, 0) + gap * Math.max(0, widths.length - 1);
          var scale = total > maxTotal ? (maxTotal - gap * Math.max(0, widths.length - 1)) / Math.max(1, widths.reduce(function(a,b){ return a + b; }, 0)) : 1;
          if(scale < 0) scale = maxTotal / Math.max(1, total);
          widths = widths.map(function(w){ return Math.max(1, Math.floor(w * Math.min(1, scale))); });
          total = widths.reduce(function(a,b){ return a + b; }, 0) + gap * Math.max(0, widths.length - 1);
          var x = alignMode === 'center' ? Math.max(0, (zoneW - total) / 2) : 0;
          imgs.forEach(function(img, i){
            img.style.position = 'absolute';
            img.style.left = Math.round(x) + 'px';
            img.style.top = '50%';
            img.style.transform = 'translateY(-50%)';
            img.style.width = widths[i] + 'px';
            img.style.height = 'auto';
            img.style.maxWidth = '200px';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            img.style.objectPosition = alignMode === 'center' ? 'center center' : 'left center';
            img.style.pointerEvents = 'none';
            img.style.display = 'block';
            x += widths[i] + gap;
          });
        }
        logosToPlace.forEach(function(lg){
          var img = new Image(); img.className = 'bn-logo-img';
          if(lg.round) img.style.borderRadius = '10px';
          img.onload = relayout;
          img.src = lg.src;
          imgs.push(img);
          zone.appendChild(img);
        });
        relayout();
      }

      /* HBN：absolute 多張；IG方/ddcard方：單張 contain 正方；IG橫/ddcard橫：受限並排 */
      if(isSquareLogoLayout){
        /* 方 Logo 系列：若上傳的是橫向 logo，改以寬度為主、高度 auto，並上下左右置中，避免被裁切。 */
        zone.style.display = 'flex';
        zone.style.alignItems = 'center';
        zone.style.justifyContent = 'center';
        zone.style.gap = '';
        zone.style.transformOrigin = '';
        var sqLg = logos[0];
        var sqImg = new Image(); sqImg.className = 'bn-logo-img';
        var sqRoundCss = sqLg.round ? 'border-radius:10px;' : '';
        sqImg.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;object-position:center center;pointer-events:none;display:block;flex-shrink:1;'+sqRoundCss;
        sqImg.onload = function(){
          var isWideLogo = sqImg.naturalWidth > sqImg.naturalHeight;
          if(isWideLogo){
            sqImg.style.width = '100%';
            sqImg.style.height = 'auto';
            sqImg.style.maxWidth = '100%';
            sqImg.style.maxHeight = '100%';
          }else{
            sqImg.style.width = 'auto';
            sqImg.style.height = 'auto';
            sqImg.style.maxWidth = '100%';
            sqImg.style.maxHeight = '100%';
          }
          if(typeof window._siRelayout === 'function'){
            if(document.fonts && document.fonts.ready){
              document.fonts.ready.then(function(){ window._siRelayout(); });
            } else {
              setTimeout(window._siRelayout, 150);
            }
          }
        };
        sqImg.src = sqLg.src;
        zone.appendChild(sqImg);
      } else if(isHBN){
        /* 橫式左齊：單張最多 200px；多 LOGO 含 15px 間距總寬最多 490px，且不超過 logo 範圍，避免裁切。 */
        _fitHorizontalLogos(logos, 'left');
      } else if(isMultiCenter){
        /* 橫式置中：單張最多 200px；多 LOGO 含 15px 間距總寬最多 490px，且不超過 logo 範圍，避免裁切。 */
        _fitHorizontalLogos(logos, 'center');
      } else if(isIGSquare){
        /* IG方：單張，依較大邊 contain 縮放，置中不裁切 */
        zone.style.display = 'flex';
        zone.style.alignItems = 'center';
        zone.style.justifyContent = 'center';
        zone.style.transformOrigin = '';
        var lg0 = logos[0];
        var img0 = new Image(); img0.className = 'bn-logo-img';
        var roundCss0 = lg0.round ? 'border-radius:10px;' : '';
        /* max-width/max-height 100% + width/height auto = contain 效果，不裁切 */
        img0.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;pointer-events:none;display:block;'+roundCss0;
        img0.src = lg0.src;
        img0.onload = function(){
          if(typeof window._siRelayout === 'function'){
              if(document.fonts && document.fonts.ready){
                document.fonts.ready.then(function(){ window._siRelayout(); });
              } else {
                setTimeout(window._siRelayout, 150);
              }
            }
        };
        zone.appendChild(img0);
      } else {
        /* 其他橫式：單張最多 200px；多 LOGO 含 15px 間距總寬最多 490px，且不超過 logo 範圍，避免裁切。 */
        _fitHorizontalLogos(logos, 'center');
      }    }

    /* 商品新增 */
    if (e.data.type === 'bn-product-add') {
      var pzone = getProductZone(); if(!pzone) return;
      var oldBox = pzone.querySelector('.bn-prod-box[data-id="'+e.data.id+'"]');
      if(oldBox) oldBox.remove();
      pzone.style.background = 'transparent'; pzone.style.opacity = '1';
      pzone.style.overflow = 'visible'; pzone.style.position = 'relative';
      var box = document.createElement('div');
      box.className = 'bn-prod-box'; box.dataset.id = e.data.id; box.dataset.ratio = e.data.ratio||1;
      box.dataset.sizeScale = e.data.sizeScale||1;
      box.dataset.position  = e.data.position !== undefined ? e.data.position : e.data.index || 0;
      if(e.data.layoutById || e.data.layout){
        var __bnid = getCurrentBnId();
        var __lay = (e.data.layoutById && (__bnid in e.data.layoutById) ? e.data.layoutById[__bnid] : null) || e.data.layout || null;
        if(__lay){
          box.dataset.savedLayout = JSON.stringify(__lay);
          box.dataset.manualLayout = '1';
        }
      }
      var pimg = document.createElement('img'); pimg.src = e.data.src;
      pimg.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;display:block;';
      box.appendChild(pimg);
      ['nw','ne','sw','se'].forEach(function(c){
        var h = document.createElement('div'); h.dataset.corner = c;
        h.style.cssText = 'position:absolute;width:14px;height:14px;border-radius:50%;background:#4a90e2;border:2px solid #fff;z-index:5;'
          +(c==='nw'?'left:-7px;top:-7px;cursor:nwse-resize;':'')
          +(c==='ne'?'right:-7px;top:-7px;cursor:nesw-resize;':'')
          +(c==='sw'?'left:-7px;bottom:-7px;cursor:nesw-resize;':'')
          +(c==='se'?'right:-7px;bottom:-7px;cursor:nwse-resize;':'');
        box.appendChild(h);
      });
      pzone.appendChild(box);
      setupProdDrag(box, pzone);
      layoutProducts(pzone);
      /* 立刻套用「目前已知」的人物可見度狀態，不要只靠 layoutProducts() 排版——
         排版只負責位置大小，不負責「這件商品該不該顯示」。如果有人物圖，
         這裡會把不該顯示的商品重新隱藏；下載/匯出流程資送 bn-product-add
         時沒有跟著送 bn-character-visibility，這裡改成主動套用已知狀態，
         才能保證下載結果跟畫布上看到的一致，不會把隱藏的商品秀出來。 */
      if(_bnSingleProductOnlyTemplate){
        applyCharacterVisibility(pzone, _bnLastCharVis.visibleIds && _bnLastCharVis.visibleIds.length ? [_bnLastCharVis.visibleIds[0]] : (_bnLastCharVis.topId!=null?[_bnLastCharVis.topId]:null));
      } else if(!_bnCharExcludedTemplate){
        applyCharacterVisibility(pzone, _bnLastCharVis.visibleIds);
      }
    }

    if (e.data.type === 'bn-product-remove') {
      var pzone = getProductZone(); if(!pzone) return;
      var el = pzone.querySelector('.bn-prod-box[data-id="'+e.data.id+'"]');
      if(el) el.remove();
      var remaining = pzone.querySelectorAll('.bn-prod-box');
      if(!remaining.length) { pzone.style.background=''; pzone.style.opacity=''; }
      else layoutProducts(pzone);
    }

    /* z-index 順序更新：order[0] = 最上層（z 最高） */
    if (e.data.type === 'bn-product-zorder') {
      var pzone = getProductZone(); if(!pzone) return;
      var order = e.data.order || [];
      var total = order.length;
      order.forEach(function(id, i){
        var box = pzone.querySelector('.bn-prod-box[data-id="'+id+'"]');
        if(box) box.style.zIndex = String(total - i + 10);
      });
    }

    /* 商品去背/裁切/擦除/影子編輯完成後，只換圖片內容，完全不動這件商品
       目前的位置/大小，也不觸發 layoutProducts() 重新排版——避免像
       remove 再 add 那樣讓其他商品的三角排版跟著跳動、造成畫面閃爍。 */
    if (e.data.type === 'bn-product-update-image') {
      var pzoneUpd = getProductZone(); if(!pzoneUpd) return;
      var boxUpd = pzoneUpd.querySelector('.bn-prod-box[data-id="'+e.data.id+'"]');
      if(boxUpd){
        var imgUpd = boxUpd.querySelector('img');
        if(imgUpd) imgUpd.src = e.data.src;
        boxUpd.dataset.ratio = e.data.ratio || boxUpd.dataset.ratio || 1;
      }
    }

    /* 人物圖跟商品「誰現在顯示」完全由面板端(bn-editor-plugin.js)決定並用這則訊息告知，
       不在這裡自行猜測——面板才知道目前 z-order 排序、目前可見商品有哪些。
       規則：0張人物->商品最多顯示3件(全開)，1張人物->最多2件，2張人物->完全不顯示。
       例外：SearchICON_PRODUCT 這個版位本身就只放得下一張商品圖（不是三角形排版），
       所以不管有幾張人物圖，都固定只顯示「目前最上層」那一件。 */
    if (e.data.type === 'bn-character-visibility') {
      /* 記住這次的結果，讓 bn-product-add 之後可以直接拿來用──
         不要每次都得靠「之後會不會再收到這則訊息」來決定可見度，
         下載/匯出流程（syncIframeForExport）只會重送 bn-product-add，
         不會跟著送這則可見度訊息，商品新增後如果沒有立刻套用可見度，
         原本應該隱藏的商品就會在下載時整個跑出來。 */
      _bnLastCharVis = {hasChar: !!e.data.hasChar, visibleIds: e.data.visibleIds || null, topId: e.data.topId};
      var pzoneVis = getProductZone(); if(!pzoneVis) return;
      if(_bnSingleProductOnlyTemplate){
        var onlyId = (e.data.visibleIds && e.data.visibleIds.length) ? [e.data.visibleIds[0]] : (e.data.topId!=null ? [e.data.topId] : null);
        applyCharacterVisibility(pzoneVis, onlyId);
        return;
      }
      if(_bnCharExcludedTemplate) return;
      applyCharacterVisibility(pzoneVis, e.data.visibleIds);
    }

    /* 人物圖新增/更新：
       - 掛在 #canvas 底下（不是商品範圍底下），所以可拖曳/放大到超出商品範圍。
       - #canvas 本身有 overflow:hidden，超出畫布的部分預覽時會自動裁掉，
         同時底層資料仍允許無限放大（可超出畫布）。
       - 預設：商品範圍右側 1/3 寬、高度 auto，垂直置中於商品範圍。
       - 一旦有人物圖，商品圖只顯示「目前最上層（排序最前面）」那一件，其餘暫時隱藏。
       - 這個功能不適用 SearchICON_LOGO / SearchICON_TEXT / SearchICON_PRODUCT /
         Search_Image1logo / Search_Image2logo / Search_Image3logo 這幾個版位。 */
    if (e.data.type === 'bn-character-add') {
      if(_bnCharExcludedTemplate) return;
      var canvasEl = document.getElementById('canvas');
      if(!canvasEl) return;
      var pzoneForChar = getProductZone();
      /* 人物現在掛在「商品範圍」容器裡面，跟商品是同一層的兄弟元素——
         這樣疊層比較才能直接套用跟商品完全一樣的方式（拿商品範圍裡面
         個別商品的 z-index 互相比較），不會被「商品範圍」這個容器本身的
         矩形範圍擋住。之前人物是掛在 #canvas 底下、商品範圍旁邊，商品範圍
         整個容器（一個涵蓋所有商品的矩形色塊）疊在人物前面時，會整塊把
         人物擋住，不是只擋住商品圖片本身的範圍——這才是「人物退到第二層
         會被商品範圍擋住、拖拉不到」的真正原因。
         商品範圍的 overflow 是 visible（bn-product-add 時設定），
         人物一樣可以視覺上超出商品範圍的框，最終只受 #canvas 的
         overflow:hidden 裁切，效果跟之前相同，不影響「可超出商品範圍」
         這個需求。
         現在最多可以有 2 個人物（人物1／人物2），用 data-slot 屬性
         （'_bnCharacter' 或 '_bnCharacter2'）分辨是哪一個人物的框，
         只移除、只更新「同一個 slot」自己的框，不會誤刪另一個人物。 */
      var charSlot = e.data.slot || '_bnCharacter';
      var parentEl = pzoneForChar || canvasEl;
      var old = parentEl.querySelector('.bn-char-box[data-slot="'+charSlot+'"]');
      if(!old && parentEl !== canvasEl) old = canvasEl.querySelector('.bn-char-box[data-slot="'+charSlot+'"]');
      if(old) old.remove();

      var box = document.createElement('div');
      box.className = 'bn-char-box';
      box.dataset.slot = charSlot;
      box.dataset.id = e.data.id || 'character';
      var ratio = parseFloat(e.data.ratio) || 1;
      box.dataset.ratio = ratio;

      var cimg = document.createElement('img');
      cimg.src = e.data.src;
      cimg.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;display:block;';
      box.appendChild(cimg);
      ['nw','ne','sw','se'].forEach(function(c){
        var h = document.createElement('div'); h.dataset.corner = c;
        h.style.cssText = 'position:absolute;width:14px;height:14px;border-radius:50%;background:#e2874a;border:2px solid #fff;z-index:5;'
          +(c==='nw'?'left:-7px;top:-7px;cursor:nwse-resize;':'')
          +(c==='ne'?'right:-7px;top:-7px;cursor:nesw-resize;':'')
          +(c==='sw'?'left:-7px;bottom:-7px;cursor:nesw-resize;':'')
          +(c==='se'?'right:-7px;bottom:-7px;cursor:nwse-resize;':'');
        box.appendChild(h);
      });

      /* 人物現在是商品範圍的子元素，預設位置/大小的計算基準改成
         商品範圍自己的寬高（不用再算商品範圍在畫布裡的偏移量）。
         沒有商品範圍時（理論上少見）才退回用畫布自己的寬高。
         人物2 的預設位置跟人物1 錯開一點（往左內縮一些），避免兩個人物
         剛上傳時完全疊在同一個位置，完全看不出來已經有2個人物。 */
      var zw, zh;
      if(pzoneForChar){
        zw = pzoneForChar.clientWidth || parseFloat(getComputedStyle(pzoneForChar).width) || 400;
        zh = pzoneForChar.clientHeight || parseFloat(getComputedStyle(pzoneForChar).height) || 300;
      } else {
        zw = parseFloat(getComputedStyle(canvasEl).width) || 400;
        zh = parseFloat(getComputedStyle(canvasEl).height) || 300;
      }
      var defaultW = zw / 3;
      var defaultH = defaultW / ratio;
      var defaultRightInset = charSlot === '_bnCharacter2' ? defaultW * 0.35 : 0;
      var L = zw - defaultW - defaultRightInset; /* 靠齊商品範圍右緣（人物2 往左內縮一點） */
      var T = (zh - defaultH) / 2;  /* 垂直置中於商品範圍 */
      var W = defaultW, H = defaultH;

      /* 若有先前手動調整過的位置（依目前版位 bnid 對應），優先套用；
         百分比一律換算成「相對於商品範圍自己」的寬高（配對的方/橫版位
         商品範圍尺寸不同時，換算出來的相對位置才正確）。 */
      var __bnid = getCurrentBnId();
      var __lay = (e.data.layoutById && (__bnid in e.data.layoutById)) ? e.data.layoutById[__bnid] : (e.data.layout || null);
      if(__lay){
        var pl = __lay.leftPct   !== undefined ? __lay.leftPct   * zw : __lay.left;
        var pt = __lay.topPct    !== undefined ? __lay.topPct    * zh : __lay.top;
        var pw = __lay.widthPct  !== undefined ? __lay.widthPct  * zw : __lay.width;
        var ph = __lay.heightPct !== undefined ? __lay.heightPct * zh : __lay.height;
        if(isFinite(pl) && isFinite(pt) && isFinite(pw) && isFinite(ph) && pw>0 && ph>0){
          L = pl; T = pt; W = pw; H = ph;
        }
      }

      box.style.cssText = 'position:absolute;left:'+L+'px;top:'+T+'px;width:'+W+'px;height:'+H+'px;'
        +'cursor:move;box-sizing:border-box;outline:2px solid transparent;';
      parentEl.appendChild(box);
      setupCharDrag(box, parentEl);

      /* aboveMain 現在存在 box 自己身上（每個人物各自獨立），
         不再用單一全域變數（否則兩個人物的前後狀態會互相覆蓋）。 */
      box.dataset.aboveMain = (e.data.aboveMain !== false) ? '1' : '0';
      applyCharacterZIndex();
    }

    if (e.data.type === 'bn-character-remove') {
      if(_bnCharExcludedTemplate) return;
      var charSlotRm = e.data.slot || '_bnCharacter';
      var canvasEl2 = document.getElementById('canvas');
      if(canvasEl2){
        var oldBox = canvasEl2.querySelector('.bn-char-box[data-slot="'+charSlotRm+'"]');
        if(oldBox) oldBox.remove();
      }
    }

    /* 人物圖去背/裁切/擦除/影子編輯完成後，只換圖片內容，完全不動目前的
       位置/大小/上下層——理由跟商品就地換圖一樣，避免整個重建造成閃跳。 */
    if (e.data.type === 'bn-character-update-image') {
      if(_bnCharExcludedTemplate) return;
      var canvasElUpd = document.getElementById('canvas'); if(!canvasElUpd) return;
      var charSlotUpd = e.data.slot || '_bnCharacter';
      var charBoxUpd = canvasElUpd.querySelector('.bn-char-box[data-slot="'+charSlotUpd+'"]');
      if(charBoxUpd){
        var cimgUpd = charBoxUpd.querySelector('img');
        if(cimgUpd) cimgUpd.src = e.data.src;
        charBoxUpd.dataset.ratio = e.data.ratio || charBoxUpd.dataset.ratio || 1;
      }
    }

    /* 背景圖：放到 .背景色（如有）或畫布底層 */
    if (e.data.type === 'bn-bg') {
      /* 支援 .背景色 和 .bg 兩種 class 名稱 */
      var bgContainer = document.querySelector('.背景色') || document.querySelector('.bg');
      var bimg2 = document.getElementById('底圖');
      var bgSrc   = e.data.src   || null;
      var bgFit   = e.data.fit   || 'cover';
      var bgScale = e.data.scale !== undefined ? e.data.scale : 100;
      var bgX     = e.data.x     !== undefined ? e.data.x     : 50;
      var bgY     = e.data.y     !== undefined ? e.data.y     : 50;

      /* background-size 根據模式計算 */
      var bgSize, bgPos;
      if(bgFit === 'cover'){
        bgSize = 'cover';
        bgPos  = bgX + '% ' + bgY + '%';
      } else if(bgFit === 'contain'){
        bgSize = 'contain';
        bgPos  = bgX + '% ' + bgY + '%';
      } else if(bgFit === 'height100'){
        /* 橫版畫布預設：背景圖高度放滿，寬度等比例 auto */
        bgSize = 'auto ' + bgScale + '%';
        var offsetXH = bgX - 50;
        var offsetYH = bgY - 50;
        bgPos = 'calc(50% + ' + offsetXH + '%) calc(50% + ' + offsetYH + '%)';
      } else if(bgFit === 'width100'){
        /* 直版/方版畫布預設：背景圖寬度放滿，高度等比例 auto */
        bgSize = bgScale + '% auto';
        var offsetXW = bgX - 50;
        var offsetYW = bgY - 50;
        bgPos = 'calc(50% + ' + offsetXW + '%) calc(50% + ' + offsetYW + '%)';
      } else {
        /* 原尺寸（auto）：用 background-size 百分比，從中心縮放
           技巧：position 設 50% 50%，size 設 scale%，
           這樣圖片中心固定在容器中心，往外放大 */
        bgSize = bgScale + '%';
        /* 以中心為基準：position 固定在 50% 50%，
           再用 background-position-x/y 微調偏移 */
        var offsetX = bgX - 50;  /* -50~+50 */
        var offsetY = bgY - 50;
        bgPos = 'calc(50% + ' + offsetX + '%) calc(50% + ' + offsetY + '%)';
      }

      if(bgSrc){
        if(bgContainer){
          bgContainer.style.backgroundImage    = 'url(' + bgSrc + ')';
          bgContainer.style.backgroundSize     = bgSize;
          bgContainer.style.backgroundPosition = bgPos;
          bgContainer.style.backgroundRepeat   = 'no-repeat';
        } else {
          if(bimg2){
            bimg2.src = bgSrc;
            bimg2.style.display = 'block';
            bimg2.style.objectFit = (bgFit === 'auto' || bgFit === 'height100' || bgFit === 'width100') ? 'none' : bgFit;
            bimg2.style.objectPosition = bgPos;
            if(bgFit === 'auto') bimg2.style.transform = 'scale(' + bgScale/100 + ')';
          }
        }
      } else {
        if(bgContainer) bgContainer.style.backgroundImage = '';
        if(bimg2){ bimg2.removeAttribute('src'); bimg2.style.display='none'; bimg2.style.transform=''; }
      }
      return;
    }

    /* 底圖核對：疊加半透明底圖 */
    if (e.data.type === 'bn-bg-overlay') {
      var overlay = document.getElementById('_bn_bg_overlay');
      if(!overlay){
        overlay = document.createElement('img');
        overlay.id = '_bn_bg_overlay';
        overlay.style.cssText = [
          'position:absolute;top:0;left:0;',
          'width:100%;height:100%;',
          'object-fit:contain;object-position:top left;',
          'z-index:10001;pointer-events:none;',
          'opacity:0.5;',
        ].join('');
        document.getElementById('canvas').appendChild(overlay);
      }
      if(e.data.src){
        overlay.style.display = 'none'; /* 先隱藏，load 成功再顯示 */
        overlay.onerror = function(){ overlay.style.display = 'none'; };
        overlay.onload  = function(){ overlay.style.display = 'block'; };
        overlay.src = e.data.src;
      } else {
        overlay.style.display = 'none';
        overlay.src = '';
      }
      return;
    }

    if (e.data.type === 'bn-product-layout-request') {
      postAllProductLayouts();
    }

    if (e.data.type === 'bn-product-layout-apply') {
      var pzoneApply = getProductZone(); if(!pzoneApply) return;
      var boxApply = pzoneApply.querySelector('.bn-prod-box[data-id="'+e.data.id+'"]');
      var lay = e.data.layout || {};
      if(boxApply){
        var csApply = window.getComputedStyle(pzoneApply);
        var zwApply = parseFloat(csApply.width) || pzoneApply.offsetWidth || 1;
        var zhApply = parseFloat(csApply.height) || pzoneApply.offsetHeight || 1;
        var l = lay.leftPct !== undefined ? lay.leftPct * zwApply : lay.left;
        var t = lay.topPct !== undefined ? lay.topPct * zhApply : lay.top;
        var w = lay.widthPct !== undefined ? lay.widthPct * zwApply : lay.width;
        var h = lay.heightPct !== undefined ? lay.heightPct * zhApply : lay.height;
        if(isFinite(l) && isFinite(t) && isFinite(w) && isFinite(h) && w > 0 && h > 0){
          w = Math.max(1, Math.min(w, zwApply));
          h = Math.max(1, Math.min(h, zhApply));
          l = Math.max(0, Math.min(zwApply - w, l));
          t = Math.max(0, Math.min(zhApply - h, t));
          boxApply.dataset.manualLayout = '1';
          boxApply.style.left = l + 'px';
          boxApply.style.top = t + 'px';
          boxApply.style.width = w + 'px';
          boxApply.style.height = h + 'px';
        }
      }
      return;
    }

    /* 人物圖跨配對版位（方/橫）即時同步：不夾在畫布範圍內，
       允許超出畫布——跟使用者手動拖曳/縮放時的行為一致。 */
    if (e.data.type === 'bn-character-layout-apply') {
      if(_bnCharExcludedTemplate) return;
      var canvasElApply = document.getElementById('canvas'); if(!canvasElApply) return;
      var pzoneApply = getProductZone();
      var charBoxApply = (pzoneApply || canvasElApply).querySelector('.bn-char-box[data-id="'+e.data.id+'"]');
      var layC = e.data.layout || {};
      if(charBoxApply){
        var refElApply = pzoneApply || canvasElApply;
        var cwApply = refElApply.clientWidth || parseFloat(getComputedStyle(refElApply).width) || 1;
        var chApply = refElApply.clientHeight || parseFloat(getComputedStyle(refElApply).height) || 1;
        var lc = layC.leftPct   !== undefined ? layC.leftPct   * cwApply : layC.left;
        var tc = layC.topPct    !== undefined ? layC.topPct    * chApply : layC.top;
        var wc = layC.widthPct  !== undefined ? layC.widthPct  * cwApply : layC.width;
        var hc = layC.heightPct !== undefined ? layC.heightPct * chApply : layC.height;
        if(isFinite(lc) && isFinite(tc) && isFinite(wc) && isFinite(hc) && wc>0 && hc>0){
          charBoxApply.style.left = lc + 'px';
          charBoxApply.style.top = tc + 'px';
          charBoxApply.style.width = wc + 'px';
          charBoxApply.style.height = hc + 'px';
        }
      }
      return;
    }

    if (e.data.type === 'bn-capture') {
      var _captureMsgId = e.data.msgId;

      function _doCaptureNow(){
      var _cv = document.getElementById('canvas');

      /* 隱藏所有編輯用控制元素（縮放點等），截完再還原 */
      var _editEls = [];
      if(_cv){
        _cv.querySelectorAll('[data-corner]').forEach(function(h){
          _editEls.push({el:h, disp:h.style.display});
          h.style.display = 'none';
        });
      }

      /* 下載補償①：未上傳 LOGO / 商品圖時，對應的粉紅色標示區塊
         （.logo範圍 / .商品範圍 等）只是編輯用的視覺輔助，不應出現在下載結果裡。
         沒有實際圖片子元素的區塊，截圖前先把底色蓋成透明，截完再還原成原本樣式，
         不影響回到編輯畫面時繼續顯示提示色塊。 */
      var _guideZoneEls = [];
      if(_cv){
        var _guideZoneSelectors = [
          '.商品範圍', '.商品圖範圍',
          '.logo範圍', '.LOGO範圍',
          '.logo範圍_左', '.logo範圍_中', '.logo範圍_右'
        ];
        _guideZoneSelectors.forEach(function(sel){
          _cv.querySelectorAll(sel).forEach(function(zn){
            var hasContent = zn.querySelector('.bn-prod-box') || zn.querySelector('img.bn-logo-img') || zn.querySelector('.bn-char-box');
            if(!hasContent){
              _guideZoneEls.push({el:zn, bg:zn.style.background, op:zn.style.opacity});
              zn.style.background = 'transparent';
              zn.style.opacity = '0';
            }
          });
        });
      }

      /* 下載補償②：商品圖／人物圖都是用 object-fit:contain 顯示，畫面上不會變形，
         但 html2canvas 不支援 object-fit，會把圖片直接拉滿容器造成比例跑掉。
         截圖前依「容器尺寸 + 圖片原始比例」算出實際等比顯示的寬高與置中位移，
         暫時把 <img> 改成該精確尺寸（不再依賴 object-fit），截完後還原，
         確保下載結果跟畫布上看到的比例完全一致。
         （人物圖之前沒有一併處理，導致某些人物框跟圖片原始比例差異較大的
         版位——例如 Coin_pageBN_APP方LOGO，商品範圍本身又寬又扁，人物預設
         框的比例因此跟人像照片常見的直式比例落差很大——下載出來的人物會被
         明顯拉寬變形。） */
      var _prodImgFix = [];
      if(_cv){
        _cv.querySelectorAll('.bn-prod-box > img, .bn-char-box > img').forEach(function(img){
          var nw = img.naturalWidth, nh = img.naturalHeight;
          var cw = img.clientWidth, ch = img.clientHeight;
          if(!nw || !nh || !cw || !ch) return;
          var scale = Math.min(cw / nw, ch / nh);
          var dw = Math.round(nw * scale);
          var dh = Math.round(nh * scale);
          var offX = Math.round((cw - dw) / 2);
          var offY = Math.round((ch - dh) / 2);
          _prodImgFix.push({img:img, cssText:img.style.cssText});
          img.style.cssText = 'position:absolute;left:'+offX+'px;top:'+offY+'px;width:'+dw+'px;height:'+dh+'px;max-width:none;max-height:none;pointer-events:none;display:block;';
        });
      }

      /* 真正解決 Search_Image1logo / SearchICON_TEXT 文字下載時往下掉很多的問題：
         這兩個版位的關鍵文字（.副標案型七字內 / .ICON獨立文案）都是先套用
         原始 .css 一次，再靠 config.css 用 !important 疊加覆蓋（transform:none、
         white-space:nowrap、line-height、font-size…等），兩個樣式表是分開的
         <link> 動態載入的。html2canvas 擷取畫面時會自己複製一份 DOM 重新套用
         樣式，如果它沒有正確重現「兩個樣式表疊加後的最終結果」——例如疊加
         順序跟真實瀏覽器不同、或漏掉 config.css 那層覆蓋——就會退回沒有
         nowrap、字級/行高不同、還帶著原始縮放 transform 的版本，文字很容易
         因此意外換行；這些文案的版面又是靠 line-height 把單行文字垂直置中，
         一旦意外多跳出一行，容器高度沒變，整段文字就會往下掉一大截。
         （之前 Search_Image1 有一個固定 +14px 的位移補償，那只是針對這個
         症狀的其中一種表現方式去猜一個數字治標，沒有真正解決「html2canvas
         沒有正確疊加樣式」這個根本問題，所以换了字數、換了版位條件就會失效。
         這次拿掉那個猜測值，改用下面更直接可靠的做法。）
         解法：截圖前，直接讀出「瀏覽器實際算出來、已經疊加完 config.css 覆蓋」
         的最終樣式（getComputedStyle），把這些關鍵屬性原封不動地寫成
         這個元素自己的 inline style（加 !important），讓 html2canvas
         不用再自己重新疊加、猜測樣式表的層疊順序，直接照抄目前畫面上
         真正呈現的樣子去截圖，跟樣式表怎麼疊加、載入順序為何完全無關。 */
      var _textStyleFixEls = [];
      if(_cv){
        var _TEXT_STYLE_FIX_PROPS = [
          'transform', 'whiteSpace', 'lineHeight', 'fontSize', 'fontWeight',
          'fontFamily', 'color', 'overflow', 'display', 'borderRadius', 'textAlign'
        ];
        ['.副標案型七字內', '.ICON獨立文案'].forEach(function(sel){
          _cv.querySelectorAll(sel).forEach(function(el){
            var cs = window.getComputedStyle(el);
            _textStyleFixEls.push({el:el, cssText:el.style.cssText});
            _TEXT_STYLE_FIX_PROPS.forEach(function(prop){
              try{
                var cssProp = prop.replace(/([A-Z])/g, function(m){ return '-'+m.toLowerCase(); });
                el.style.setProperty(cssProp, cs[prop], 'important');
              }catch(_){ }
            });
          });
        });
      }

      /* 上面的樣式烘焙解決了「意外換行、整段往下掉」的問題，但 Search_Image1logo
         這裡拿掉 transform 之後，html2canvas 對這個元素的實際擷取位置，
         跟瀏覽器活生生渲染出來的位置，還是有一個小落差（這次量到的方向是
         往上飄，比畫布上看到的位置還高）——這是 html2canvas 本身處理
         「原本有 transform、現在被移除」這種元素時的既有落差，不是樣式
         疊加的問題，兩者要分開處理，不能只做其中一個。
         這裡在樣式烘焙之後，額外針對這個元素量一次目前的 top，
         往下微調一個固定量做位置補償。如果之後測試發現落差數字跑掉，
         只需要調整 SEARCH_IMAGE1_SUBTITLE_OFFSET 這個數字即可。 */
      var SEARCH_IMAGE1_SUBTITLE_OFFSET = 14;
      var _captureAdjustEls = [];
      var _fnameLower = (fname || '').toLowerCase();
      if(_fnameLower.indexOf('search_image1') !== -1 && _cv){
        _cv.querySelectorAll('.副標案型七字內').forEach(function(el){
          var oldTop = el.style.top || '';
          var oldPriority = el.style.getPropertyPriority('top') || '';
          var currentTop = parseFloat(window.getComputedStyle(el).top) || 0;
          _captureAdjustEls.push({el:el, top:oldTop, priority:oldPriority});
          el.style.setProperty('top', (currentTop + SEARCH_IMAGE1_SUBTITLE_OFFSET) + 'px', 'important');
        });
      }

      captureCanvas(function(dataUrl){
        _editEls.forEach(function(o){ o.el.style.display = o.disp; });
        _guideZoneEls.forEach(function(o){ o.el.style.background = o.bg; o.el.style.opacity = o.op; });
        _prodImgFix.forEach(function(o){ o.img.style.cssText = o.cssText; });
        _textStyleFixEls.forEach(function(o){ o.el.style.cssText = o.cssText; });
        _captureAdjustEls.forEach(function(o){ o.el.style.setProperty('top', o.top, o.priority || ''); });
        window.parent.postMessage({type:'bn-snapshot',msgId:_captureMsgId,dataUrl:dataUrl},'*');
      });
      }

      /* 真正的根本原因（Search_Image1logo、SearchICON_TEXT 文字下載時往下掉很多）：
         截圖之前沒有等待自訂字型（ShopeeNotoSans）確認載入完成。如果截圖那一刻
         字型還沒套用完成，瀏覽器會先用備用字型計算文字寬度——備用字型通常比較寬，
         這些文案本來只有 1 行的短字（例如 ICON獨立文案限制 2 個字、
         副標案型七字內限制 7 個字），用備用字型量出來的寬度可能就超版、被迫換行；
         這些文案的 CSS 又是靠「line-height 等於容器高度」或類似手法把單行文字
         垂直置中，一旦意外變成兩行，容器高度沒變，文字就會整段往下掉很多。
         這不是只有這兩個版位才有的問題，是所有用這種置中手法的文字都可能中，
         只是這兩個版位的文字框比較窄、字數限制抓得比較剛好，換行機率才特別高。
         這裡改成截圖前先確定字型完全就緒再截圖，從根本解決，不用再逐一針對
         每個版位加減固定位移這種治標的做法。 */
      if(document.fonts && document.fonts.ready){
        document.fonts.ready.then(_doCaptureNow).catch(_doCaptureNow);
      } else {
        _doCaptureNow();
      }
    }
  });

  function getCurrentBnId(){
    try{ return String(new URLSearchParams(location.search||'').get('bnid') || ''); }
    catch(_){ return ''; }
  }

  function postProductLayout(box){
    try{
      var zone = getProductZone(); if(!zone || !box) return;
      var zr = zone.getBoundingClientRect();
      var br = box.getBoundingClientRect();
      var zw = zr.width || parseFloat(window.getComputedStyle(zone).width) || 1;
      var zh = zr.height || parseFloat(window.getComputedStyle(zone).height) || 1;
      var data = {
        type:'bn-product-layout-update',
        bnid:getCurrentBnId(),
        id:box.dataset.id,
        layout:{
          left: br.left - zr.left,
          top: br.top - zr.top,
          width: br.width,
          height: br.height,
          leftPct: (br.left - zr.left) / zw,
          topPct: (br.top - zr.top) / zh,
          widthPct: br.width / zw,
          heightPct: br.height / zh
        }
      };
      window.parent && window.parent.postMessage(data, '*');
    }catch(_){ }
  }

  function postAllProductLayouts(){
    try{
      var zone = getProductZone(); if(!zone) return;
      Array.from(zone.querySelectorAll('.bn-prod-box')).forEach(postProductLayout);
    }catch(_){ }
  }

  /* 這個版位是否不支援人物圖功能（SearchICON 系列版位太小、不適合疊人物）。
     只算一次即可，檔名不會在頁面存活期間變動。 */
  /* 記住最後一次收到的「人物可見度」狀態(hasChar/topId)，讓 bn-product-add
     新增商品時可以直接套用，不用等待下一次的 bn-character-visibility 訊息——
     下載/匯出流程重送商品時不會跟著送這則訊息，商品新增後如果只能等訊息才套用
     可見度，下載出來的圖就會把本該隱藏的第2、3層商品也顯示出來。 */
  var _bnLastCharVis = {hasChar:false, visibleIds:null, topId:null};

  var _bnCharExcludedTemplate = (function(){
    var EXCLUDED = [
      'SearchICON_LOGO', 'SearchICON_TEXT', 'SearchICON_PRODUCT',
      'Search_Image1logo', 'Search_Image2logo', 'Search_Image3logo'
    ];
    var name = decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/i, ''));
    return EXCLUDED.indexOf(name) !== -1;
  })();

  /* SearchICON_PRODUCT 這個版位本身只放得下一張商品圖（config.css 的 --layers
     只有「背景色、商品範圍」，不是三角形排版），不管有沒有人物圖，
     都固定只顯示目前最上層的那一件商品。 */
  var _bnSingleProductOnlyTemplate = (function(){
    var SINGLE = ['SearchICON_PRODUCT'];
    var name = decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/i, ''));
    return SINGLE.indexOf(name) !== -1;
  })();

  /* 哪些商品現在該顯示，完全由面板端(bn-editor-plugin.js)透過 bn-character-visibility
     訊息明確告知（visibleIds＝目前該顯示的商品 id 清單，依 z-order 由前到後排列），
     這裡只負責套用，不自己用 DOM 猜測「誰在最上層」。
     visibleIds 傳 null/undefined 代表「不限制，全部顯示」（沒有人物圖時就是這樣）。 */
  function applyCharacterVisibility(pzone, visibleIds){
    if(!pzone) return;
    var boxes = Array.from(pzone.querySelectorAll('.bn-prod-box'));
    var idSet = null;
    if(visibleIds){
      idSet = {};
      visibleIds.forEach(function(vid){ idSet[String(vid)] = true; });
    }
    boxes.forEach(function(b){
      var show = !idSet || idSet[String(b.dataset.id)];
      if(!show){
        b.dataset.charHidden = '1';
        b.style.display = 'none';
      } else {
        if(b.dataset.charHidden) delete b.dataset.charHidden;
        b.style.display = '';
      }
    });
    layoutProducts(pzone);
  }

  /* 人物圖跟「目前最上層（z-order 排序最前面）的那件商品」之間的上下層關係——
     不再鎖死是「主品(中)」；使用者拖動商品的上下層箭頭改變了誰在最上層，
     人物圖互動的對象也會跟著換成新的最上層商品。
     true＝人物在該商品前面（蓋住它），false＝人物在該商品後面（被蓋住）。
     現在最多可以有 2 個人物，各自的 aboveMain 狀態存在各自的 box
     dataset 上（data-above-main），不再共用同一個全域變數，
     否則兩個人物的前後狀態會互相覆蓋。 */
  function applyCharacterZIndex(){
    var pzone = getProductZone();
    var canvasEl = document.getElementById('canvas');
    var parentEl = pzone || canvasEl;
    if(!parentEl) return;
    var charBoxes = Array.from(parentEl.querySelectorAll('.bn-char-box'));
    if(!charBoxes.length) return;
    /* 人物現在是商品範圍的子元素，直接跟商品範圍裡的個別商品用同一套
       z-index 數字比較即可，不用再處理商品範圍容器本身、裝飾圖層的疊層問題——
       這些問題完全不會影響到商品彼此之間的疊層，人物現在跟商品「同一國」，
       自然也不會再被影響。商品目前用到的 z-index 數字最高大概在 20 出頭
       （zorder 公式 total-i+10，total 最多 3），用 1000／0 保證一定在最前面
       或最後面，不會跟任何商品的數字混在一起。兩個人物如果剛好都在前面
       （或都在後面），彼此之間的前後順序就交給 DOM 順序決定，不特別處理。 */
    charBoxes.forEach(function(charBox){
      var aboveMain = charBox.dataset.aboveMain !== '0';
      charBox.style.zIndex = aboveMain ? '1000' : '0';
      if(window.console && window.console.debug){
        console.debug('[bn-character]', charBox.dataset.slot, 'aboveMain=', aboveMain,
          'parent=', pzone ? '商品範圍(內部)' : '#canvas(找不到商品範圍)',
          'applied z-index=', charBox.style.zIndex);
      }
    });
  }

  /* 正三角排品（仿 freelyapp 邏輯）
     主品（第0張）居中最大，左配品（第1張）次之，右配品（第2張）最小
     底部對齊，所有尺寸以商品範圍 px 為單位，不超出邊界 */
  function layoutProducts(pzone) {
    /* 被人物圖暫時隱藏的商品不參與排版計算，讓剩下的商品（通常是主品）
       維持「單品置中」的正確大小，而不是仍照 3 件的比例縮小。 */
    var allBoxes = Array.from(pzone.querySelectorAll('.bn-prod-box:not([data-char-hidden="1"])'));
    var n = allBoxes.length; if(!n) return;

    /* 依 position 排序：0=主品，1=左配，2=右配 */
    var boxes = allBoxes.slice().sort(function(a,b){
      return (parseInt(a.dataset.position)||0) - (parseInt(b.dataset.position)||0);
    });

    /* 從 CSS 直接讀取 zone 的 width/height（不受 iframe 縮放影響） */
    var cs   = window.getComputedStyle(pzone);
    var zw   = parseFloat(cs.width)  || pzone.offsetWidth  || 400;
    var zh   = parseFloat(cs.height) || pzone.offsetHeight || 300;
    var PAD = 6;

    /* 寬高比 */
    var ratios = boxes.map(function(b){ return Math.max(0.1, parseFloat(b.dataset.ratio)||0.75); });

    /* 大小比例：主品1.0，左0.85，右0.72 */
    var wsMap = [1.0, 0.85, 0.72];
    var ov = 0;   /* 不重疊 */

    var r0 = ratios[0];
    var r1 = n>=2 ? ratios[1] : 0;
    var r2 = n>=3 ? ratios[2] : 0;
    var ws1 = n>=2 ? wsMap[1] : 0;
    var ws2 = n>=3 ? wsMap[2] : 0;

    /* 主品最大高度：預設 88%，若版位有 .cta底 則不超過 CTA 頂部 */
    var maxH0 = Math.floor(zh * 0.88);
    var ctaEl = document.querySelector('.cta底');
    if(ctaEl){
      var ctaTop    = parseFloat(window.getComputedStyle(ctaEl).top)   || 0;
      var pzoneTop  = parseFloat(window.getComputedStyle(pzone).top)   || 0;
      var ctaRelTop = ctaTop - pzoneTop - 8; /* 8px 間距 */
      if(ctaRelTop > 0 && ctaRelTop < zh){
        maxH0 = Math.min(maxH0, Math.floor(ctaRelTop * 0.96));
      }
    }

    /* 算主品寬度：讓三張總寬不超出可用寬（留 PAD*2） */
    /* 主品寬 w0，左品寬 w1=ws1*h0*r1，右品寬 w2=ws2*h0*r2 */
    /* h0 = w0/r0；總寬 = w0 + w1 + w2 = w0(1 + ws1*r1/r0 + ws2*r2/r0) */
    var spanFactor = 1 + ws1*r1/r0 + ws2*r2/r0;
    var GAP = n > 1 ? 8 : 0;
    var avail = zw - PAD*2 - GAP*(n-1);
    var w0 = Math.min(avail / spanFactor, maxH0 * r0);
    var h0 = w0 / r0;
    /* 再檢查高度上限 */
    if(h0 > maxH0){ h0 = maxH0; w0 = h0 * r0; }

    var w1 = n>=2 ? Math.round(ws1*h0*r1) : 0;
    var h1 = n>=2 ? Math.round(ws1*h0)    : 0;
    var w2 = n>=3 ? Math.round(ws2*h0*r2) : 0;
    var h2 = n>=3 ? Math.round(ws2*h0)    : 0;

    w0 = Math.round(w0); h0 = Math.round(h0);

    /* 底部 y 位置：優先使用 CTA 頂部上方，否則用 zone 底部 */
    var zoneBottom = zh - 4;
    if(ctaEl){
      var ctaTop2   = parseFloat(window.getComputedStyle(ctaEl).top)  || 0;
      var pzoneTop2 = parseFloat(window.getComputedStyle(pzone).top)  || 0;
      var ctaRel2   = ctaTop2 - pzoneTop2 - 8;
      if(ctaRel2 > 0 && ctaRel2 < zh) zoneBottom = ctaRel2;
    }

    /* 垂直置中：讓最高的商品（主品 h0）在商品範圍垂直置中
       配品底部跟主品底部對齊（維持底部齊） */
    var zoneTop = 4; /* 上邊界留 4px */
    var zoneH   = zoneBottom - zoneTop;
    /* 主品置中後的底部位置 */
    var centeredBot = zoneTop + Math.floor((zoneH + h0) / 2);
    /* 不超出 zoneBottom */
    var bot0 = Math.min(centeredBot, zoneBottom);
    var bot1 = bot0;
    var bot2 = bot0;

    /* 水平：主品居中，左品在左，右品在右 */
    var totalW = w0 + (n>=2 ? w1+GAP : 0) + (n>=3 ? w2+GAP : 0);
    var startX = Math.max(PAD, Math.floor((zw - totalW) / 2));

    /* 排列順序：左品、主品、右品（視覺上中間最大） */
    var positions = [];
    if(n===1){
      positions = [{box:boxes[0], x:startX, y:bot0-h0, w:w0, h:h0}];
    } else if(n===2){
      /* 左=小，右=主 or 左=主，右=小 → 左配+主 */
      positions = [
        {box:boxes[1], x:startX,          y:bot1-h1, w:w1, h:h1},  /* 左：第1張 */
        {box:boxes[0], x:startX+w1+GAP,   y:bot0-h0, w:w0, h:h0},  /* 右：主品 */
      ];
    } else {
      positions = [
        {box:boxes[1], x:startX,              y:bot1-h1, w:w1, h:h1},  /* 左 */
        {box:boxes[0], x:startX+w1+GAP,       y:bot0-h0, w:w0, h:h0},  /* 中（主品） */
        {box:boxes[2], x:startX+w1+GAP+w0+GAP, y:bot2-h2, w:w2, h:h2},  /* 右 */
      ];
    }

    positions.forEach(function(p, i){
      var saved = null;
      if(p.box.dataset.savedLayout){
        try{ saved = JSON.parse(p.box.dataset.savedLayout); }catch(_){ saved = null; }
        delete p.box.dataset.savedLayout;
      } else if(p.box.dataset.manualLayout === '1') {
        /* 已套用過手動/暫存位置的商品，後續新增其他商品時不可再被自動排版覆蓋。 */
        var curL = parseFloat(p.box.style.left);
        var curT = parseFloat(p.box.style.top);
        var curW = parseFloat(p.box.style.width);
        var curH = parseFloat(p.box.style.height);
        if(isFinite(curL) && isFinite(curT) && isFinite(curW) && isFinite(curH) && curW > 0 && curH > 0){
          saved = {left:curL, top:curT, width:curW, height:curH};
        }
      }
      if(saved){
        var sx = saved.leftPct !== undefined ? saved.leftPct * zw : saved.left;
        var sy = saved.topPct !== undefined ? saved.topPct * zh : saved.top;
        var sw = saved.widthPct !== undefined ? saved.widthPct * zw : saved.width;
        var sh = saved.heightPct !== undefined ? saved.heightPct * zh : saved.height;
        if(isFinite(sx) && isFinite(sy) && isFinite(sw) && isFinite(sh) && sw > 0 && sh > 0){
          p.x = Math.max(0, Math.min(zw - sw, sx));
          p.y = Math.max(0, Math.min(zh - sh, sy));
          p.w = Math.max(1, sw);
          p.h = Math.max(1, sh);
          p.box.dataset.manualLayout = '1';
        }
      }
      p.box.style.cssText = [
        'position:absolute;',
        'left:'+p.x+'px;top:'+p.y+'px;',
        'width:'+p.w+'px;height:'+p.h+'px;',
        'cursor:move;box-sizing:border-box;',
        'outline:2px solid transparent;',
        'z-index:'+(15-i)+';',
      ].join('');
    });
    setTimeout(postAllProductLayouts, 0);
  }

  function getProductZone(){
    var names=['商品範圍','商品圖範圍'];
    for(var i=0;i<names.length;i++){ var z=document.querySelector('.'+names[i]); if(z)return z; }
    return null;
  }

  function scheduleProductLayoutPost(box){
    if(!box) return;
    if(box._bnPostTimer) cancelAnimationFrame(box._bnPostTimer);
    box._bnPostTimer = requestAnimationFrame(function(){
      box._bnPostTimer = null;
      postProductLayout(box);
    });
  }

  function setupProdDrag(box,zone){
    var drag=null;
    box.addEventListener('pointerdown',function(e){
      if(e.target.dataset.corner) return;
      e.stopPropagation();
      var zr=zone.getBoundingClientRect(),br=box.getBoundingClientRect();
      drag={type:'move',sx:e.clientX,sy:e.clientY,l:br.left-zr.left,t:br.top-zr.top,w:br.width,h:br.height,zw:zr.width,zh:zr.height};
      box.setPointerCapture(e.pointerId); box.style.outline='2px solid #4a90e2';
    });
    box.querySelectorAll('[data-corner]').forEach(function(h){
      h.addEventListener('pointerdown',function(e){
        e.stopPropagation();
        var zr=zone.getBoundingClientRect(),br=box.getBoundingClientRect();
        drag={type:'resize',corner:h.dataset.corner,sx:e.clientX,sy:e.clientY,l:br.left-zr.left,t:br.top-zr.top,w:br.width,h:br.height,zw:zr.width,zh:zr.height,ratio:parseFloat(box.dataset.ratio)||1};
        h.setPointerCapture(e.pointerId); box.style.outline='2px solid #4a90e2'; e.preventDefault();
      });
      h.addEventListener('pointermove',function(e){
        if(!drag||drag.type!=='resize') return;
        var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,c=drag.corner,r=drag.ratio;
        var sX=c.includes('w')?-1:1,sY=c.includes('n')?-1:1;
        var delta=Math.abs(dx)>Math.abs(dy)?dx*sX:dy*sY*r;
        var w=Math.max(40,drag.w+delta),bh=w/r;
        if(bh<30){bh=30;w=bh*r;}
        var l=drag.l,t=drag.t;
        if(c.includes('w')) l=drag.l+(drag.w-w);
        if(c.includes('n')) t=drag.t+(drag.h-bh);
        l=Math.max(0,Math.min(drag.zw-w,l)); t=Math.max(0,Math.min(drag.zh-bh,t));
        box.dataset.manualLayout = '1';
        box.style.left=l+'px'; box.style.top=t+'px'; box.style.width=w+'px'; box.style.height=bh+'px';
        scheduleProductLayoutPost(box);
      });
      h.addEventListener('pointerup',function(){ postProductLayout(box); drag=null; });
      h.addEventListener('pointercancel',function(){ postProductLayout(box); drag=null; });
      h.addEventListener('lostpointercapture',function(){ postProductLayout(box); drag=null; });
    });
    box.addEventListener('pointermove',function(e){
      if(!drag||drag.type!=='move') return;
      box.dataset.manualLayout = '1';
      box.style.left=Math.max(0,Math.min(drag.zw-drag.w,drag.l+e.clientX-drag.sx))+'px';
      box.style.top =Math.max(0,Math.min(drag.zh-drag.h,drag.t+e.clientY-drag.sy))+'px';
      scheduleProductLayoutPost(box);
    });
    box.addEventListener('pointerup',function(){ postProductLayout(box); drag=null; box.style.outline='2px solid transparent'; });
    box.addEventListener('pointercancel',function(){ postProductLayout(box); drag=null; box.style.outline='2px solid transparent'; });
    box.addEventListener('lostpointercapture',function(){ postProductLayout(box); drag=null; box.style.outline='2px solid transparent'; });
    box.addEventListener('wheel',function(e){
      e.preventDefault();
      var zr=zone.getBoundingClientRect(),br=box.getBoundingClientRect();
      var sc=e.deltaY<0?1.08:.93,r=parseFloat(box.dataset.ratio)||1;
      var w=Math.max(40,Math.min(br.width*sc,zr.width*.95)),bh=w/r;
      if(bh<30){bh=30;w=bh*r;} if(bh>zr.height*.95){bh=zr.height*.95;w=bh*r;}
      var cx=(br.left-zr.left)+br.width/2,cy=(br.top-zr.top)+br.height/2;
      box.dataset.manualLayout = '1';
      box.style.left=Math.max(0,Math.min(cx-w/2,zr.width-w))+'px';
      box.style.top =Math.max(0,Math.min(cy-bh/2,zr.height-bh))+'px';
      box.style.width=w+'px'; box.style.height=bh+'px';
      postProductLayout(box);
    },{passive:false});
  }

  /* 人物圖拖曳/縮放：
     - 掛在 #canvas 底下而非商品範圍底下，位置不受商品範圍邊界限制。
     - 不做邊界夾制（可拖出、可放大超出畫布），視覺上超出部分由 #canvas 的
       overflow:hidden 自動裁掉，符合「可無限放大但預覽時不超出畫布」的需求。 */
  /* 注意：這裡的 canvasEl 參數，呼叫端(bn-character-add)現在傳進來的
     實際上是「商品範圍」(pzone)，不是 #canvas 本身──因為人物現在是
     商品範圍的子元素。函式內容不用因此改動，getBoundingClientRect()
     本來就是算相對於傳進來的這個參照元素，改成商品範圍一樣正確運作，
     只是百分比換算的基準也自然跟著變成「相對於商品範圍」。 */
  function postCharacterLayout(box, canvasEl){
    try{
      var cr = canvasEl.getBoundingClientRect(), br = box.getBoundingClientRect();
      var cw = cr.width || parseFloat(getComputedStyle(canvasEl).width) || 1;
      var ch = cr.height || parseFloat(getComputedStyle(canvasEl).height) || 1;
      var left = br.left - cr.left, top = br.top - cr.top, width = br.width, height = br.height;
      window.parent && window.parent.postMessage({
        type:'bn-character-layout-update', bnid:getCurrentBnId(), id:box.dataset.id,
        layout:{
          left:left, top:top, width:width, height:height,
          /* 百分比：畫布尺寸不同的「方/橫」配對版位靠這個換算對應位置，
             人物可以超出畫布，所以百分比允許 <0 或 >1，不夾在 0~1 之間。 */
          leftPct: left/cw, topPct: top/ch, widthPct: width/cw, heightPct: height/ch
        }
      }, '*');
    }catch(_){ }
  }

  function setupCharDrag(box, canvasEl){
    var drag=null;
    box.addEventListener('pointerdown',function(e){
      if(e.target.dataset.corner) return;
      e.stopPropagation();
      var cr=canvasEl.getBoundingClientRect(), br=box.getBoundingClientRect();
      drag={type:'move', sx:e.clientX, sy:e.clientY, l:br.left-cr.left, t:br.top-cr.top, w:br.width, h:br.height};
      box.setPointerCapture(e.pointerId); box.style.outline='2px solid #e2874a';
    });
    box.querySelectorAll('[data-corner]').forEach(function(h){
      h.addEventListener('pointerdown',function(e){
        e.stopPropagation();
        var br=box.getBoundingClientRect();
        drag={type:'resize', corner:h.dataset.corner, sx:e.clientX, sy:e.clientY,
          l:parseFloat(box.style.left)||0, t:parseFloat(box.style.top)||0,
          w:br.width, h:br.height, ratio:parseFloat(box.dataset.ratio)||1};
        h.setPointerCapture(e.pointerId); box.style.outline='2px solid #e2874a'; e.preventDefault();
      });
      h.addEventListener('pointermove',function(e){
        if(!drag||drag.type!=='resize') return;
        var dx=e.clientX-drag.sx, dy=e.clientY-drag.sy, c=drag.corner, r=drag.ratio;
        var sX=c.includes('w')?-1:1, sY=c.includes('n')?-1:1;
        var delta = Math.abs(dx)>Math.abs(dy) ? dx*sX : dy*sY*r;
        /* 僅限制最小尺寸，不設上限，允許放大到超出畫布範圍 */
        var w=Math.max(30, drag.w+delta), bh=w/r;
        if(bh<30){ bh=30; w=bh*r; }
        var l=drag.l, t=drag.t;
        if(c.includes('w')) l = drag.l + (drag.w - w);
        if(c.includes('n')) t = drag.t + (drag.h - bh);
        box.style.left=l+'px'; box.style.top=t+'px'; box.style.width=w+'px'; box.style.height=bh+'px';
      });
      h.addEventListener('pointerup', function(){ postCharacterLayout(box,canvasEl); drag=null; box.style.outline='2px solid transparent'; });
      h.addEventListener('pointercancel', function(){ postCharacterLayout(box,canvasEl); drag=null; box.style.outline='2px solid transparent'; });
      h.addEventListener('lostpointercapture', function(){ postCharacterLayout(box,canvasEl); drag=null; box.style.outline='2px solid transparent'; });
    });
    box.addEventListener('pointermove',function(e){
      if(!drag||drag.type!=='move') return;
      /* 刻意不夾制邊界：人物圖可以被拖到商品範圍外，甚至半個畫布外，
         超出畫布的部分交給 #canvas 的 overflow:hidden 自動裁掉即可。 */
      box.style.left=(drag.l+e.clientX-drag.sx)+'px';
      box.style.top =(drag.t+e.clientY-drag.sy)+'px';
    });
    box.addEventListener('pointerup', function(){ postCharacterLayout(box,canvasEl); drag=null; box.style.outline='2px solid transparent'; });
    box.addEventListener('pointercancel', function(){ postCharacterLayout(box,canvasEl); drag=null; box.style.outline='2px solid transparent'; });
    box.addEventListener('lostpointercapture', function(){ postCharacterLayout(box,canvasEl); drag=null; box.style.outline='2px solid transparent'; });
    box.addEventListener('wheel', function(e){
      e.preventDefault();
      var br=box.getBoundingClientRect();
      var sc = e.deltaY<0 ? 1.08 : .93, r = parseFloat(box.dataset.ratio)||1;
      var w = Math.max(30, br.width*sc), bh = w/r; /* 無上限：可無限放大超出畫布 */
      var cx = (parseFloat(box.style.left)||0) + br.width/2;
      var cy = (parseFloat(box.style.top)||0)  + br.height/2;
      box.style.left = (cx - w/2) + 'px';
      box.style.top  = (cy - bh/2) + 'px';
      box.style.width = w+'px'; box.style.height = bh+'px';
      postCharacterLayout(box, canvasEl);
    }, {passive:false});
  }

  /* ── 畫布文字直接點擊編輯 ── */
  var EDITABLE_CLASSES = ['主標','副標','副標案型七字內','日期','品牌名','ICON獨立文案'];
  var _dollarExemptSet = {};   /* {className: true} */

  /* ── 字數計算（中文1字，英數0.5字） ── */
  var CHAR_LIMITS = { '品牌名':9, '主標':8, '副標':7, '日期':14, 'ICON獨立文案':2 };

  function calcUnits(text){
    var units = 0;
    for(var i=0; i<text.length; i++){
      var c = text.charCodeAt(i);
      /* 中文、全形等 CJK 算 1，其餘算 0.5 */
      units += (text[i] === ',') ? 1 : ((c > 0x2E7F) ? 1 : 0.5);
    }
    return Math.round(units * 10) / 10;
  }

  function updateCharCounter(el, cls){
    var limit = CHAR_LIMITS[cls];
    if(!limit) return;
    var counter = document.getElementById('_bn_counter_'+cls);
    if(!counter) return;
    var text = el.textContent;
    var used = calcUnits(text);
    counter.textContent = used.toFixed(1) + ' / ' + limit + ' 字';
    counter.style.color = used > limit ? '#ef4444' : used > limit * 0.85 ? '#f59e0b' : '#687090';
  }

  function ensureCounter(el, cls){ /* 字數提示已移至左側工具列，此處為空 */ }

  function showCounter(el, cls){
    /* 通知父層（BN編輯器）更新字數顯示 */
    if(window.parent !== window){
      var limit = CHAR_LIMITS[cls] || 0;
      var used  = calcUnits(el.textContent);
      window.parent.postMessage({
        type:'bn-char-count', field:cls, used:used, limit:limit
      }, '*');
    }
  }

  function hideCounter(cls){
    if(window.parent !== window){
      window.parent.postMessage({type:'bn-char-count', field:cls, used:null}, '*');
    }
  }

  function trimToLimit(text, limit){
    var out = '';
    var sum = 0;
    text = String(text || '');
    for(var i=0; i<text.length; i++){
      var c = text.charCodeAt(i);
      var w = (text[i] === ',') ? 1 : ((c > 0x2E7F) ? 1 : 0.5);
      if(sum + w > limit) break;
      out += text[i];
      sum += w;
    }
    return out;
  }

  function enforceLimit(el, cls){
    var limit = CHAR_LIMITS[cls];
    if(!limit) return;
    var text = el.textContent;
    var units = calcUnits(text);
    if(units <= limit) return;
    var out = trimToLimit(text, limit);
    var sel = window.getSelection();
    el.textContent = out;
    var r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function getEditableSelectionOffsets(el){
    var sel = window.getSelection();
    var len = el.textContent.length;
    if(!sel || sel.rangeCount === 0) return {start:len,end:len};
    var range = sel.getRangeAt(0);
    if(!el.contains(range.startContainer) || !el.contains(range.endContainer)) return {start:len,end:len};
    var pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.startContainer, range.startOffset);
    var start = pre.toString().length;
    var preEnd = document.createRange();
    preEnd.selectNodeContents(el);
    preEnd.setEnd(range.endContainer, range.endOffset);
    var end = preEnd.toString().length;
    if(start > end){ var t=start; start=end; end=t; }
    return {start:start,end:end};
  }

  function wouldExceedLimit(el, cls, insertText){
    var limit = CHAR_LIMITS[cls];
    if(!limit) return false;
    var text = el.textContent || '';
    var pos = getEditableSelectionOffsets(el);
    var next = text.slice(0,pos.start) + String(insertText || '') + text.slice(pos.end);
    return calcUnits(next) > limit;
  }

  function flashEditLimit(el){
    el.style.outline = '1.5px solid #ef4444';
    clearTimeout(el._bnLimitTimer);
    el._bnLimitTimer = setTimeout(function(){
      el.style.outline = '1.5px solid rgba(74,144,226,.55)';
    }, 400);
  }

  function sanitizeEditableTextByClass(text, cls){
    text = String(text || '');
    if(cls === '主標' || cls === '副標' || cls === '副標案型七字內'){
      return text.replace(/[,，]/g, '');
    }
    return text;
  }

  /* ── makeEditable ── */
  function makeEditable(el, cls){
    if(el.dataset.bnEditBound === '1') return;
    el.dataset.bnEditBound = '1';
    el.style.cursor = 'text';

    var _editing = false;
    var _rightClickPending = false;  /* 右鍵選單開啟中，阻止 blur 關閉編輯 */

    function startEditing(clientX, clientY){
      if(_editing) return;
      _editing = true;
      el.contentEditable = 'true';
      el.style.outline = '1.5px solid rgba(74,144,226,.55)';
      el.style.borderRadius = '2px';
      requestAnimationFrame(function(){
        if(typeof clientX === 'number' && document.caretRangeFromPoint){
          var rng = document.caretRangeFromPoint(clientX, clientY);
          if(rng){ var s=window.getSelection(); s.removeAllRanges(); s.addRange(rng); }
        }
        showCounter(el, cls);
      });
    }

    function commitEdit(){
      _editing = false;
      el.contentEditable = 'false';
      el.style.outline = 'none';
      hideCounter(cls);
      _sendUpdate(el, cls);
    }

    el.addEventListener('mousedown', function(e){
      if(e.button === 2) return; /* 右鍵由 contextmenu 處理 */
      e.stopPropagation();
      startEditing(e.clientX, e.clientY);
    });

    el.addEventListener('beforeinput', function(e){
      if(e.inputType && e.inputType.indexOf('delete') === 0) return;
      if(e.isComposing) return;
      var rawInsert = e.data || '';
      var insert = sanitizeEditableTextByClass(rawInsert, cls);
      if(rawInsert && rawInsert !== insert){
        e.preventDefault();
        if(insert && !wouldExceedLimit(el, cls, insert)){
          try{ document.execCommand('insertText', false, insert); }catch(_){}
        }else{
          flashEditLimit(el);
          showCounter(el, cls);
        }
        return;
      }
      if(!insert && e.inputType !== 'insertText') return;
      if(wouldExceedLimit(el, cls, insert)){
        e.preventDefault();
        flashEditLimit(el);
        showCounter(el, cls);
      }
    });

    el.addEventListener('paste', function(e){
      var rawText = (e.clipboardData || window.clipboardData).getData('text') || '';
      var text = sanitizeEditableTextByClass(rawText, cls);
      if(rawText === text && !wouldExceedLimit(el, cls, text)) return;
      e.preventDefault();
      var limit = CHAR_LIMITS[cls];
      var cur = el.textContent || '';
      var pos = getEditableSelectionOffsets(el);
      var prefix = cur.slice(0, pos.start);
      var suffix = cur.slice(pos.end);
      var remaining = limit - calcUnits(prefix + suffix);
      var safe = trimToLimit(text, remaining);
      if(safe){
        try{ document.execCommand('insertText', false, safe); }
        catch(_){ el.textContent = prefix + safe + suffix; }
      }
      flashEditLimit(el);
      updateCharCounter(el, cls);
      showCounter(el, cls);
    });

    el.addEventListener('input', function(){
      updateCharCounter(el, cls);
      var limit = CHAR_LIMITS[cls];
      if(limit && calcUnits(el.textContent) > limit){
        enforceLimit(el, cls);
        updateCharCounter(el, cls);
        el.style.outline = '1.5px solid #ef4444';
        setTimeout(function(){ if(_editing) el.style.outline='1.5px solid rgba(74,144,226,.55)'; }, 400);
      }
      showCounter(el, cls);
    });

    el.addEventListener('blur', function(){
      if(_rightClickPending) return; /* 右鍵選單開啟中，不關閉編輯 */
      if(_editing) commitEdit();
    });

    el.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); commitEdit(); }
      if(e.key === 'Escape'){
        _editing = false;
        el.contentEditable = 'false';
        el.style.outline = 'none';
        hideCounter(cls);
        if(window.parent !== window){
          window.parent.postMessage({type:'bn-text-cancel', field:cls}, '*');
        }
      }
    });

    el.addEventListener('contextmenu', function(e){
      e.preventDefault(); e.stopPropagation();

      /* 確保進入編輯模式 */
      if(!_editing) startEditing(e.clientX, e.clientY);

      /* 立刻把選取的文字和位置存下來 */
      var savedSelText = '';
      var savedStart = -1;
      var savedEnd   = -1;
      var sel = window.getSelection();
      if(sel && sel.rangeCount > 0 && !sel.isCollapsed){
        savedSelText = sel.toString();
        var range = sel.getRangeAt(0);
        var preRange = document.createRange();
        preRange.selectNodeContents(el);
        preRange.setEnd(range.startContainer, range.startOffset);
        savedStart = preRange.toString().length;
        savedEnd   = savedStart + savedSelText.length;
      }

      _rightClickPending = true;
      showCanvasTextMenu(e, el, cls, savedSelText, savedStart, savedEnd, function onMenuClose(){
        _rightClickPending = false;
      });
    });
  }

  /* sba.html 同款：工具函式 */
  function _cleanNum(t){ return t.replace(/[$,]/g,'').trim(); }
  function _isNumeric(t){ var c=_cleanNum(t); return /^\d+$/.test(c) && c.length>0; }
  function _addThousands(d){ return String(d).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
  function _fmtDollar(n){ return '$'+(n.length>=4?_addThousands(n):n); }
  function _getExempt(el){ try{ return JSON.parse(el.dataset.dollarExempt||'[]'); }catch(_){ return []; } }
  function _setExempt(el, list){
    if(list.length) el.dataset.dollarExempt = JSON.stringify(list);
    else el.removeAttribute('data-dollar-exempt');
  }
  function _replaceSelText(savedRange, text){
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(savedRange);
    try{ document.execCommand('insertText', false, text); }
    catch(_){
      savedRange.deleteContents();
      var node = document.createTextNode(text);
      savedRange.insertNode(node);
      sel.removeAllRanges(); sel.collapse(node, node.length);
    }
  }

  function _sendUpdate(el, cls){
    var text = el.textContent.trim();
    /* 把豁免清單一起送出，父層用這個清單跳過對應數字的 $ 格式化 */
    var exemptList = _getExempt(el);
    if(window.parent !== window){
      window.parent.postMessage({
        type:'bn-text-update', field:cls, value:text,
        dollarExempt: exemptList.length > 0 ? exemptList : false
      }, '*');
    }
  }

  function showCanvasTextMenu(e, el, cls, savedSelText, savedStart, savedEnd, onMenuClose){
    var existing = document.getElementById('_bn_canvas_ctx');
    if(existing) existing.remove();

    /* 只有選取的是純數字才顯示選單（同 sba.html） */
    var savedRange = null;
    var sel = window.getSelection();
    if(sel && sel.rangeCount > 0 && !sel.isCollapsed){
      savedRange = sel.getRangeAt(0).cloneRange();
    }

    var cleanSel  = _cleanNum(savedSelText);
    var isNumSel  = _isNumeric(savedSelText);
    var hasDollar = savedSelText.indexOf('$') !== -1;
    var exemptList = _getExempt(el);
    var alreadyExempt = exemptList.indexOf(cleanSel) !== -1;

    /* 如果沒有選取數字，不顯示選單 */
    if(!savedSelText){ return; }

    var menu = document.createElement('div');
    menu.id = '_bn_canvas_ctx';
    menu.style.cssText=[
      'position:fixed;z-index:999999;',
      'background:#1a1d2a;border:1px solid #2e3347;',
      'border-radius:10px;padding:6px 0;',
      'box-shadow:0 8px 24px rgba(0,0,0,.5);',
      'min-width:200px;font-size:13px;',
    ].join('');

    function menuBtn(label, handler){
      var btn = document.createElement('div');
      btn.textContent = label;
      btn.style.cssText = 'padding:8px 16px;cursor:pointer;color:#dde3f0;white-space:nowrap;';
      btn.addEventListener('mouseenter', function(){ btn.style.background='#2b2f42'; });
      btn.addEventListener('mouseleave', function(){ btn.style.background=''; });
      btn.addEventListener('mousedown', function(ev){
        ev.preventDefault();
        menu.remove();
        if(typeof onMenuClose === 'function') onMenuClose();
        handler();
        setTimeout(function(){ el.focus(); }, 0);
      });
      menu.appendChild(btn);
    }

    if(isNumSel){
      if(alreadyExempt || !hasDollar){
        /* 恢復：補回 $ 千分位，從豁免清單移除 */
        menuBtn('恢復 $'+_addThousands(cleanSel)+' 的千分位格式', function(){
          var list = _getExempt(el).filter(function(n){ return n !== cleanSel; });
          _setExempt(el, list);
          if(savedRange) _replaceSelText(savedRange, _fmtDollar(cleanSel));
          _sendUpdate(el, cls);
        });
      } else {
        /* 移除：拿掉 $ 和千分位，加入豁免清單 */
        menuBtn('暫時不加$和千分位符號', function(){
          var list = _getExempt(el);
          if(list.indexOf(cleanSel) === -1) list.push(cleanSel);
          _setExempt(el, list);
          if(savedRange) _replaceSelText(savedRange, cleanSel);
          _sendUpdate(el, cls);
        });
      }
    } else {
      /* 非純數字的選取：整段文字豁免選項 */
      menuBtn('暫時不加$和千分位符號（整段）', function(){
        /* 把選取範圍的所有數字加進豁免清單，並移除 $ */
        var nums = savedSelText.match(/\d+/g) || [];
        var list = _getExempt(el);
        nums.forEach(function(n){ if(list.indexOf(n)===-1) list.push(n); });
        _setExempt(el, list);
        var cleaned = savedSelText.replace(/\$/g,'').replace(/(\d),(\d{3})(?!\d)/g,'$1$2');
        if(savedRange) _replaceSelText(savedRange, cleaned);
        _sendUpdate(el, cls);
      });
    }

    menu.style.left = Math.min(e.clientX, window.innerWidth  - 230) + 'px';
    menu.style.top  = Math.min(e.clientY, window.innerHeight - 80)  + 'px';
    document.body.appendChild(menu);
    menu.tabIndex = -1;

    document.addEventListener('mousedown', function rm(ev){
      if(!menu.contains(ev.target)){
        menu.remove();
        document.removeEventListener('mousedown', rm);
        if(typeof onMenuClose === 'function') onMenuClose();
      }
    });
  }
  function attachEditableToAll(){
    EDITABLE_CLASSES.forEach(function(cls){
      document.querySelectorAll('.'+cls).forEach(function(el){
        makeEditable(el, cls);
      });
    });
  }

  function captureCanvas(cb){
    function runAfterFonts(){
      if(window.html2canvas){doCapture(cb);return;}
      var s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload=function(){doCapture(cb);}; s.onerror=function(){if(cb)cb(null);};
      document.head.appendChild(s);
    }
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(runAfterFonts).catch(runAfterFonts);
    } else {
      runAfterFonts();
    }
  }
  function doCapture(cb){
    var cv=document.getElementById('canvas');
    if(!cv){if(cb)cb(null);return;}
    var W = parseFloat(cv.style.width)  || cv.offsetWidth;
    var H = parseFloat(cv.style.height) || cv.offsetHeight;
    if(!W||!H){if(cb)cb(null);return;}

    /* 截圖策略：所見即所得
       直接對目前已渲染的畫面截圖，不移動 canvas、不重算任何位置。
       用目前的 scale 反推，讓 html2canvas 輸出符合設計原始尺寸。*/

    var scaleMatch = cv.style.transform && cv.style.transform.match(/scale\(([\d.]+)\)/);
    var scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    var overlay = document.getElementById('_bn_bg_overlay');
    if(overlay) overlay.style.display = 'none';

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        html2canvas(cv,{
          scale: 1 / scale,   /* 把螢幕縮放還原回設計原始尺寸 */
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          width: W,
          height: H,
          logging: false
        })
        .then(function(c){
          if(overlay) overlay.style.display = '';
          var out = document.createElement('canvas');
          out.width = W; out.height = H;
          out.getContext('2d').drawImage(c, 0, 0, out.width, out.height);
          if(cb) cb(out.toDataURL('image/png'));
        })
        .catch(function(){
          if(overlay) overlay.style.display = '';
          if(cb) cb(null);
        });
      });
    });
  }

  function applyColor(cls,color){
    if(!color)return;
    document.querySelectorAll('.'+cls).forEach(function(el){
      if(!el.querySelector('.cta-text')) el.style.color=color;
    });
  }
})();

})();

/* BN_FORCE_CTA_REGULAR_20260701 */
(function(){
  try {
    var css = '.放心買_安心退,.逛逛去,.cta-text{font-family:"ShopeeNotoSans (content)" !important;font-weight:300 !important;font-style:normal !important;}';
    var style = document.createElement('style');
    style.setAttribute('data-bn-cta-regular','1');
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  } catch(e) {}
})();
