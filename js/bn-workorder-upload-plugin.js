/*
 * bn-workorder-upload-plugin.js
 * 工單上傳外掛：讀取 xlsx 工單，自動勾選排版與匯入文字內容。
 * 需求規則：
 * 1) 找到「版位」欄，讀取下面出現的版位（例：DD Card BN (APP)、Mall HBN、SCBN(商城Collection)）
 * 2) 找到「規範字數」欄，將「廠商名稱 / 主標 / 副標 / 日期/警語」右側欄位文案倒入左側文字內容
 * 3) 倒入後同步畫布預覽
 */
(function(global){
  'use strict';

  var XLSX_URLS = [
    'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
  ];

  var STATUS_ID = 'bn-workorder-status';
  var INPUT_ID = 'bn-workorder-file';

  function $(id){ return document.getElementById(id); }

  function toast(msg, type, duration){
    if(global._bnStatePlugin && typeof global._bnStatePlugin.toast === 'function'){
      global._bnStatePlugin.toast(msg, type || 'ok', duration || 2600);
    } else {
      console.log('[工單上傳]', msg);
    }
  }

  function setStatus(msg, kind){
    var el = $(STATUS_ID);
    if(!el) return;
    el.textContent = msg || '';
    el.className = 'bn-workorder-status' + (kind ? ' ' + kind : '');
  }

  function loadScriptOnce(src){
    return new Promise(function(resolve, reject){
      var existed = document.querySelector('script[data-bn-workorder-xlsx="' + src + '"]');
      if(existed){
        existed.addEventListener('load', resolve, {once:true});
        existed.addEventListener('error', reject, {once:true});
        if(global.XLSX) resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.bnWorkorderXlsx = src;
      s.onload = resolve;
      s.onerror = function(){ reject(new Error('無法載入 XLSX parser')); };
      document.head.appendChild(s);
    });
  }

  function ensureXLSX(){
    if(global.XLSX && global.XLSX.read) return Promise.resolve(global.XLSX);
    var chain = Promise.reject();
    XLSX_URLS.forEach(function(url){
      chain = chain.catch(function(){ return loadScriptOnce(url); });
    });
    return chain.then(function(){
      if(!global.XLSX || !global.XLSX.read) throw new Error('XLSX parser not found');
      return global.XLSX;
    });
  }

  function cellText(v){
    if(v === null || v === undefined) return '';
    if(typeof v === 'number') return String(v);
    return String(v).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  }

  function norm(s){
    return cellText(s).toLowerCase()
      .replace(/[\s\u3000]+/g, '')
      .replace(/[()（）\[\]【】_\-\/\\:：,，.。]/g, '');
  }

  function findHeader(rows, keyword){
    var key = norm(keyword);
    for(var r = 0; r < rows.length; r++){
      for(var c = 0; c < (rows[r] || []).length; c++){
        if(norm(rows[r][c]) === key || norm(rows[r][c]).indexOf(key) !== -1){
          return {row:r, col:c};
        }
      }
    }
    return null;
  }

  function detectLayoutType(text){
    var n = norm(text);
    if(!n) return null;
    if(n.indexOf('ddcardbnapp') !== -1 || n.indexOf('ddcard') !== -1 || n.indexOf('ddcardbn') !== -1) return 'ddcard';
    if(n.indexOf('mallhbn') !== -1 || n === 'hbn' || n.indexOf('hbn') !== -1) return 'hbn';
    if(n.indexOf('scbn') !== -1 || n.indexOf('商城collection') !== -1 || n.indexOf('collection') !== -1) return 'scbn';
    return null;
  }

  function scanAppearedLayoutTypes(rows){
    var header = findHeader(rows, '版位');
    var found = {ddcard:false, hbn:false, scbn:false};
    var raw = [];
    if(!header) return {types:found, raw:raw, header:null};

    for(var r = header.row + 1; r < rows.length; r++){
      var value = cellText((rows[r] || [])[header.col]);
      if(!value) continue;
      var type = detectLayoutType(value);
      if(type){
        found[type] = true;
        raw.push(value);
      }
    }
    return {types:found, raw:raw, header:header};
  }

  function getRightValue(row, col){
    row = row || [];
    for(var c = col + 1; c < Math.min(row.length, col + 6); c++){
      var v = cellText(row[c]);
      if(v) return v;
    }
    return '';
  }

  function scanCopy(rows){
    var spec = findHeader(rows, '規範字數');
    var start = spec ? spec.row + 1 : 0;
    var result = {brand:'', main:'', sub:'', date:''};

    for(var r = start; r < rows.length; r++){
      var row = rows[r] || [];
      for(var c = 0; c < row.length; c++){
        var raw = cellText(row[c]);
        var n = norm(raw);
        if(!raw) continue;
        if(!result.brand && (n.indexOf('廠商名稱') !== -1 || n.indexOf('廠商名') !== -1)){
          result.brand = getRightValue(row, c);
        } else if(!result.main && n.indexOf('主標') !== -1){
          result.main = getRightValue(row, c);
        } else if(!result.sub && n.indexOf('副標') !== -1){
          result.sub = getRightValue(row, c);
        } else if(!result.date && (n.indexOf('日期警語') !== -1 || n.indexOf('日期') !== -1 || n.indexOf('警語') !== -1)){
          result.date = getRightValue(row, c);
        }
      }
    }
    return result;
  }

  function rowsFromWorkbook(wb){
    var sheetName = wb.SheetNames && wb.SheetNames[0];
    if(!sheetName) throw new Error('找不到工作表');
    var sheet = wb.Sheets[sheetName];
    var rows = global.XLSX.utils.sheet_to_json(sheet, {header:1, defval:'', raw:false});
    return {sheetName:sheetName, rows:rows};
  }

  function layoutMatchesType(layout, type){
    var n = norm((layout.name || '') + ' ' + (layout.file || ''));
    if(type === 'ddcard') return n.indexOf('ddcard') !== -1;
    if(type === 'hbn') return n.indexOf('hbn') !== -1;
    if(type === 'scbn') return n.indexOf('scbn') !== -1;
    return false;
  }

  function applyLayouts(types){
    if(typeof global.loadLayouts !== 'function') return {matched:0, selectedNames:[]};
    var layouts = global.loadLayouts().filter(function(l){ return l.enabled; });
    if(!global.checked) global.checked = {};
    var selectedNames = [];
    var matched = 0;

    layouts.forEach(function(l){
      var shouldCheck = false;
      Object.keys(types).forEach(function(type){
        if(types[type] && layoutMatchesType(l, type)) shouldCheck = true;
      });
      global.checked[l.id] = shouldCheck;
      if(shouldCheck){ matched++; selectedNames.push(l.name || l.file || String(l.id)); }
    });

    if(typeof global.renderChecks === 'function') global.renderChecks();
    if(typeof global.renderPreviews === 'function') global.renderPreviews();
    return {matched:matched, selectedNames:selectedNames};
  }

  function setInputValue(id, value){
    var el = $(id);
    if(el && value){
      el.value = value;
      el.dispatchEvent(new Event('input', {bubbles:true}));
    }
  }

  function applyCopy(copy){
    setInputValue('txt-brand', copy.brand);
    setInputValue('txt-main', copy.main);
    setInputValue('txt-sub', copy.sub);
    setInputValue('txt-date', copy.date);
    if(typeof global.broadcastText === 'function') global.broadcastText();
    try{ document.dispatchEvent(new CustomEvent('bn-state-dirty')); }catch(_){}
  }

  function handleFile(file){
    if(!file) return;
    setStatus('讀取中…', 'loading');
    ensureXLSX()
      .then(function(){ return file.arrayBuffer(); })
      .then(function(buf){
        var wb = global.XLSX.read(buf, {type:'array'});
        var parsed = rowsFromWorkbook(wb);
        var layoutResult = scanAppearedLayoutTypes(parsed.rows);
        var copy = scanCopy(parsed.rows);
        var appliedLayouts = applyLayouts(layoutResult.types);
        applyCopy(copy);

        var importedText = [];
        if(copy.brand) importedText.push('品牌名');
        if(copy.main) importedText.push('主標');
        if(copy.sub) importedText.push('副標');
        if(copy.date) importedText.push('日期/警語');

        var appeared = Object.keys(layoutResult.types).filter(function(k){ return layoutResult.types[k]; }).length;
        setStatus('完成：勾選 ' + appliedLayouts.matched + ' 個排版，匯入 ' + importedText.join('、'), 'ok');
        toast('工單已匯入：偵測到 ' + appeared + ' 個版位，已同步文字與畫布', 'ok', 2800);
      })
      .catch(function(err){
        console.error('[工單上傳] 失敗', err);
        setStatus('匯入失敗：' + (err && err.message ? err.message : err), 'err');
        toast('工單匯入失敗，請確認是 .xlsx 檔', 'err', 3200);
      })
      .finally(function(){
        var inp = $(INPUT_ID);
        if(inp) inp.value = '';
      });
  }

  function injectUI(){
    var sidebar = $('sidebar-scroll');
    if(!sidebar || $('bn-workorder-box')) return;

    var style = document.createElement('style');
    style.id = 'bn-workorder-style';
    style.textContent = [
      '.bn-workorder-box{padding:10px 14px 12px;border-bottom:1px solid var(--border);background:rgba(31,111,235,.08);}',
      '.bn-workorder-btn{width:100%;border:1px solid var(--accent);background:var(--accent);color:#fff;border-radius:6px;padding:8px 10px;font-size:12px;font-weight:700;cursor:pointer;}',
      '.bn-workorder-btn:hover{opacity:.88;}',
      '.bn-workorder-status{display:block;margin-top:6px;font-size:10px;line-height:1.4;color:var(--text3);word-break:break-word;}',
      '.bn-workorder-status.ok{color:#3fb950;}',
      '.bn-workorder-status.err{color:#ff7b72;}',
      '.bn-workorder-status.loading{color:#d29922;}'
    ].join('\n');
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.id = 'bn-workorder-box';
    box.className = 'bn-workorder-box';
    box.innerHTML = [
      '<button type="button" class="bn-workorder-btn" id="bn-workorder-btn">📤 上傳工單</button>',
      '<input type="file" id="' + INPUT_ID + '" accept=".xlsx,.xls,.xlsm" style="display:none">',
      '<span id="' + STATUS_ID + '" class="bn-workorder-status">支援 .xlsx：自動勾版位與匯入品牌名/主標/副標/日期</span>'
    ].join('');
    sidebar.insertBefore(box, sidebar.firstChild);

    $('bn-workorder-btn').addEventListener('click', function(){ $(INPUT_ID).click(); });
    $(INPUT_ID).addEventListener('change', function(e){ handleFile(e.target.files && e.target.files[0]); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }

  global.bnWorkorderUploadPlugin = {
    parseRows: function(rows){ return {layouts:scanAppearedLayoutTypes(rows), copy:scanCopy(rows)}; },
    applyCopy: applyCopy,
    applyLayouts: applyLayouts
  };
})(window);
