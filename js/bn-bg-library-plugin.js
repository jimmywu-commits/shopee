
  function resolveBgImgUrl(src){
    src = String(src || '').trim();
    if(!src) return '';
    if(/^data:/i.test(src) || /^https?:\/\//i.test(src)) return src;
    src = src.replace(/^\.?\/*/, '');
    src = src.replace(/^bgimgn\//i, '');
    src = src.replace(/^bgimg\//i, '');
    return IMG_BASE_URL.replace(/\/?$/, '/') + src;
  }

/* BN Background Library Plugin
   支援 HBN 同款 bgimg/index.json 圖庫結構：
   bgimg/
   ├─ EL/Fashion/FMCG/Lifestyle
   │  ├─ HBN/
   │  └─ DDCARD/
   ├─ brand.json
   └─ index.json

   用法：在 bn.html 最後載入本檔。
   按「上傳背景圖」時會先開圖庫；只有按「📤 上傳自己的圖片」才會放行原本的上傳流程。
*/
(function(){
  'use strict';
  if(window.__BN_BG_LIBRARY_PLUGIN_READY__) return;
  window.__BN_BG_LIBRARY_PLUGIN_READY__ = true;

  var CFG = window.BN_BG_LIBRARY_CONFIG || {};
  var MANIFEST_URL = CFG.manifestUrl || 'bgimg/index.json';
  var BRAND_URL = CFG.brandUrl || 'bgimg/brand.json';
  var IMG_BASE_URL = CFG.imgBaseUrl || 'bgimg/';
  var CATEGORIES = CFG.categories || ['EL','Fashion','FMCG','Lifestyle'];
  var DEFAULT_IMAGES = CFG.images || [];

  var modal, grid, tabsEl, searchEl, statusEl, selectedEl, applyBtn;
  var allowNativeUploadOnce = false;
  var pendingNativeTarget = null;
  var imagesLoaded = false;
  var indexData = null;
  var brandData = null;
  var currentCat = CATEGORIES[0];
  var searchQuery = '';
  var cards = [];
  var selected = null;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function isImageFile(s){ return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(String(s||'')); }
  function cleanFileName(s){ return String(s||'').split('/').pop().replace(/\.[^.]+$/,''); }
  function encodeSrc(src){
    if(/^data:|^https?:/i.test(src)) return src;
    return String(src||'').split('/').map(function(seg){
      try { return encodeURIComponent(decodeURIComponent(seg)); }
      catch(_) { return encodeURIComponent(seg); }
    }).join('/');
  }


  function sampleTopLeftColor(src){
    return new Promise(function(resolve){
      if(!src) return resolve(null);
      var img = new Image();
      if(!/^data:/i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = function(){
        try{
          var c = document.createElement('canvas');
          c.width = 1;
          c.height = 1;
          var ctx = c.getContext('2d', { willReadFrequently:true });
          ctx.drawImage(img, 0, 0, 1, 1);
          var d = ctx.getImageData(0, 0, 1, 1).data;
          resolve(rgbToHex(d[0], d[1], d[2]));
        }catch(_){ resolve(null); }
      };
      img.onerror = function(){ resolve(null); };
      img.src = resolveBgImgUrl(src);
    });
  }

  function rgbToHex(r,g,b){
    function h(n){ n = Math.max(0, Math.min(255, n|0)); return n.toString(16).padStart(2,'0'); }
    return '#' + h(r) + h(g) + h(b);
  }

  function applySampledCanvasBg(src){
    return sampleTopLeftColor(src).then(function(hex){
      if(!hex) return null;
      if(typeof window._bnSetAuthoritativeCanvasBg === 'function'){
        try{ window._bnSetAuthoritativeCanvasBg(hex); }catch(_){ }
      }
      if(window.colorState) window.colorState.canvasBg = hex;
      var dot = document.getElementById('dot-canvasBg');
      if(dot) dot.style.background = hex;
      var hexInp = document.getElementById('cp-hex-input');
      if(window.cpActiveKey === 'canvasBg' && hexInp) hexInp.value = hex;
      if(typeof window.broadcastColors === 'function'){
        try{ window.broadcastColors(); }catch(_){ }
      }
      try{ document.dispatchEvent(new CustomEvent('bn-state-dirty')); }catch(_){ }
      if(typeof window.applyAutoTextPalette === 'function'){
        var sampled = typeof window.sampleBackgroundColors === 'function'
          ? window.sampleBackgroundColors(src) : Promise.resolve(null);
        Promise.resolve(sampled).then(function(samples){
          window.applyAutoTextPalette(samples && samples.canvasBg ? samples.canvasBg : hex,
            samples && samples.visualBg ? samples.visualBg : hex);
        });
      }
      return hex;
    });
  }

  function pickSampleSourceFromStates(states){
    if(!states) return null;
    var keys = Object.keys(states);
    for(var i=0;i<keys.length;i++){
      var st = states[keys[i]];
      if(st && st.src) return st.src;
    }
    return null;
  }

  function installBgColorSamplingHooks(){
    if(window.__BN_BG_COLOR_SAMPLING_HOOKS__) return;
    window.__BN_BG_COLOR_SAMPLING_HOOKS__ = true;

    var nativeSetBgStates = window._bnSetBgStates;
    if(typeof nativeSetBgStates === 'function' && !nativeSetBgStates.__bnColorWrapped){
      var wrappedSetBgStates = function(states, activeId){
        var ret = nativeSetBgStates.apply(this, arguments);
        var src = pickSampleSourceFromStates(states);
        if(src) applySampledCanvasBg(src);
        return ret;
      };
      wrappedSetBgStates.__bnColorWrapped = true;
      window._bnSetBgStates = wrappedSetBgStates;
    }

    var nativeBroadcastBg = window.broadcastBg;
    if(typeof nativeBroadcastBg === 'function' && !nativeBroadcastBg.__bnColorWrapped){
      var wrappedBroadcastBg = function(src){
        var ret = nativeBroadcastBg.apply(this, arguments);
        if(src) applySampledCanvasBg(src);
        return ret;
      };
      wrappedBroadcastBg.__bnColorWrapped = true;
      window.broadcastBg = wrappedBroadcastBg;
    }

    document.addEventListener('change', function(e){
      var input = e.target;
      if(!input || !input.matches || !input.matches('input[type="file"]')) return;
      var meta = ((input.id||'') + ' ' + (input.name||'') + ' ' + (input.className||'') + ' ' + (input.accept||'')).toLowerCase();
      if(meta.indexOf('bg') === -1 && meta.indexOf('背景') === -1) return;
      var file = input.files && input.files[0];
      if(!file || !/^image\//i.test(file.type || '')) return;
      var fr = new FileReader();
      fr.onload = function(ev){ applySampledCanvasBg(ev.target.result); };
      try{ fr.readAsDataURL(file); }catch(_){ }
    }, true);
  }
  function extractNum(filename){
    var base = String(filename||'').replace(/\.[^.]+$/, '');
    base = base.replace(/\bHBN\d*\b/gi, '').replace(/\bDDCARD\d*\b/gi, '');
    var matches = base.match(/[_-](\d+)/g);
    if(matches){
      var nums = matches.map(function(m){ return parseInt(m.slice(1),10); }).filter(function(n){ return n < 1000; });
      if(nums.length){
        if(nums.length > 1 && nums[nums.length-1] === 1) return nums[nums.length-2];
        return nums[nums.length-1];
      }
    }
    var matches2 = base.match(/[a-zA-Z](\d+)/g);
    if(matches2){
      var nums2 = matches2.map(function(m){ return parseInt(m.slice(1),10); }).filter(function(n){ return n < 1000; });
      if(nums2.length) return nums2[nums2.length-1];
    }
    return null;
  }

  function ensureStyle(){
    if(document.getElementById('bn-bglib-style')) return;
    var style = document.createElement('style');
    style.id = 'bn-bglib-style';
    style.textContent = [
      '.bn-bglib-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2147483000;display:none;align-items:center;justify-content:center;padding:24px}',
      '.bn-bglib-overlay.open{display:flex}',
      '.bn-bglib-modal{width:min(1040px,96vw);max-height:90vh;background:#111827;border:1px solid #30363d;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.65);display:flex;flex-direction:column;overflow:hidden;color:#e6edf3;font-family:"Segoe UI","PingFang TC",Arial,sans-serif}',
      '.bn-bglib-head{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#161b22;border-bottom:1px solid #30363d}',
      '.bn-bglib-head h3{font-size:15px;margin:0;white-space:nowrap}',
      '.bn-bglib-search{flex:1;min-width:160px;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#e6edf3;padding:7px 10px;outline:none}',
      '.bn-bglib-close{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:8px;padding:6px 10px;cursor:pointer}',
      '.bn-bglib-tabs{display:flex;gap:8px;padding:12px 16px 0;background:#111827;flex-wrap:wrap}',
      '.bn-bglib-tab{background:#1c2333;color:#8b949e;border:1px solid #30363d;border-radius:999px;padding:6px 13px;font-size:12px;font-weight:700;cursor:pointer}',
      '.bn-bglib-tab.active{background:#1f6feb;color:#fff;border-color:#388bfd}',
      '.bn-bglib-body{padding:14px 16px 16px;overflow:auto}',
      '.bn-bglib-status{color:#8b949e;font-size:12px;margin-bottom:12px}',
      '.bn-bglib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}',
      '.bn-bglib-card{background:#1c2333;border:1px solid #30363d;border-radius:10px;overflow:hidden;cursor:pointer;text-align:left;color:#e6edf3;transition:transform .12s,border-color .12s;position:relative}',
      '.bn-bglib-card:hover{transform:translateY(-2px);border-color:#388bfd}',
      '.bn-bglib-card.selected{border-color:#58a6ff;box-shadow:0 0 0 2px rgba(88,166,255,.24)}',
      '.bn-bglib-thumb{height:108px;background:#0d1117;display:flex;align-items:center;justify-content:center;overflow:hidden}',
      '.bn-bglib-thumb img{width:100%;height:100%;object-fit:cover;display:block}',
      '.bn-bglib-name{padding:8px 9px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.bn-bglib-check{position:absolute;right:8px;top:8px;width:22px;height:22px;border-radius:50%;background:#1f6feb;color:#fff;display:none;align-items:center;justify-content:center;font-weight:900}',
      '.bn-bglib-card.selected .bn-bglib-check{display:flex}',
      '.bn-bglib-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 16px;background:#161b22;border-top:1px solid #30363d}',
      '.bn-bglib-upload{background:#238636;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}',
      '.bn-bglib-slab{background:#2563eb;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}',
      '.bn-bglib-slab:hover{background:#1d4ed8}',
      '.bn-bglib-apply{background:#1f6feb;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}',
      '.bn-bglib-apply:disabled{opacity:.45;cursor:not-allowed}',
      '.bn-bglib-hint{font-size:12px;color:#8b949e;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.bn-bglib-empty{border:1px dashed #30363d;border-radius:10px;padding:24px;text-align:center;color:#8b949e;line-height:1.7;grid-column:1/-1}',
      '.bn-bglib-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}',
      /* ── SLAB 雙圖比對視窗 ── */
      '.bn-slab-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2147483001;display:none;align-items:center;justify-content:center;padding:24px}',
      '.bn-slab-overlay.open{display:flex}',
      '.bn-slab-modal{width:min(880px,96vw);max-height:92vh;overflow:auto;background:#111827;border:1px solid #30363d;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.65);color:#e6edf3;font-family:"Segoe UI","PingFang TC",Arial,sans-serif}',
      '.bn-slab-head{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#161b22;border-bottom:1px solid #30363d}',
      '.bn-slab-head h3{font-size:15px;margin:0;flex:1}',
      '.bn-slab-body{padding:16px}',
      '.bn-slab-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
      '.bn-slab-slot{border:2px dashed #30363d;border-radius:12px;padding:10px;text-align:center;background:#0d1117;min-height:210px;display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:border-color .15s,background .15s}',
      '.bn-slab-slot:hover,.bn-slab-slot.over{border-color:#58a6ff;background:#111a27}',
      '.bn-slab-slot.filled{border-style:solid;border-color:#2f81f7}',
      '.bn-slab-slot-title{font-size:12px;font-weight:700;color:#dde3f0}',
      '.bn-slab-thumb{flex:1;display:flex;align-items:center;justify-content:center;min-height:130px}',
      '.bn-slab-thumb img{max-width:100%;max-height:150px;object-fit:contain;display:block;border-radius:6px;background:repeating-conic-gradient(#20262e 0% 25%,#161b22 0% 50%) 50%/14px 14px}',
      '.bn-slab-hint{font-size:11px;color:#8b949e;line-height:1.6}',
      '.bn-slab-hint b{color:#f0883e}',
      '.bn-slab-report{margin-top:14px;padding:11px 13px;border-radius:10px;background:#0d1117;border:1px solid #30363d;font-size:12px;line-height:1.8;color:#c9d3df}',
      '.bn-slab-report .ok{color:#3fb950;font-weight:700}',
      '.bn-slab-report .warn{color:#f0883e;font-weight:700}',
      '.bn-slab-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 18px;background:#161b22;border-top:1px solid #30363d}',
      '.bn-slab-btn{border:0;border-radius:8px;padding:8px 15px;font-weight:700;cursor:pointer;font-size:13px}',
      '.bn-slab-btn.primary{background:#1f6feb;color:#fff}',
      '.bn-slab-btn.primary:disabled{opacity:.45;cursor:not-allowed}',
      '.bn-slab-btn.ghost{background:#21262d;color:#e6edf3;border:1px solid #30363d}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureModal(){
    ensureStyle();
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'bnBgLibModal';
    modal.className = 'bn-bglib-overlay';
    modal.innerHTML = ''+
      '<div class="bn-bglib-modal" role="dialog" aria-modal="true" aria-labelledby="bn-bglib-title">'+
        '<div class="bn-bglib-head">'+
          '<h3 id="bn-bglib-title">🖼 背景圖庫</h3>'+
          '<input class="bn-bglib-search" type="search" placeholder="搜尋檔名 / 編號">'+
          '<button type="button" class="bn-bglib-close">關閉</button>'+
        '</div>'+
        '<div class="bn-bglib-tabs" role="tablist"></div>'+
        '<div class="bn-bglib-body"><div class="bn-bglib-status"></div><div class="bn-bglib-grid"></div></div>'+
        '<div class="bn-bglib-foot">'+
          '<div class="bn-bglib-hint">選預設圖會依版位寬高比自動套用；要用自己的圖，請按右側按鈕。</div>'+
          '<div class="bn-bglib-actions"><button type="button" class="bn-bglib-upload">📤 上傳自己的圖片</button><button type="button" class="bn-bglib-slab">📐 上傳SLAB底圖</button><button type="button" class="bn-bglib-apply" disabled>套用選取</button></div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(modal);
    grid = modal.querySelector('.bn-bglib-grid');
    tabsEl = modal.querySelector('.bn-bglib-tabs');
    searchEl = modal.querySelector('.bn-bglib-search');
    statusEl = modal.querySelector('.bn-bglib-status');
    selectedEl = modal.querySelector('.bn-bglib-hint');
    applyBtn = modal.querySelector('.bn-bglib-apply');

    modal.querySelector('.bn-bglib-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
    modal.querySelector('.bn-bglib-upload').addEventListener('click', function(){ closeModal(); openNativeUpload(); });
    modal.querySelector('.bn-bglib-slab').addEventListener('click', function(){ openSlabUpload(); });
    applyBtn.addEventListener('click', function(){ if(selected) applyPreset(selected); });
    searchEl.addEventListener('input', function(){ searchQuery = searchEl.value || ''; renderGrid(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
    renderTabs();
    return modal;
  }

  function renderTabs(){
    if(!tabsEl) return;
    tabsEl.innerHTML = CATEGORIES.map(function(cat){
      return '<button type="button" class="bn-bglib-tab'+(cat===currentCat?' active':'')+'" data-cat="'+esc(cat)+'">'+esc(cat)+'</button>';
    }).join('');
    tabsEl.querySelectorAll('.bn-bglib-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        currentCat = tab.dataset.cat;
        selected = null;
        searchQuery = '';
        if(searchEl) searchEl.value = '';
        renderTabs();
        buildCards();
        renderGrid();
      });
    });
  }

  function loadJson(url){
    return fetch(url + (url.indexOf('?') === -1 ? '?t=' : '&t=') + Date.now())
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
  }

  function loadImages(){
    if(imagesLoaded) return Promise.resolve();
    imagesLoaded = true;
    if(DEFAULT_IMAGES.length){
      indexData = { _default: DEFAULT_IMAGES };
      CATEGORIES = ['預設背景'];
      currentCat = '預設背景';
      return Promise.resolve();
    }
    return Promise.all([
      loadJson(MANIFEST_URL).catch(function(){ return null; }),
      loadJson(BRAND_URL).catch(function(){ return null; })
    ]).then(function(res){
      indexData = res[0] || {};
      brandData = res[1] || null;
      var keys = detectCategories(indexData);
      if(keys.length){
        CATEGORIES = keys;
        if(CATEGORIES.indexOf(currentCat) === -1) currentCat = CATEGORIES[0];
      }
    });
  }

  function detectCategories(data){
    if(!data) return [];
    if(Array.isArray(data)) return ['預設背景'];
    return CATEGORIES.filter(function(k){ return data[k]; }).concat(Object.keys(data).filter(function(k){
      return CATEGORIES.indexOf(k) === -1 && k.charAt(0) !== '_';
    }));
  }

  function listFromCategory(cat){
    var out = [];
    if(!indexData) return out;
    if(Array.isArray(indexData)){
      indexData.forEach(function(item){ addGenericItem(out, item, cat); });
      return out;
    }
    if(indexData._default){
      indexData._default.forEach(function(item){ addGenericItem(out, item, cat); });
      return out;
    }
    var catData = indexData[cat];
    if(!catData) return out;

    // HBN 格式：{ EL: { hbn:[...], ddcard:[...] } }
    if(catData.hbn || catData.HBN){
      // 資料夾名稱的大小寫，直接跟著 index.json 裡實際出現的 key 走，
      // 這樣不管實際資料夾是 hbn/ddcard（小寫）還是 HBN/DDCARD（大寫），
      // 只要跟 json 的 key 一致，組出來的網址都會對。
      var hbnKey = ('hbn' in catData) ? 'hbn' : 'HBN';
      var ddKey = ('ddcard' in catData) ? 'ddcard' : (('ddCard' in catData) ? 'ddCard' : 'DDCARD');
      var hbnList = catData.hbn || catData.HBN || [];
      var ddList = catData.ddcard || catData.DDCARD || catData.ddCard || [];
      hbnList.forEach(function(file){
        if(!isImageFile(file)) return;
        var num = extractNum(file);
        var dd = findPairByNum(ddList, num);
        out.push({
          name: cleanFileName(file),
          fileName: file,
          cat: cat,
          horizontalSrc: IMG_BASE_URL + cat + '/' + hbnKey + '/' + file,
          verticalSrc: dd ? IMG_BASE_URL + cat + '/' + ddKey + '/' + dd : null,
          num: num
        });
      });
      return out;
    }

    // 彈性格式：{ EL:[...] }
    if(Array.isArray(catData)){
      catData.forEach(function(item){ addGenericItem(out, item, cat); });
      return out;
    }

    // 彈性格式：{ EL:{ images:[...] } }
    if(Array.isArray(catData.images)){
      catData.images.forEach(function(item){ addGenericItem(out, item, cat); });
      return out;
    }
    return out;
  }

  function findPairByNum(list, num){
    if(!Array.isArray(list) || num === null) return null;
    for(var i=0;i<list.length;i++){
      if(extractNum(list[i]) === num) return list[i];
    }
    return null;
  }

  function addGenericItem(out, item, cat){
    if(!item) return;
    if(typeof item === 'string'){
      if(!isImageFile(item)) return;
      var src = item.indexOf('/') >= 0 ? item : IMG_BASE_URL + cat + '/' + item;
      out.push({ name: cleanFileName(item), fileName:item, cat:cat, horizontalSrc:src, verticalSrc:null, num:extractNum(item) });
      return;
    }
    var src = item.src || item.image || item.path || item.url;
    if(!src || !isImageFile(src)) return;
    out.push({
      name: item.name || cleanFileName(src),
      fileName: cleanFileName(src),
      cat: item.group || item.category || cat,
      horizontalSrc: src,
      verticalSrc: item.verticalSrc || item.portraitSrc || item.ddcardSrc || null,
      num: item.num || extractNum(src)
    });
  }

  function buildCards(){
    cards = listFromCategory(currentCat);
  }

  function renderGrid(){
    if(!grid) return;
    var q = String(searchQuery||'').trim().toLowerCase();
    var list = cards.filter(function(img){
      if(!q) return true;
      return String(img.name||'').toLowerCase().indexOf(q) !== -1 || String(img.fileName||'').toLowerCase().indexOf(q) !== -1 || String(img.num||'').indexOf(q) !== -1;
    });
    if(statusEl){
      statusEl.textContent = list.length ? ('分類：' + currentCat + '，共 ' + list.length + ' 張' + (cards.some(function(x){return x.verticalSrc;}) ? '（含直式對應圖）' : '')) : '';
    }
    if(!list.length){
      grid.innerHTML = '<div class="bn-bglib-empty">目前沒有載入背景圖。<br>請確認 <code>bgimg/index.json</code> 與圖片資料夾是否存在。</div>';
      if(applyBtn) applyBtn.disabled = true;
      return;
    }
    grid.innerHTML = list.map(function(img, idx){
      var src = encodeSrc(img.horizontalSrc);
      return '<button type="button" class="bn-bglib-card'+(selected===img?' selected':'')+'" data-idx="'+idx+'">'+
        '<div class="bn-bglib-thumb"><img src="'+esc(src)+'" alt=""></div>'+
        '<div class="bn-bglib-name" title="'+esc(img.fileName || img.name)+'">'+esc(img.name)+'</div>'+
        '<div class="bn-bglib-check">✓</div>'+
      '</button>';
    }).join('');
    grid.querySelectorAll('.bn-bglib-card').forEach(function(card){
      var img = list[Number(card.dataset.idx)];
      card.addEventListener('click', function(){ selectCard(img); });
      card.addEventListener('dblclick', function(){ applyPreset(img); });
    });
  }

  function selectCard(img){
    selected = img;
    if(selectedEl){
      selectedEl.textContent = '已選：' + (img.name || '') + (img.verticalSrc ? '（橫式用 HBN、直式/方版用 DDCARD）' : '');
    }
    if(applyBtn) applyBtn.disabled = false;
    renderGrid();
  }

  function openModal(nativeTarget){
    pendingNativeTarget = nativeTarget || pendingNativeTarget || findNativeUploadTarget();
    ensureModal();
    modal.classList.add('open');
    if(statusEl) statusEl.textContent = '載入背景圖庫中…';
    loadImages().then(function(){ renderTabs(); buildCards(); renderGrid(); }).catch(function(){
      if(grid) grid.innerHTML = '<div class="bn-bglib-empty">無法載入 <code>bgimg/index.json</code>。</div>';
    });
  }
  function closeModal(){ if(modal) modal.classList.remove('open'); }

  function findNativeUploadTarget(){
    return document.getElementById('bg-upload-input') ||
      document.getElementById('bn-bg-inp') ||
      document.querySelector('input[type="file"][id*="bg" i]') ||
      document.querySelector('input[type="file"][name*="bg" i]') ||
      document.querySelector('[data-bg-upload], .bg-upload-btn, #bg-upload-btn');
  }
  function findBgUploadModalOpener(){
    return document.getElementById('bn-bg-open-btn') ||
      document.querySelector('[data-bg-modal-open], .bn-bg-open-btn, .bn-bg-open') ||
      Array.prototype.slice.call(document.querySelectorAll('button,label,a,div,span')).find(function(el){
        var text = (el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
        return /更換.*背景|上傳背景|背景圖上傳/.test(text);
      });
  }
  function openNativeUpload(){
    /* 圖庫右下角「📤 上傳自己的圖片」要接回 BN 原本的
       「更換你的背景」雙欄浮動視窗，而不是直接打開單一 file input。 */
    allowNativeUploadOnce = true;
    setTimeout(function(){ allowNativeUploadOnce = false; }, 1800);

    if(typeof window._bnOpenBgModal === 'function'){
      setTimeout(function(){
        try{ window._bnOpenBgModal(); }catch(_){ }
      }, 0);
      return;
    }

    var opener = findBgUploadModalOpener();
    if(opener){
      try{ opener.click(); }catch(_){ }
      return;
    }

    /* 保留舊版 fallback：若專案沒有雙欄背景視窗，才退回原本 file input。 */
    var target = pendingNativeTarget || findNativeUploadTarget();
    if(target){
      try{ target.click(); }catch(_){ }
    }
  }

  function shouldInterceptClick(el){
    if(!el || allowNativeUploadOnce) return false;
    if(el.closest && el.closest('#bnBgLibModal')) return false;
    if(el.matches && el.matches('input[type="file"]')){
      var idn = ((el.id||'') + ' ' + (el.name||'') + ' ' + (el.className||'') + ' ' + (el.accept||'')).toLowerCase();
      return idn.indexOf('bg') !== -1 || idn.indexOf('背景') !== -1;
    }
    var btn = el.closest && el.closest('button,label,a,div,span');
    if(!btn) return false;
    var text = (btn.textContent || btn.getAttribute('title') || btn.getAttribute('aria-label') || '').trim();
    var meta = ((btn.id||'') + ' ' + (btn.className||'') + ' ' + text).toLowerCase();
    if(/上傳自己的圖片/.test(text)) return false;
    return (/上傳背景|背景圖上傳|upload.*bg|bg.*upload|背景圖/.test(meta) && /上傳|upload|選擇|choose/.test(meta));
  }

  document.addEventListener('click', function(e){
    var t = e.target;
    if(!shouldInterceptClick(t)) return;
    e.preventDefault();
    e.stopPropagation();
    openModal(t.matches && t.matches('input[type="file"]') ? t : findNativeUploadTarget());
  }, true);

  function imageToDataUrl(src){
    if(!src || /^data:/i.test(src)) return Promise.resolve(src);
    return fetch(encodeSrc(src)).then(function(r){
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.blob();
    }).then(function(blob){
      return new Promise(function(resolve, reject){
        var fr = new FileReader();
        fr.onload = function(){ resolve(fr.result); };
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
    }).catch(function(){ return src; });
  }

  function getLayoutInfoForIframe(iframe){
    var id = null;
    try{ id = new URLSearchParams((iframe.src||'').split('?')[1]||'').get('bnid'); }catch(_){ }
    var w = parseFloat(iframe.style.width) || iframe.width || 0;
    var h = parseFloat(iframe.style.height) || iframe.height || 0;
    if((!w || !h) && typeof window.loadLayouts === 'function' && id){
      try{
        var ls = window.loadLayouts() || [];
        var item = ls.find(function(x){ return String(x.id) === String(id); });
        if(item){ w = w || item.w || 0; h = h || item.h || 0; }
      }catch(_){ }
    }
    return {id:id, w:w, h:h};
  }


  function getDefaultBgFitForLibraryLayout(info){
    return (info && Number(info.w) > Number(info.h)) ? 'height100' : 'width100';
  }

  /* 橫式/直式的選擇、以及套用後的預設 fit/scale/x/y，一律優先用
     bn-editor-plugin.js 暴露出來的共用判斷函式——那邊才有 FB_POST_方LOGO /
     FB_POST_橫LOGO / SCBN_APP 這幾個版位「固定吃直式背景圖」的專屬例外，
     還有各自的預設縮放/位置。之前這裡自己複製了一份「純看寬高比」的
     判斷邏輯，沒有這些例外，才會出現「手動上傳修好了、選圖庫卻沒修好」
     這種兩條路徑不同步的狀況。找不到共用函式時（理論上不會發生，
     bn-editor-plugin.js 一定比這支檔案先載入），才退回原本單純看寬高比
     的備援邏輯。 */
  function chooseSrcForLayout(info, img, dataH, dataV){
    if(dataH && dataV){
      if(typeof window._bnGetBgLayoutOrientation === 'function'){
        var iframeEl = info && info.id ? document.querySelector('.preview-block iframe[src*="bnid=' + info.id + '"]') : null;
        var orientation = window._bnGetBgLayoutOrientation(info.id, iframeEl);
        return orientation === 'vertical' ? dataV : dataH;
      }
      // 備援：寬高比判斷（橫式吃 HBN，方/直式吃 DDCARD）。
      return (info.w > info.h) ? dataH : dataV;
    }
    return dataH || dataV || null;
  }

  function getBgParamsForLibraryLayout(info, iframeEl){
    if(typeof window._bnGetDefaultBgParamsForLayout === 'function'){
      return window._bnGetDefaultBgParamsForLayout(info && info.id, iframeEl);
    }
    return { fit: getDefaultBgFitForLibraryLayout(info), scale:100, x:50, y:50 };
  }

  function applyPreset(img){
    if(!img) return;
    closeModal();
    if(statusEl) statusEl.textContent = '套用中…';
    Promise.all([imageToDataUrl(img.horizontalSrc), img.verticalSrc ? imageToDataUrl(img.verticalSrc) : Promise.resolve(null)])
      .then(function(res){
        var dataH = res[0];
        var dataV = res[1];
        applySampledCanvasBg(dataH || dataV);
        var iframes = Array.prototype.slice.call(document.querySelectorAll('.preview-block iframe'));
        var states = {};
        iframes.forEach(function(iframe){
          var info = getLayoutInfoForIframe(iframe);
          if(typeof window._bnIsNoImageBackgroundLayout === 'function' &&
             window._bnIsNoImageBackgroundLayout(info.id, iframe)){
            try{ iframe.contentWindow.postMessage({type:'bn-bg', src:null}, '*'); }catch(_){ }
            return;
          }
          var src = chooseSrcForLayout(info, img, dataH, dataV);
          if(!src) return;
          var params = getBgParamsForLibraryLayout(info, iframe);
          if(info.id) states[info.id] = {src:resolveBgImgUrl(src), fit:params.fit, scale:params.scale, x:params.x, y:params.y, _initialized:true};
          try{ iframe.contentWindow.postMessage({ type:'bn-bg', src:resolveBgImgUrl(src), fit:params.fit, scale:params.scale, x:params.x, y:params.y }, '*'); }catch(_){ }
        });
        if(window._bnSetBgStates){
          try{ window._bnSetBgStates(states, null); }catch(_){ }
        }
        // 若沒有任何 iframe，仍保留原本單張 broadcast 行為。
        if(!iframes.length && typeof window.broadcastBg === 'function') window.broadcastBg(dataH || dataV || img.horizontalSrc);
        try{ document.dispatchEvent(new CustomEvent('bn-state-dirty')); }catch(_){ }
      });
  }

  /* SLAB 底圖：上傳一張跟「建議範圍框.PNG」同尺寸(1200x1200)的圖，
     交給 bn-editor-plugin 的 _bgStates 狀態系統管理（標記 slab:true），
     而不是直接 postMessage 給 iframe。

     這點很重要：_bgStates 是「下載截圖前重新同步背景」「下載完成後
     還原畫布背景」「本機暫存/匯出 JSON」…等所有背景重播流程唯一認得的
     資料來源（見 bgSendToIframe / bgBroadcastAll / cloneBgStates）。
     如果只是直接 postMessage 一次性套用、不寫進 _bgStates，上面任何一個
     重播流程都會用「沒有背景」的舊狀態覆蓋回去，導致：
       1. 下載 ZIP 時 syncIframeForExport() 在截圖前呼叫 _bnSendBgToIframe()
          重新同步背景，會把 SLAB 圖蓋成空的，截圖結果沒有 SLAB 底圖。
       2. 下載完成後 resyncAllAfterExport() 再呼叫一次同一個同步，畫布上
          原本看得到的 SLAB 底圖也會被清空。
     交給 _bnSetBgStates 之後，上述流程都會透過 bgSendToIframe 正確送出
     bn-bg-slab（而非把它們誤當成一般背景 bn-bg 送出去），畫面跟下載
     結果才能維持「所見即所得」。 */
  /* 各版位套用 SLAB 底圖時的預設微調參數（對應「背景圖調整」面板的三個值）。
     scale=100 / x=50 / y=50 就是純 DRED 對齊的基準位置；這裡的數字是實際
     手動拉到最合適的位置後量出來的，讓上傳當下就直接是正確構圖，
     使用者仍可再用面板微調。x/y 的位移單位是畫布寬高的百分比。 */
  var SLAB_DEFAULT_PARAMS = [
    /* SCBN：扁版位，構圖是實際手拉量出來的專屬參數 */
    { test: /SCBN/i,    scale: 127, x: 47, y: 29 },
    /* FB_POST：維持純 DRED 對齊，不額外放大 */
    { test: /FB_POST/i, scale: 100, x: 50, y: 50 }
  ];
  /* 其餘版位（含 HBN）一律以 100% 為基準，再減掉與 layout 的差距 */
  var SLAB_FALLBACK_PARAMS = { scale: 100, x: 50, y: 50 };
  function slabDefaultsFor(iframe){
    var src = '';
    try{ src = decodeURIComponent(String((iframe && (iframe.getAttribute('src') || iframe.src)) || '')); }
    catch(_){ src = String((iframe && iframe.src) || ''); }
    for(var i = 0; i < SLAB_DEFAULT_PARAMS.length; i++){
      if(SLAB_DEFAULT_PARAMS[i].test.test(src)) return SLAB_DEFAULT_PARAMS[i];
    }
    return SLAB_FALLBACK_PARAMS;
  }

  /* ── 兩張圖比對用的像素分析 ───────────────────────────────
     layout 圖：找出紅框（商品範圍）的範圍
     slab 完成圖：找出商品本體的範圍（有 alpha 用透明區，純色背景則從四角取底色）
     兩邊都換成「佔整張圖高度的比例」再相比，兩張圖解析度不同也能比。 */

  function loadImage(src){
    return new Promise(function(resolve, reject){
      var img = new Image();
      img.onload = function(){ resolve(img); };
      img.onerror = function(){ reject(new Error('圖片載入失敗')); };
      img.src = src;
    });
  }

  /* 為了效率，分析前先縮到最長邊 600px；回傳的比例值不受縮放影響。 */
  function imageToPixels(img, maxSide){
    var max = maxSide || 600;
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var k = Math.min(1, max / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    return { data: ctx.getImageData(0, 0, cw, ch).data, w: cw, h: ch };
  }

  function bboxOf(px, isInside){
    var minX = px.w, minY = px.h, maxX = -1, maxY = -1;
    for(var y = 0; y < px.h; y++){
      for(var x = 0; x < px.w; x++){
        var i = (y * px.w + x) * 4;
        if(!isInside(px.data[i], px.data[i+1], px.data[i+2], px.data[i+3])) continue;
        if(x < minX) minX = x;
        if(x > maxX) maxX = x;
        if(y < minY) minY = y;
        if(y > maxY) maxY = y;
      }
    }
    if(maxX < 0) return null;
    return { x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1, imgW:px.w, imgH:px.h };
  }

  /* layout 上標示商品範圍的框線。支援兩種來源：
       ① 建議範圍框.PNG 的純紅框
       ② 實際 layout 圖的 REF 框（REF-01 淺綠、REF-02/03 淺藍），可能同時有多個框
     多個框時取聯集（整組商品的擺放範圍）。
     REF 標籤是同色實心色塊，會被 stripSolidBlocks() 濾掉，只留細框線。 */
  var FRAME_COLORS = [
    { name:'紅框',  test:function(r,g,b){ return r > 90 && r-g > 55 && r-b > 55; } },
    { name:'綠框',  test:function(r,g,b){ return g > 150 && g-r > 45 && g-b > 25; } },
    { name:'藍框',  test:function(r,g,b){ return b > 150 && b-r > 45 && b-g > 15; } }
  ];

  /* 只保留細線：框線在水平或垂直方向必有一邊很細，實心標籤色塊兩邊都粗。 */
  function stripSolidBlocks(mask, w, h, maxrun){
    maxrun = maxrun || 9;
    var out = new Uint8Array(w * h), x, y, s;
    for(y = 0; y < h; y++){
      x = 0;
      while(x < w){
        if(!mask[y*w+x]){ x++; continue; }
        s = x;
        while(x < w && mask[y*w+x]) x++;
        if(x - s <= maxrun){ for(var k = s; k < x; k++) out[y*w+k] = 1; }
      }
    }
    for(x = 0; x < w; x++){
      y = 0;
      while(y < h){
        if(!mask[y*w+x]){ y++; continue; }
        s = y;
        while(y < h && mask[y*w+x]) y++;
        if(y - s <= maxrun){ for(var j = s; j < y; j++) out[j*w+x] = 1; }
      }
    }
    return out;
  }

  function detectLayoutFrame(img){
    var px = imageToPixels(img);
    var d = px.data, w = px.w, h = px.h;
    var best = null;
    FRAME_COLORS.forEach(function(fc){
      var mask = new Uint8Array(w * h), n = 0;
      for(var i = 0, p = 0; i < d.length; i += 4, p++){
        if(d[i+3] > 24 && fc.test(d[i], d[i+1], d[i+2])){ mask[p] = 1; n++; }
      }
      if(n < 40) return;
      var thin = stripSolidBlocks(mask, w, h);
      var minX = w, minY = h, maxX = -1, maxY = -1, cnt = 0;
      for(var y = 0; y < h; y++){
        for(var x = 0; x < w; x++){
          if(!thin[y*w+x]) continue;
          cnt++;
          if(x < minX) minX = x;
          if(x > maxX) maxX = x;
          if(y < minY) minY = y;
          if(y > maxY) maxY = y;
        }
      }
      if(maxX < 0 || cnt < 40) return;
      var rect = { x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1, imgW:w, imgH:h, color:fc.name, px:cnt };
      /* 多種顏色都有框時，取框線像素最多的那組（主要的商品範圍標示） */
      if(!best || rect.px > best.px) best = rect;
      /* 同時存在綠框＋藍框（REF-01/02/03）時取聯集 */
      if(best && best !== rect){
        best = {
          x: Math.min(best.x, rect.x), y: Math.min(best.y, rect.y),
          w: Math.max(best.x+best.w, rect.x+rect.w) - Math.min(best.x, rect.x),
          h: Math.max(best.y+best.h, rect.y+rect.h) - Math.min(best.y, rect.y),
          imgW: w, imgH: h,
          color: best.color + '＋' + rect.color,
          px: best.px + rect.px
        };
      }
    });
    return best;
  }

  /* 商品本體：先看有沒有透明區，有就取非透明；沒有就用四角底色反推 */
  function rgbHsv(r, g, b){
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), df = mx - mn, h = 0;
    if(df){
      if(mx === r) h = ((g - b) / df) % 6;
      else if(mx === g) h = (b - r) / df + 2;
      else h = (r - g) / df + 4;
      h *= 60; if(h < 0) h += 360;
    }
    return { h:h, s: mx ? df / mx * 255 : 0, v: mx };
  }

  /* 商品本體：
     ① 有透明區（去背 PNG）→ 直接取非透明範圍，最準
     ② 純色／漸層背景（米色棚拍、檯面、陰影、道具）→ 用「深色或高彩度且非米色系」
        判斷。單純比對四角底色會把檯面與陰影一起吃進來，範圍會嚴重高估。 */
  function detectProduct(img){
    var px = imageToPixels(img);
    var d = px.data, i, hasAlpha = false;
    for(i = 3; i < d.length; i += 4){
      if(d[i] < 240){ hasAlpha = true; break; }
    }
    if(hasAlpha){
      return { rect: bboxTrim(px, function(r, g, b, a){ return a > 24; }), mode: '透明背景' };
    }
    return {
      rect: bboxTrim(px, function(r, g, b){
        var c = rgbHsv(r, g, b);
        if(c.h >= 15 && c.h <= 60 && c.s < 200) return false; /* 米色／褐色／橘色：背景、檯面、道具 */
        if(c.v < 105) return true;                            /* 深色商品（如黑色充電器） */
        if(c.s < 75) return false;                            /* 白灰米、陰影、透明壓頭 */
        return true;
      }),
      mode: '純色背景'
    };
  }

  /* 用百分位裁掉零星雜點，避免單一雜訊像素把範圍拉大 */
  function bboxTrim(px, isInside, lo, hi){
    lo = lo === undefined ? 0.004 : lo;
    hi = hi === undefined ? 0.996 : hi;
    var xs = [], ys = [], d = px.data;
    for(var y = 0; y < px.h; y++){
      for(var x = 0; x < px.w; x++){
        var i = (y * px.w + x) * 4;
        if(!isInside(d[i], d[i+1], d[i+2], d[i+3])) continue;
        xs.push(x); ys.push(y);
      }
    }
    if(!xs.length) return null;
    xs.sort(function(a, b){ return a - b; });
    ys.sort(function(a, b){ return a - b; });
    var n = xs.length;
    function pick(arr, q){ return arr[Math.min(n - 1, Math.max(0, Math.round(q * (n - 1))))]; }
    var x0 = pick(xs, lo), x1 = pick(xs, hi), y0 = pick(ys, lo), y1 = pick(ys, hi);
    return { x:x0, y:y0, w:x1-x0+1, h:y1-y0+1, imgW:px.w, imgH:px.h };
  }

  /* 兩張圖各自量出「佔整張圖高度的百分比」，直接相減得到差距（百分點）。
     例：layout 框佔 23.8%、slab 商品佔 67.3% → 67.3 − 23.8 = 43.5，
         HBN 預設 120% → 120 − 43.5 ≈ 76.5%。
     注意是相減、不是算倍率（倍率會變成 67.3/23.8 = 2.83 → +183%，不是要的）。
     兩張圖解析度不同也沒關係，因為比的都是「佔自己那張圖的比例」，
     等同於先把兩張正規化到同尺寸再量。高度為基準，跟 DRED 對齊規則一致。 */
  function compareSlabToLayout(layoutImg, slabImg){
    var frame = detectLayoutFrame(layoutImg);
    var prod = detectProduct(slabImg);
    if(!frame || !prod.rect) return null;
    var layoutPctH = frame.h / frame.imgH * 100;
    var slabPctH   = prod.rect.h / prod.rect.imgH * 100;
    if(!(layoutPctH > 0) || !(slabPctH > 0)) return null;
    return {
      layoutPctH: layoutPctH,
      slabPctH: slabPctH,
      diffPercent: Math.round((slabPctH - layoutPctH) * 10) / 10,
      diffPercentW: Math.round((prod.rect.w / prod.rect.imgW - frame.w / frame.imgW) * 1000) / 10,
      productMode: prod.mode,
      frameColor: frame.color,
      layoutFrame: frame,
      slabProduct: prod.rect
    };
  }

  var _slabInput = null;
  /* diffPercent：兩張圖「佔高度百分比」相減得到的差距（百分點）。
     各版位預設 % 直接減掉它，一般版位／HBN 的基準是 100%，
     例如 layout 23.8%、slab 67.3% → 差 43.5 → 100 − 43.5 = 56.5%。 */
  function applySlabUpload(file, diffPercent){
    if(!file) return;
    var fr = new FileReader();
    fr.onload = function(ev){
      var dataUrl = ev.target.result;
      applySlabDataUrl(dataUrl, diffPercent);
    };
    fr.readAsDataURL(file);
  }
  function applySlabDataUrl(dataUrl, diffPercent){
    (function(){
      var iframes = Array.prototype.slice.call(document.querySelectorAll('.preview-block iframe'));
      var states = {};
      var applied = false;
      iframes.forEach(function(iframe){
        var info = getLayoutInfoForIframe(iframe);
        if(!info || !info.id) return;
        if(typeof window._bnIsNoImageBackgroundLayout === 'function' &&
           window._bnIsNoImageBackgroundLayout(info.id, iframe)) return;
        /* fit 用 'auto'：SLAB 走自己的對齊規則不看 fit，但「背景圖調整」面板
           在 cover 模式下會把縮放滑桿鎖住，用 auto 三個滑桿才都能調。 */
        var dp = slabDefaultsFor(iframe);
        var scale = dp.scale;
        if(isFinite(diffPercent) && diffPercent){
          scale = Math.max(5, Math.min(700, Math.round(dp.scale - Number(diffPercent))));
        }
        states[info.id] = {src:dataUrl, slab:true, fit:'auto',
          scale:scale, x:dp.x, y:dp.y, _initialized:true};
        applied = true;
      });
      if(typeof window._bnSetBgStates === 'function'){
        window._bnSetBgStates(states, null);
      } else {
        /* 備援：找不到狀態系統時，至少直接套用一次（不會有下載/還原保護）。 */
        iframes.forEach(function(iframe){
          var info = getLayoutInfoForIframe(iframe);
          var st = states[info && info.id];
          if(!st) return;
          try{ iframe.contentWindow.postMessage(
            {type:'bn-bg-slab', src:dataUrl, scale:st.scale, x:st.x, y:st.y}, '*');
          }catch(_){ }
        });
      }
      try{ document.dispatchEvent(new CustomEvent('bn-state-dirty')); }catch(_){ }
      if(window._bnStatePlugin && typeof window._bnStatePlugin.toast === 'function'){
        var msg = applied
          ? ('已套用 SLAB 底圖' + (isFinite(diffPercent) && diffPercent
              ? '（與 layout 差 ' + (diffPercent > 0 ? '+' : '') + diffPercent + '%，各版位縮放已同步'
                + (diffPercent > 0 ? '減 ' : '加 ') + Math.abs(diffPercent) + '%）'
              : '（各版位已依商品範圍同步縮放）'))
          : '目前沒有可套用 SLAB 底圖的版位';
        window._bnStatePlugin.toast(msg, applied ? 'ok' : 'err', 3000);
      }
    })();
  }
  /* ── SLAB 雙圖比對浮動視窗 ─────────────────────────────
     可一次選兩張（layout 圖 + slab 完成圖），左右並列顯示；只給一張時，
     另一邊會提示補上，支援拖拉或點選檔案。兩張都有才會做比例比對。 */
  var slabModal = null;
  var slabPick = { layout:null, slab:null };   /* {dataUrl, name, img} */
  var slabReportEl = null, slabApplyBtn = null, slabDiff = null;

  function looksLikeLayoutName(name){
    return /layout|範圍|框|guide|建議/i.test(String(name || ''));
  }

  function ensureSlabModal(){
    ensureStyle();
    if(slabModal) return slabModal;
    slabModal = document.createElement('div');
    slabModal.id = 'bnSlabModal';
    slabModal.className = 'bn-slab-overlay';
    slabModal.innerHTML = ''+
      '<div class="bn-slab-modal" role="dialog" aria-modal="true">'+
        '<div class="bn-slab-head">'+
          '<h3>📐 SLAB 底圖比對</h3>'+
          '<button type="button" class="bn-slab-btn ghost bn-slab-swap">⇄ 左右互換</button>'+
          '<button type="button" class="bn-slab-btn ghost bn-slab-close">關閉</button>'+
        '</div>'+
        '<div class="bn-slab-body">'+
          '<div class="bn-slab-grid">'+
            '<div class="bn-slab-slot" data-slot="layout">'+
              '<div class="bn-slab-slot-title">① layout 圖（含紅框商品範圍）</div>'+
              '<div class="bn-slab-thumb"></div>'+
              '<div class="bn-slab-hint">拖拉圖片到這裡，或點擊選擇檔案</div>'+
            '</div>'+
            '<div class="bn-slab-slot" data-slot="slab">'+
              '<div class="bn-slab-slot-title">② slab 完成圖（正對式）</div>'+
              '<div class="bn-slab-thumb"></div>'+
              '<div class="bn-slab-hint">拖拉圖片到這裡，或點擊選擇檔案</div>'+
            '</div>'+
          '</div>'+
          '<div class="bn-slab-report"></div>'+
        '</div>'+
        '<div class="bn-slab-foot">'+
          '<div class="bn-slab-hint">比對的是「slab 商品本體」對「layout 紅框」佔畫面高度的比例；差多少，各版位預設縮放就減多少。</div>'+
          '<button type="button" class="bn-slab-btn primary bn-slab-apply" disabled>套用到各版位</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(slabModal);
    slabReportEl = slabModal.querySelector('.bn-slab-report');
    slabApplyBtn = slabModal.querySelector('.bn-slab-apply');

    slabModal.querySelector('.bn-slab-close').addEventListener('click', closeSlabModal);
    slabModal.addEventListener('click', function(e){ if(e.target === slabModal) closeSlabModal(); });
    slabModal.querySelector('.bn-slab-swap').addEventListener('click', function(){
      var t = slabPick.layout; slabPick.layout = slabPick.slab; slabPick.slab = t;
      renderSlabModal();
    });
    slabApplyBtn.addEventListener('click', function(){
      if(!slabPick.slab) return;
      closeSlabModal();
      applySlabDataUrl(slabPick.slab.dataUrl, slabDiff && isFinite(slabDiff.diffPercent) ? slabDiff.diffPercent : null);
    });

    /* 每個 slot 支援拖拉 + 點擊選檔 */
    slabModal.querySelectorAll('.bn-slab-slot').forEach(function(slot){
      var key = slot.dataset.slot;
      slot.addEventListener('dragover', function(e){ e.preventDefault(); slot.classList.add('over'); });
      slot.addEventListener('dragleave', function(){ slot.classList.remove('over'); });
      slot.addEventListener('drop', function(e){
        e.preventDefault(); slot.classList.remove('over');
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if(f) readIntoSlot(key, f);
      });
      slot.addEventListener('click', function(){
        var inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
        inp.addEventListener('change', function(){
          var f = inp.files && inp.files[0];
          if(f) readIntoSlot(key, f);
          inp.remove();
        });
        document.body.appendChild(inp);
        inp.click();
      });
    });
    return slabModal;
  }

  function closeSlabModal(){ if(slabModal) slabModal.classList.remove('open'); }

  function readIntoSlot(key, file){
    if(!file || !/^image\//i.test(file.type || '')) return;
    var fr = new FileReader();
    fr.onload = function(ev){
      loadImage(ev.target.result).then(function(img){
        slabPick[key] = { dataUrl: ev.target.result, name: file.name, img: img };
        renderSlabModal();
      }).catch(function(){});
    };
    fr.readAsDataURL(file);
  }

  function renderSlabModal(){
    if(!slabModal) return;
    slabModal.querySelectorAll('.bn-slab-slot').forEach(function(slot){
      var key = slot.dataset.slot, pick = slabPick[key];
      var thumb = slot.querySelector('.bn-slab-thumb');
      var hint = slot.querySelector('.bn-slab-hint');
      thumb.innerHTML = '';
      if(pick){
        slot.classList.add('filled');
        var im = document.createElement('img');
        im.src = pick.dataUrl;
        thumb.appendChild(im);
        hint.innerHTML = esc(pick.name) + '<br>' + (pick.img.naturalWidth) + '×' + (pick.img.naturalHeight) + ' px（點擊可更換）';
      } else {
        slot.classList.remove('filled');
        hint.innerHTML = key === 'layout'
          ? '<b>請補上 layout 圖</b>（含紅框的商品範圍圖）<br>拖拉到這裡，或點擊選擇檔案'
          : '<b>請補上 slab 完成圖</b>（正對式商品圖）<br>拖拉到這裡，或點擊選擇檔案';
      }
    });

    slabDiff = null;
    if(slabPick.layout && slabPick.slab){
      try{ slabDiff = compareSlabToLayout(slabPick.layout.img, slabPick.slab.img); }catch(_){ slabDiff = null; }
    }

    if(!slabPick.slab){
      slabReportEl.innerHTML = '尚未提供 <b>slab 完成圖</b>，無法套用。';
      slabApplyBtn.disabled = true;
    } else if(!slabPick.layout){
      slabReportEl.innerHTML = '只有 slab 完成圖，<span class="warn">不做比例比對</span>，將直接使用各版位目前的預設縮放。<br>要自動修正比例，請補上 layout 圖。';
      slabApplyBtn.disabled = false;
    } else if(!slabDiff){
      slabReportEl.innerHTML = '<span class="warn">比對失敗</span>：layout 圖上找不到框線（紅／綠／藍），或 slab 圖上抓不到商品範圍。<br>將直接使用各版位目前的預設縮放。';
      slabApplyBtn.disabled = false;
    } else {
      var d = slabDiff.diffPercent;
      var same = Math.abs(d) <= 2;   /* 2 個百分點內視為一致 */
      if(same) slabDiff.diffPercent = 0;
      var r1 = Math.round(slabDiff.layoutPctH * 10) / 10;
      var r2 = Math.round(slabDiff.slabPctH * 10) / 10;
      slabReportEl.innerHTML = [
        '商品偵測方式：' + slabDiff.productMode + '　／　layout 框線：' + slabDiff.frameColor,
        'layout 框佔高度：' + r1 + '%',
        'slab 商品佔高度：' + r2 + '%',
        same
          ? ('差距：' + r2 + '% − ' + r1 + '% ≈ 0 → <span class="ok">兩張比例相同</span>，維持各版位預設縮放（一般／HBN 100%、SCBN 127%、FB_POST 100%）。')
          : ('差距：' + r2 + '% − ' + r1 + '% = <span class="warn">' + (d > 0 ? '+' : '') + d + '%</span>　→　各版位預設縮放' +
             (d > 0 ? '減 ' + d : '加 ' + Math.abs(d)) + '%<br>' +
             '例：HBN／一般版位 100% → <b>' + (Math.round((100 - d) * 10) / 10) + '%</b>　｜　SCBN 127% → ' +
             (Math.round((127 - d) * 10) / 10) + '%　｜　FB_POST 100% → ' + (Math.round((100 - d) * 10) / 10) + '%')
      ].join('<br>');
      slabApplyBtn.disabled = false;
    }
  }

  function openSlabCompare(files){
    ensureSlabModal();
    slabPick = { layout:null, slab:null };
    slabDiff = null;
    renderSlabModal();
    slabModal.classList.add('open');

    files = (files || []).filter(function(f){ return f && /^image\//i.test(f.type || ''); });
    if(!files.length) return;

    /* 兩張時先用檔名猜哪張是 layout；猜不出來就用紅框偵測結果決定，
       仍可用「左右互換」手動修正。 */
    if(files.length >= 2){
      var a = files[0], b = files[1];
      if(looksLikeLayoutName(b.name) && !looksLikeLayoutName(a.name)){ var t = a; a = b; b = t; }
      readIntoSlot('layout', a);
      readIntoSlot('slab', b);
      if(!looksLikeLayoutName(a.name) && !looksLikeLayoutName(b.name)){
        /* 檔名沒線索：等兩張都讀完後，用紅框偵測驗證方向 */
        setTimeout(autoOrientSlots, 400);
      }
    } else {
      /* 只有一張：有紅框就當 layout，否則當 slab */
      var f = files[0];
      readIntoSlot(looksLikeLayoutName(f.name) ? 'layout' : 'slab', f);
      if(!looksLikeLayoutName(f.name)) setTimeout(autoOrientSlots, 400);
    }
  }

  /* 用紅框偵測結果校正左右：紅框應該在 layout 那張 */
  function autoOrientSlots(){
    try{
      var hasFrame = function(p){ if(!p) return false; var r = detectLayoutFrame(p.img); return !!(r && r.w > 8 && r.h > 8); };
      var lf = hasFrame(slabPick.layout), sf = hasFrame(slabPick.slab);
      if(!lf && sf){
        var t = slabPick.layout; slabPick.layout = slabPick.slab; slabPick.slab = t;
        renderSlabModal();
      } else if(!lf && !sf && slabPick.layout && !slabPick.slab){
        /* 單張且沒紅框：當成 slab 完成圖 */
        slabPick.slab = slabPick.layout; slabPick.layout = null;
        renderSlabModal();
      }
    }catch(_){ }
  }

  function openSlabUpload(){
    if(!_slabInput){
      _slabInput = document.createElement('input');
      _slabInput.type = 'file';
      _slabInput.accept = 'image/*';
      _slabInput.multiple = true;   /* 可同時選 layout 圖 + slab 完成圖 */
      _slabInput.style.display = 'none';
      _slabInput.addEventListener('change', function(){
        var files = Array.prototype.slice.call(_slabInput.files || []);
        _slabInput.value = '';
        openSlabCompare(files);
      });
      document.body.appendChild(_slabInput);
    }
    closeModal();
    _slabInput.click();
  }

  function parsePublicTemplateCode(code){
    var s = String(code || '').trim();
    if(!s) return null;
    s = s.replace(/[＿]/g, '_').replace(/[－—–]/g, '-');
    var m = s.match(/\b(EL|FMCG|Fashion|Lifestyle)\s*[-_ ]?\s*(?:Mock\s*up|Mockup)?\s*[-_ ]?\s*0*(\d{1,3})\b/i);
    if(!m) return null;
    var rawCat = m[1].toLowerCase();
    var catMap = { el:'EL', fmcg:'FMCG', fashion:'Fashion', lifestyle:'Lifestyle' };
    return { category: catMap[rawCat] || m[1], number: parseInt(m[2], 10), code: (catMap[rawCat] || m[1]) + '-' + parseInt(m[2], 10) };
  }

  function findCardByPublicCode(code){
    var parsed = parsePublicTemplateCode(code);
    if(!parsed) return Promise.resolve(null);
    return loadImages().then(function(){
      var oldCat = currentCat;
      currentCat = parsed.category;
      var list = listFromCategory(parsed.category);
      currentCat = oldCat;
      if(!list || !list.length) return null;
      var exactCodeRe = new RegExp('(?:^|[^a-z0-9])' + parsed.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[-_ ]?\\s*0*' + parsed.number + '(?:[^0-9]|$)', 'i');
      var exact = list.find(function(img){
        return exactCodeRe.test(String(img.fileName || '') + ' ' + String(img.name || '') + ' ' + String(img.horizontalSrc || '') + ' ' + String(img.verticalSrc || ''));
      });
      if(exact) return exact;
      return list.find(function(img){ return Number(img.num) === parsed.number; }) || null;
    });
  }

  function applyByPublicCode(code){
    return findCardByPublicCode(code).then(function(img){
      if(!img){
        if(window._bnStatePlugin && typeof window._bnStatePlugin.toast === 'function'){
          window._bnStatePlugin.toast('找不到公版背景：' + code, 'err', 3000);
        }
        return false;
      }
      applyPreset(img);
      if(window._bnStatePlugin && typeof window._bnStatePlugin.toast === 'function'){
        window._bnStatePlugin.toast('已套用公版背景：' + (img.cat || '') + '-' + (img.num || ''), 'ok', 2600);
      }
      return true;
    }).catch(function(err){
      console.error('[背景圖庫] 公版編號套用失敗', err);
      return false;
    });
  }

  installBgColorSamplingHooks();

  window.BNBgLibrary = {
    open: openModal,
    close: closeModal,
    apply: function(src){ applyPreset({name:cleanFileName(src), horizontalSrc:src, verticalSrc:null}); },
    applyByCode: applyByPublicCode,
    findByCode: findCardByPublicCode,
    reload: function(){ imagesLoaded=false; selected=null; return loadImages().then(function(){ renderTabs(); buildCards(); renderGrid(); }); }
  };
})();
