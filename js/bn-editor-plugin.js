/*!
 * BN Editor Plugin v4
 * Logo 上傳 + 商品圖上傳（兩步驟視窗：選圖→排大小）+ 下載
 */
(function () {
  if (window.__BN_EDITOR_PLUGIN__) return;
  window.__BN_EDITOR_PLUGIN__ = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {

    /* ══ CSS ══ */
    var style = document.createElement('style');
    style.textContent = `
.bn-section{padding:4px 14px 10px}
.bn-drop{border:1.5px dashed var(--border,#30363d);border-radius:7px;padding:9px 10px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;color:var(--text3,#6e7681);font-size:11px;position:relative}
.bn-drop:hover,.bn-drop.drag{border-color:var(--accent,#1f6feb);background:rgba(31,111,235,.06);color:var(--accent,#1f6feb)}
.bn-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;font-size:0}
.bn-prev{width:100%;margin-top:6px;border-radius:5px;border:1px solid var(--border,#30363d);display:none;object-fit:contain;max-height:60px;background:rgba(255,255,255,.05)}
.bn-prev.show{display:block}
.bn-clr{margin-top:4px;width:100%;background:transparent;border:1px solid var(--border,#30363d);border-radius:5px;color:var(--text2,#8b949e);font-size:11px;padding:3px;cursor:pointer;transition:.12s;display:none}
.bn-clr.show{display:block}
.bn-clr:hover{border-color:var(--red,#da3633);color:var(--red,#da3633)}
.bn-prod-list{margin-top:6px;display:flex;flex-direction:column;gap:4px}
.bn-prod-item{display:flex;align-items:center;gap:6px;background:var(--bg2,#1c2333);border-radius:5px;padding:4px 7px;font-size:11px;color:var(--text2,#8b949e)}
.bn-prod-item img{width:32px;height:32px;object-fit:contain;border-radius:3px;background:rgba(255,255,255,.05)}
.bn-prod-item span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bn-prod-item button{background:transparent;border:1px solid var(--border,#30363d);border-radius:4px;color:var(--text3,#6e7681);font-size:10px;padding:2px 6px;cursor:pointer}
.bn-prod-item button:hover{border-color:var(--accent,#1f6feb);color:var(--accent,#1f6feb)}
.bn-prod-item button.rm:hover{border-color:var(--red,#da3633);color:var(--red,#da3633)}
.bn-prod-move{display:flex;flex-direction:column;gap:2px;flex-shrink:0}
.bn-prod-move button{padding:1px 5px;font-size:10px;line-height:1.2}
#bn-prod-open-btn{display:block;width:100%;padding:8px;background:var(--bg2,#1c2333);border:1.5px dashed var(--border,#30363d);border-radius:7px;color:var(--text2,#8b949e);font-size:11px;cursor:pointer;text-align:center;transition:.15s;margin-bottom:2px}
#bn-prod-open-btn:hover{border-color:var(--accent,#1f6feb);color:var(--accent,#1f6feb)}
#bn-download-bar{padding:10px 14px;border-top:1px solid var(--border,#30363d);flex-shrink:0}
.bn-dl-btn{display:block;width:100%;padding:9px;background:linear-gradient(135deg,#1d4ed8,#0d47a1);border:none;border-radius:7px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .12s}
.bn-dl-btn:hover{opacity:.88}
.bn-dl-btn:disabled{opacity:.35;cursor:not-allowed}
.bn-dl-progress{font-size:10px;color:var(--text3,#6e7681);text-align:center;margin-top:5px;min-height:14px}

/* ── 背景上傳 Modal ── */
#bn-bg-open-btn{display:block;width:100%;padding:8px;background:var(--bg2,#1c2333);border:1.5px dashed var(--border,#30363d);border-radius:7px;color:var(--text2,#8b949e);font-size:11px;cursor:pointer;text-align:center;transition:.15s;box-sizing:border-box}
#bn-bg-open-btn:hover{border-color:var(--accent,#1f6feb);color:var(--accent,#1f6feb)}
#bn-bg-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
#bn-bg-modal.show{display:flex}
.bn-bg-modal-box{background:#13161f;border:1px solid #252b3d;border-radius:14px;width:min(720px,94vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 70px rgba(0,0,0,.6);overflow:hidden}
.bn-bg-pair-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.bn-bg-drop-card{border:1.5px dashed #252b3d;border-radius:12px;padding:14px;text-align:center;cursor:pointer;color:#687090;font-size:12px;position:relative;transition:.15s;min-height:190px;display:flex;flex-direction:column;justify-content:center;background:#0d1018}
.bn-bg-drop-card:hover,.bn-bg-drop-card.over{border-color:#4a90e2;background:rgba(74,144,226,.06);color:#4a90e2}
.bn-bg-drop-card input{position:absolute;inset:0;opacity:0;cursor:pointer;font-size:0}
.bn-bg-drop-card img{display:none;width:100%;height:120px;object-fit:contain;border-radius:8px;margin:8px 0;background:rgba(255,255,255,.04)}
.bn-bg-drop-card.has-img img{display:block}
.bn-bg-drop-title{font-size:14px;font-weight:700;color:#dde3f0;margin-bottom:4px}
.bn-bg-drop-desc{font-size:11px;line-height:1.6;color:#687090}
.bn-bg-drop-name{font-size:10px;color:#8b9dbf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}
.bn-bg-hint{font-size:12px;color:#8b9dbf;background:rgba(74,144,226,.08);border:1px solid rgba(74,144,226,.2);border-radius:10px;padding:9px 12px;margin-bottom:14px;line-height:1.7}
@media(max-width:640px){.bn-bg-pair-grid{grid-template-columns:1fr}.bn-bg-modal-box{width:94vw}}

/* ── 商品上傳 Modal ── */
#bn-prod-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
#bn-prod-modal.show{display:flex}
.bn-modal-box{background:#13161f;border:1px solid #252b3d;border-radius:14px;width:min(520px,94vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 70px rgba(0,0,0,.6);overflow:hidden}
.bn-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #252b3d}
.bn-modal-head h3{font-size:14px;font-weight:700;color:#dde3f0;margin:0}
.bn-modal-close{background:transparent;border:none;color:#687090;font-size:20px;cursor:pointer;line-height:1;padding:0}
.bn-modal-close:hover{color:#dde3f0}
.bn-modal-body{flex:1;overflow-y:auto;padding:16px 18px}
.bn-modal-foot{padding:12px 18px;border-top:1px solid #252b3d;display:flex;gap:8px;justify-content:flex-end;align-items:center}
.bn-step-tabs{display:flex;gap:8px;margin-bottom:14px}
.bn-step-tab{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid #252b3d;color:#687090;background:transparent;cursor:pointer}
.bn-step-tab.on{background:#1a1e2b;color:#4a90e2;border-color:#4a90e2}
.bn-modal-drop{border:1.5px dashed #252b3d;border-radius:10px;padding:18px;text-align:center;cursor:pointer;color:#687090;font-size:12px;position:relative;transition:.15s;margin-bottom:12px}
.bn-modal-drop:hover,.bn-modal-drop.over{border-color:#4a90e2;background:rgba(74,144,226,.06);color:#4a90e2}
.bn-modal-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;font-size:0}
.bn-preview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px}
.bn-preview-cell{position:relative;border:1.5px solid #252b3d;border-radius:10px;overflow:hidden;background:#0d1018;cursor:pointer;transition:.15s}
.bn-preview-cell.is-hero{border-color:#4a90e2;box-shadow:0 0 0 2px rgba(74,144,226,.2)}
.bn-preview-cell img{width:100%;height:88px;object-fit:contain;padding:6px;display:block}
.bn-preview-cell .pc-name{font-size:10px;color:#687090;padding:0 6px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.bn-preview-cell .pc-hero{position:absolute;top:5px;left:5px;background:#4a90e2;color:#fff;border-radius:999px;font-size:9px;font-weight:900;padding:2px 6px}
.bn-preview-cell .pc-rm{position:absolute;top:5px;right:5px;width:20px;height:20px;border-radius:50%;background:rgba(13,16,24,.85);border:1px solid rgba(255,255,255,.15);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;z-index:2}
.bn-limit-msg{font-size:11px;text-align:center;padding:4px 0;color:#687090;margin-bottom:4px}
/* step2 rank */
.bn-rank-row{display:flex;gap:12px;align-items:flex-end;justify-content:center;min-height:140px;position:relative;padding:8px 0}
.bn-rank-card{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:grab;user-select:none;position:relative;transition:opacity .15s}
.bn-rank-card.dragging{opacity:.4}
.bn-rank-img-wrap{display:flex;align-items:flex-end;justify-content:center;position:relative}
.bn-rank-img-wrap img{object-fit:contain;width:auto;display:block}
.bn-rank-arrow{background:rgba(255,255,255,.08);border:1px solid #252b3d;color:#687090;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;position:absolute;bottom:2px;transition:.12s;z-index:2}
.bn-rank-arrow:hover{background:#1a1e2b;color:#4a90e2;border-color:#4a90e2}
.bn-rank-arrow.left-arr{left:-26px}
.bn-rank-arrow.right-arr{right:-26px}
.bn-rank-name{font-size:10px;color:#687090;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.bn-rank-tag{font-size:10px;font-weight:700;border-radius:999px;padding:2px 8px}
.bn-rank-tag.hero{background:#4a90e2;color:#fff}
.bn-rank-tag.left{background:#1a1e2b;color:#687090;border:1px solid #252b3d}
.bn-rank-tag.right{background:#1a1e2b;color:#687090;border:1px solid #252b3d}
.bn-rank-hint{font-size:11px;color:#687090;text-align:center;margin-top:6px}
.bn-drop-line{position:absolute;top:4px;bottom:4px;width:3px;background:#4a90e2;border-radius:3px;box-shadow:0 0 8px rgba(74,144,226,.7);pointer-events:none;display:none;z-index:10}
.bn-btn-skip{background:transparent;border:1px solid #252b3d;color:#687090;font-size:12px;padding:7px 14px;border-radius:7px;cursor:pointer;transition:.12s}
.bn-btn-skip:hover{border-color:#4a90e2;color:#4a90e2}
.bn-btn-confirm{background:linear-gradient(135deg,#1d4ed8,#0d47a1);border:none;color:#fff;font-size:12px;font-weight:700;padding:7px 18px;border-radius:7px;cursor:pointer;transition:opacity .12s}
.bn-btn-confirm:hover{opacity:.88}
.bn-btn-confirm:disabled{opacity:.35;cursor:not-allowed}
`;
    document.head.appendChild(style);

    /* ── 狀態 ── */
    /* logo 支援最多3張 */
    window._bnLogos = window._bnLogos || [];   /* [{id,src}] */
    window._bnLogoDataUrl = window._bnLogoDataUrl || null;  /* 向下相容：第一張 */
    var MAX_LOGOS = 3;
    window._bnProducts    = window._bnProducts    || [];
    var MAX_PROD = 3;

    /* ── 工具 ── */
    function readFile(file){ return new Promise(function(res,rej){var r=new FileReader();r.onload=function(e){res(e.target.result);};r.onerror=rej;r.readAsDataURL(file);}); }
    function loadImg(src){ return new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i);};i.onerror=rej;i.src=src;}); }
    function sampleCorner(d,w,h){function px(x,y){var i=(y*w+x)*4;return{r:d[i],g:d[i+1],b:d[i+2],a:d[i+3]};}var c=[px(0,0),px(w-1,0),px(0,h-1),px(w-1,h-1)].filter(function(p){return p.a>200;});if(!c.length)return{r:255,g:255,b:255};var r=0,g=0,b=0;c.forEach(function(p){r+=p.r;g+=p.g;b+=p.b;});return{r:r/c.length,g:g/c.length,b:b/c.length};}
    function autoTrim(img){var max=1200,sc=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));var w=Math.max(1,Math.round(img.naturalWidth*sc)),h=Math.max(1,Math.round(img.naturalHeight*sc));var c=document.createElement('canvas');c.width=w;c.height=h;var ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);var id=ctx.getImageData(0,0,w,h),d=id.data,bg=sampleCorner(d,w,h);var x0=w,y0=h,x1=-1,y1=-1;for(var y=0;y<h;y++)for(var x=0;x<w;x++){var i=(y*w+x)*4,a=d[i+3];if(a>18&&(a<245||Math.abs(d[i]-bg.r)+Math.abs(d[i+1]-bg.g)+Math.abs(d[i+2]-bg.b)>46)&&!(d[i]>246&&d[i+1]>246&&d[i+2]>246)){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}}if(x1<0)return{src:img.src,ratio:img.naturalWidth/img.naturalHeight};var pad=Math.round(Math.max(w,h)*.015);x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w-1,x1+pad);y1=Math.min(h-1,y1+pad);var tw=x1-x0+1,th=y1-y0+1;var o=document.createElement('canvas');o.width=tw;o.height=th;o.getContext('2d').drawImage(c,x0,y0,tw,th,0,0,tw,th);return{src:o.toDataURL('image/png'),ratio:tw/th};}

    /* ── 廣播 ── */
    function broadcast(msg){document.querySelectorAll('.preview-block iframe').forEach(function(f){try{f.contentWindow.postMessage(msg,'*');}catch(e){}});}
    function broadcastTo(id,msg){var f=document.getElementById('iframe-'+id);if(f)try{f.contentWindow.postMessage(msg,'*');}catch(e){}}
    function requestProductLayouts(){ broadcast({type:'bn-product-layout-request'}); }
    function markStateDirty(){ try{ document.dispatchEvent(new CustomEvent('bn-state-dirty')); }catch(_){ } }

    /* 方版 / 橫版排品連動：同一版位只差「方 / 橫」時，共用商品位置比例。 */
    function normalizePairName(name){
      return String(name || '')
        .replace(/\.html$/i, '')
        .replace(/#U65b9|#U6a6b/gi, '')
        .replace(/[方橫横]/g, '')
        .replace(/(square|vertical|portrait|horizontal|landscape)/gi, '')
        .replace(/[\s_\-()（）]+/g, '')
        .toLowerCase();
    }
    function getLayoutById(id){
      if(typeof window.loadLayouts !== 'function') return null;
      var layouts = window.loadLayouts() || [];
      return layouts.find(function(l){ return String(l.id) === String(id); }) || null;
    }
    function getPairedLayoutIds(sourceId){
      if(typeof window.loadLayouts !== 'function') return [];
      var layouts = window.loadLayouts() || [];
      var src = layouts.find(function(l){ return String(l.id) === String(sourceId); });
      if(!src) return [];
      var key = normalizePairName(src.name || src.file);
      if(!key) return [];
      return layouts.filter(function(l){
        return l.enabled !== false && String(l.id) !== String(sourceId) && normalizePairName(l.name || l.file) === key;
      }).map(function(l){ return String(l.id); });
    }
    function syncProductLayoutToPairs(product, sourceBnid, layout){
      var pairIds = getPairedLayoutIds(sourceBnid);
      if(!pairIds.length || !product || !layout) return;
      if(!product.layouts) product.layouts = {};
      pairIds.forEach(function(tid){
        var cloned = JSON.parse(JSON.stringify(layout));
        product.layouts[tid] = cloned;
        broadcastTo(tid, {type:'bn-product-layout-apply', id:product.id, layout:cloned});
      });
    }
    window.addEventListener('message', function(ev){
      var d = ev.data || {};
      if(d.type !== 'bn-product-layout-update' || !d.id || !d.layout) return;
      /* 下載圖片/同步 iframe 期間，iframe 可能因重送商品而回傳 layout-update。
         這些不是使用者拖曳，不能寫回 _bnProducts，也不能觸發本機暫存，
         否則下載會反過來覆蓋背景色、底圖或商品排版。 */
      if(window._bnSuppressProductLayoutWrite || window._bnExporting) return;
      var p = (window._bnProducts || []).find(function(x){ return x.id === d.id; });
      if(!p) return;
      if(!p.layouts) p.layouts = {};
      var key = d.bnid ? String(d.bnid) : 'default';
      p.layouts[key] = d.layout;
      syncProductLayoutToPairs(p, key, d.layout);
      /* 也保留最後一次實際畫布座標，方便舊版 JSON 或單版位還原 */
      p.x = d.layout.left; p.y = d.layout.top; p.width = d.layout.width; p.height = d.layout.height;
      p.layout = d.layout;
      markStateDirty();
    });

    /* ══ Logo 上傳 ══ */
    function insertLogoUI(){
      var scroll=document.getElementById('sidebar-scroll');
      if(!scroll||document.getElementById('bn-logo-drop'))return;
      var target=null;
      scroll.querySelectorAll('.s-section').forEach(function(el){if(el.textContent.trim()==='排版選擇')target=el;});
      var sec=document.createElement('div');
      sec.innerHTML=[
        '<div class="s-section" style="margin-top:14px">Logo 上傳（最多3張）</div>',
        '<div class="bn-section">',
        '  <div class="bn-drop" id="bn-logo-drop">',
        '    <input type="file" accept="image/*" multiple id="bn-logo-inp">',
        '    ＋ 點擊或拖曳上傳 Logo',
        '  </div>',
        '  <div class="bn-prod-list" id="bn-logo-list"></div>',
        '</div>',
      ].join('');
      if(target)scroll.insertBefore(sec,target);else scroll.appendChild(sec);
      var inp=document.getElementById('bn-logo-inp');
      var drop=document.getElementById('bn-logo-drop');
      inp.addEventListener('change',function(){
        var remaining=MAX_LOGOS-window._bnLogos.length;
        Array.from(this.files).slice(0,remaining).forEach(function(f){doLoadLogo(f);});
        inp.value='';
      });
      drop.addEventListener('dragover',function(e){e.preventDefault();this.classList.add('drag');});
      drop.addEventListener('dragleave',function(){this.classList.remove('drag');});
      drop.addEventListener('drop',function(e){
        e.preventDefault();this.classList.remove('drag');
        var remaining=MAX_LOGOS-window._bnLogos.length;
        Array.from(e.dataTransfer.files).filter(function(f){return f.type.startsWith('image/');})
          .slice(0,remaining).forEach(function(f){doLoadLogo(f);});
      });
    }

    function renderLogoList(){
      var list=document.getElementById('bn-logo-list');
      if(!list)return;
      list.innerHTML='';
      window._bnLogos.forEach(function(lg,i){
        var row=document.createElement('div');row.className='bn-prod-item';
        var img=document.createElement('img');img.src=lg.src;
        var name=document.createElement('span');name.textContent='Logo '+(i+1);
        /* 恢復圓邊狀態 */
        if(lg.round){ img.dataset.bnLogoRound='1'; img.style.borderRadius='50%'; }

        /* 編輯按鈕：點了彈出四個選項 */
        /* ◀ ▶ 換位置箭頭 */
        var moveWrap=document.createElement('div');
        moveWrap.style.cssText='display:flex;flex-direction:column;gap:2px;flex-shrink:0;';

        var upLogo=document.createElement('button');upLogo.textContent='▲';upLogo.title='往前';
        var dnLogo=document.createElement('button');dnLogo.textContent='▼';dnLogo.title='往後';
        var logoIdx = window._bnLogos.indexOf(lg);
        upLogo.disabled = logoIdx === 0;
        dnLogo.disabled = logoIdx === window._bnLogos.length - 1;
        upLogo.style.opacity = upLogo.disabled ? '0.3' : '1';
        dnLogo.style.opacity = dnLogo.disabled ? '0.3' : '1';

        upLogo.addEventListener('click',(function(lid){return function(){
          var idx=window._bnLogos.findIndex(function(x){return x.id===lid;});
          if(idx<=0)return;
          var tmp=window._bnLogos[idx]; window._bnLogos[idx]=window._bnLogos[idx-1]; window._bnLogos[idx-1]=tmp;
          window._bnLogoDataUrl=window._bnLogos[0].src;
          renderLogoList(); broadcast({type:'bn-logos',logos:window._bnLogos});
        };})(lg.id));

        dnLogo.addEventListener('click',(function(lid){return function(){
          var idx=window._bnLogos.findIndex(function(x){return x.id===lid;});
          if(idx<0||idx>=window._bnLogos.length-1)return;
          var tmp=window._bnLogos[idx]; window._bnLogos[idx]=window._bnLogos[idx+1]; window._bnLogos[idx+1]=tmp;
          window._bnLogoDataUrl=window._bnLogos[0].src;
          renderLogoList(); broadcast({type:'bn-logos',logos:window._bnLogos});
        };})(lg.id));

        moveWrap.appendChild(upLogo); moveWrap.appendChild(dnLogo);

        var editBtn=document.createElement('button');editBtn.textContent='編輯';
        editBtn.addEventListener('click',(function(lid, imgRef){return function(e){
          e.stopPropagation();
          showLogoMenu(lid, imgRef, editBtn);
        };})(lg.id, img));

        var btn=document.createElement('button');btn.textContent='移除';
        btn.addEventListener('click',(function(lid){return function(){
          window._bnLogos=window._bnLogos.filter(function(x){return x.id!==lid;});
          window._bnLogoDataUrl=window._bnLogos.length?window._bnLogos[0].src:null;
          renderLogoList();
          broadcast({type:'bn-logo-remove',id:lid});
          broadcast({type:'bn-logos',logos:window._bnLogos});
        };})(lg.id));
        row.appendChild(img);row.appendChild(name);row.appendChild(moveWrap);row.appendChild(editBtn);row.appendChild(btn);
        list.appendChild(row);
      });
      /* drop 按鈕狀態 */
      var drop=document.getElementById('bn-logo-drop');
      if(drop) drop.style.opacity=window._bnLogos.length>=MAX_LOGOS?'0.4':'1';
    }


    /* 工具列「編輯」按鈕的選單 */
    function showLogoMenu(lid, imgEl, anchorEl){
      function doShow(){
        if(!window.BNLogoMenu){ return; }
        var n = window._bnLogos.length;
        var idx = window._bnLogos.findIndex(function(x){return x.id===lid;});
        /* 建選單 */
        var menu = document.getElementById('_bn_logo_inline_menu');
        if(!menu){
          menu = document.createElement('div');
          menu.id = '_bn_logo_inline_menu';
          menu.style.cssText = [
            'position:fixed;z-index:999999;',
            'background:#111;color:#fff;',
            'border-radius:10px;',
            'box-shadow:0 8px 24px rgba(0,0,0,.4);',
            'padding:6px 0;min-width:120px;',
          ].join('');
          document.body.appendChild(menu);
          document.addEventListener('click', function(){
            menu.style.display='none';
          });
        }

        var items = [
          { label:'裁切', action:'crop' },
          { label:'加圓邊', action:'round' },
        ];

        menu.innerHTML = '';
        items.forEach(function(item){
          if(item.hidden) return;
          var b = document.createElement('button');
          b.textContent = item.action === 'round'
            ? (imgEl.dataset.bnLogoRound === '1' ? '取消圓邊' : '加圓邊')
            : item.label;
          b.style.cssText = 'display:block;width:100%;border:0;background:transparent;color:#fff;text-align:left;padding:7px 14px;font-size:13px;cursor:pointer;';
          b.addEventListener('mouseover', function(){ this.style.background='#2b2b2b'; });
          b.addEventListener('mouseout',  function(){ this.style.background='transparent'; });
          b.addEventListener('click', function(e){
            e.stopPropagation();
            menu.style.display = 'none';
            handleLogoAction(item.action, lid, imgEl);
          });
          menu.appendChild(b);
        });

        /* 定位到按鈕旁邊 */
        var rect = anchorEl.getBoundingClientRect();
        var left = rect.left;
        var top  = rect.bottom + 4;
        if(left + 130 > window.innerWidth) left = window.innerWidth - 134;
        menu.style.left = left + 'px';
        menu.style.top  = top  + 'px';
        menu.style.display = 'block';
      }

      if(window.BNLogoMenu){ doShow(); }
      else {
        var s=document.createElement('script');
        s.src='js/logo-editor-plugin.js';
        s.onload=doShow;
        document.head.appendChild(s);
      }
    }

    function handleLogoAction(action, lid, imgEl){
      if(action === 'crop'){
        window.BNLogoMenu.openCropEditor(imgEl.src, function(newSrc){
          if(!newSrc) return;
          var lo = window._bnLogos.find(function(x){return x.id===lid;});
          if(lo){
            lo.src = newSrc;
            imgEl.src = newSrc;
            window._bnLogoDataUrl = window._bnLogos[0].src;
            broadcast({type:'bn-logos', logos:window._bnLogos});
          }
        });
      } else if(action === 'swap'){
        var idx = window._bnLogos.findIndex(function(x){return x.id===lid;});
        if(idx >= 0){
          var next = (idx + 1) % window._bnLogos.length;
          var tmp = window._bnLogos[idx];
          window._bnLogos[idx] = window._bnLogos[next];
          window._bnLogos[next] = tmp;
          window._bnLogoDataUrl = window._bnLogos[0].src;
          renderLogoList();
          broadcast({type:'bn-logos', logos:window._bnLogos});
        }
      } else if(action === 'round'){
        var isOn = imgEl.dataset.bnLogoRound === '1';
        imgEl.dataset.bnLogoRound = isOn ? '' : '1';
        imgEl.style.borderRadius  = isOn ? '' : '10px';
        /* 把 round 狀態存進 _bnLogos */
        var lo = window._bnLogos.find(function(x){return x.id===lid;});
        if(lo) lo.round = !isOn;
        broadcast({type:'bn-logos', logos:window._bnLogos});
        renderLogoList();
      } else if(action === 'delete'){
        window._bnLogos = window._bnLogos.filter(function(x){return x.id!==lid;});
        window._bnLogoDataUrl = window._bnLogos.length ? window._bnLogos[0].src : null;
        renderLogoList();
        broadcast({type:'bn-logo-remove', id:lid});
        broadcast({type:'bn-logos', logos:window._bnLogos});
      }
    }

    /* ══ Logo Menu（logo-editor-plugin.js 的 BNLogoMenu） ══ */
    function attachLogoMenu(lid, imgEl){
      function doAttach(){
        if(!window.BNLogoMenu){ return; }
        var n = window._bnLogos.length;
        window.BNLogoMenu.attach(imgEl, {
          showSwap: n > 1,
          onEdit: function(el, newSrc){
            var lo = window._bnLogos.find(function(x){return x.id===lid;});
            if(lo){
              lo.src = newSrc;
              el.src = newSrc;
              window._bnLogoDataUrl = window._bnLogos[0].src;
              broadcast({type:'bn-logos', logos:window._bnLogos});
            }
          },
          onSwap: function(){
            /* 往右移：把此 logo 往後排一位 */
            var idx = window._bnLogos.findIndex(function(x){return x.id===lid;});
            if(idx < 0) return;
            var next = (idx + 1) % window._bnLogos.length;
            var tmp = window._bnLogos[idx];
            window._bnLogos[idx] = window._bnLogos[next];
            window._bnLogos[next] = tmp;
            window._bnLogoDataUrl = window._bnLogos[0].src;
            renderLogoList();
            broadcast({type:'bn-logos', logos:window._bnLogos});
          },
          onDelete: function(){
            window._bnLogos = window._bnLogos.filter(function(x){return x.id!==lid;});
            window._bnLogoDataUrl = window._bnLogos.length ? window._bnLogos[0].src : null;
            renderLogoList();
            broadcast({type:'bn-logo-remove', id:lid});
            broadcast({type:'bn-logos', logos:window._bnLogos});
          },
          onRound: function(el, isOn){
            broadcast({type:'bn-logos', logos:window._bnLogos});
          }
        });
      }
      if(window.BNLogoMenu){
        doAttach();
      } else {
        var s=document.createElement('script');
        s.src='js/logo-editor-plugin.js';
        s.onload=doAttach;
        document.head.appendChild(s);
      }
    }

    function doLoadLogo(file){
      if(window._bnLogos.length>=MAX_LOGOS)return;
      readFile(file).then(function(s){
        var id='logo_'+Date.now();
        window._bnLogos.push({id:id,src:s});
        window._bnLogoDataUrl=window._bnLogos[0].src;
        renderLogoList();
        /* 廣播：送出全部 logos */
        broadcast({type:'bn-logos',logos:window._bnLogos});
      });
    }

    /* ══ 商品上傳（Modal） ══ */
    var modal, staged=[], heroIdx=0, rankOrder=null, currentStep=1, dragSrc=null;

    function insertProductUI(){
      var scroll=document.getElementById('sidebar-scroll');
      if(!scroll||document.getElementById('bn-prod-open-btn'))return;
      var target=null;
      scroll.querySelectorAll('.s-section').forEach(function(el){if(el.textContent.trim()==='排版選擇')target=el;});
      var sec=document.createElement('div');
      sec.innerHTML=[
        '<div class="s-section" style="margin-top:8px">商品圖（最多3張）</div>',
        '<div class="bn-section">',
        '  <button id="bn-prod-open-btn">＋ 上傳商品圖</button>',
        '  <div class="bn-prod-list" id="bn-prod-list"></div>',
        '</div>',
        '<div class="s-section" style="margin-top:8px">背景圖</div>',
        '<div class="bn-section">',
        '  <button id="bn-bg-open-btn">⬆ 上傳背景圖</button>',
        '  <input type="file" id="bn-bg-inp" accept="image/*" style="display:none">',
        '  <div id="bn-bg-preview" style="display:none;margin-top:6px">',
        '    <div style="position:relative;margin-bottom:4px">',
        '      <img id="bn-bg-thumb" style="width:100%;max-height:60px;object-fit:cover;border-radius:5px;border:1px solid var(--border,#30363d)">',
        '      <button id="bn-bg-clear" style="position:absolute;top:3px;right:3px;background:rgba(0,0,0,.6);border:none;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1">✕</button>',
        '    </div>',
        '    <div id="bn-bg-summary" style="font-size:10px;color:var(--text3,#687090)">各版位可在右側獨立調整縮放和位置</div>',
        '  </div>',
        '</div>',
      ].join('');
      if(target)scroll.insertBefore(sec,target);else scroll.appendChild(sec);
      document.getElementById('bn-prod-open-btn').addEventListener('click',openModal);
      buildModal();

      /* 背景圖上傳事件 */
      var bgInp = document.getElementById('bn-bg-inp');
      var bgPreview = document.getElementById('bn-bg-preview');
      var bgThumb = document.getElementById('bn-bg-thumb');
      var bgClear = document.getElementById('bn-bg-clear');
      var bgOpenBtn = document.getElementById('bn-bg-open-btn');

      /* 每個版位獨立的背景圖狀態 */
      var _bgStates = {}; /* { layoutId: {src,fit,scale,x,y} } */
      var _bgActiveId = null; /* 目前編輯的版位 id */

      function cloneBgStates(){
        var out = {};
        var hasSrc = false;
        Object.keys(_bgStates).forEach(function(id){
          var st = _bgStates[id] || {};
          if(st.src && st.src !== '__BN_IDB__') hasSrc = true;
          out[id] = {
            src: (st.src && st.src !== '__BN_IDB__') ? st.src : null,
            fit: st.fit || 'cover',
            scale: st.scale !== undefined ? st.scale : 100,
            x: st.x !== undefined ? st.x : 50,
            y: st.y !== undefined ? st.y : 50,
            _initialized: !!st._initialized
          };
        });

        /* 舊版背景上傳流程只存在 window._bgDataUrl；若 _bgStates 尚未建立，
           下載/本機暫存仍要把畫布上的背景圖完整帶走。 */
        if(!hasSrc && window._bgDataUrl){
          document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
            var id = getIfrBnid(ifrEl);
            if(!id) return;
            out[id] = out[id] || {fit:'auto',scale:100,x:50,y:50,_initialized:true};
            out[id].src = window._bgDataUrl;
            out[id].fit = out[id].fit || 'auto';
            out[id].scale = out[id].scale !== undefined ? out[id].scale : 100;
            out[id].x = out[id].x !== undefined ? out[id].x : 50;
            out[id].y = out[id].y !== undefined ? out[id].y : 50;
            out[id]._initialized = true;
          });
        }
        return out;
      }

      function refreshBgPreviewFromStates(){
        var first = null;
        Object.keys(_bgStates).some(function(id){
          if(_bgStates[id] && _bgStates[id].src){ first = _bgStates[id].src; return true; }
          return false;
        });
        if(bgThumb) bgThumb.src = first || '';
        if(bgPreview) bgPreview.style.display = first ? 'block' : 'none';
        if(bgOpenBtn) bgOpenBtn.textContent = first ? '⬆ 更換背景圖' : '⬆ 上傳背景圖';
      }

      function applyBgStates(nextStates, activeId){
        var prevStates = _bgStates || {};
        _bgStates = {};
        var hasRealSrc = false;
        if(nextStates && typeof nextStates === 'object'){
          Object.keys(nextStates).forEach(function(id){
            var st = nextStates[id] || {};
            var prev = prevStates[id] || {};
            /* __BN_IDB__ 是 localStorage 輕量備援的佔位符，不能當成 null 廣播，否則會洗掉畫布背景。 */
            var src = st.src === '__BN_IDB__' ? (prev.src || window._bgDataUrl || null) : (st.src || null);
            if(src) hasRealSrc = true;
            _bgStates[id] = {
              src: src,
              fit: st.fit || prev.fit || 'cover',
              scale: st.scale !== undefined ? parseInt(st.scale,10) : (prev.scale !== undefined ? prev.scale : 100),
              x: st.x !== undefined ? parseInt(st.x,10) : (prev.x !== undefined ? prev.x : 50),
              y: st.y !== undefined ? parseInt(st.y,10) : (prev.y !== undefined ? prev.y : 50),
              _initialized: st._initialized !== false
            };
          });
        }
        /* 若載入的是舊版 JSON，只帶 legacySrc，補成每個 iframe 的背景狀態。 */
        if(!hasRealSrc && window._bgDataUrl){
          document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
            var id = getIfrBnid(ifrEl);
            if(!id) return;
            _bgStates[id] = _bgStates[id] || {fit:'auto',scale:100,x:50,y:50,_initialized:true};
            _bgStates[id].src = window._bgDataUrl;
          });
        }
        _bgActiveId = activeId || _bgActiveId || null;
        refreshBgPreviewFromStates();
        /* 上傳暫存後 iframe 可能尚未 ready，連續補送確保右側畫布也吃到背景圖。 */
        [0, 120, 350, 800, 1500].forEach(function(delay){
          setTimeout(function(){ buildBgPanels(); bgBroadcastAll(); }, delay);
        });
      }

      function getBgState(id){
        if(!_bgStates[id]) _bgStates[id] = {src:null,fit:'cover',scale:100,x:50,y:50};
        return _bgStates[id];
      }

      /* 暴露給 bn-state-plugin：讓下載/上傳暫存能完整包含背景圖與各版位設定 */
      window._bnGetBgStates = function(){ return cloneBgStates(); };
      window._bnSetBgStates = function(states, activeId){ applyBgStates(states, activeId); };
      window._bnGetBgActiveId = function(){ return _bgActiveId; };
      window._bnRefreshCanvasBackgrounds = function(){
        if(window._bgDataUrl){
          document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
            var id = getIfrBnid(ifrEl);
            if(!id) return;
            var st = getBgState(id);
            if(!st.src) st.src = window._bgDataUrl;
          });
        }
        bgBroadcastAll();
      };
      /* 精準同步單一 iframe 背景。下載圖片會用這個，避免廣播全部版位時
         把尚未 ready 或 id 取不到的 iframe 送成 null 背景。 */
      window._bnSendBgToIframe = function(ifrEl, id){
        if(!ifrEl || !id) return;
        bgSendToIframe(ifrEl, String(id));
      };
      window._bnGetBgStateForId = function(id){
        if(!id) return null;
        try{ return JSON.parse(JSON.stringify(getBgState(String(id)))); }catch(_){ return getBgState(String(id)); }
      };

      function getIfrBnid(ifrEl){
        try{
          /* 先從 src query string 取 */
          var qs = (ifrEl.src||'').split('?')[1]||'';
          var id = new URLSearchParams(qs).get('bnid');
          if(id) return String(id);
          /* fallback：從 contentWindow 的 location 取 */
          var loc = ifrEl.contentWindow && ifrEl.contentWindow.location;
          if(loc){ id = new URLSearchParams(loc.search||'').get('bnid'); if(id) return String(id); }
        }catch(_){}
        return null;
      }

      function bgSendToIframe(ifrEl, id){
        var st = getBgState(id);
        try{ ifrEl.contentWindow.postMessage(
          {type:'bn-bg', src:st.src, fit:st.fit, scale:st.scale, x:st.x, y:st.y}, '*');
        }catch(_){}
      }

      function bgBroadcastOne(id){
        document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
          if(getIfrBnid(ifrEl) === String(id)) bgSendToIframe(ifrEl, id);
        });
      }

      function bgBroadcastAll(){
        document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
          var id = getIfrBnid(ifrEl);
          /* id 取不到時，用 _bgActiveId 的狀態廣播給所有 iframe */
          var st = id ? getBgState(id) : (_bgActiveId ? getBgState(_bgActiveId) : null);
          if(!st) return;
          try{
            ifrEl.contentWindow.postMessage({
              type:'bn-bg', src:st.src || null, fit:st.fit, scale:st.scale, x:st.x, y:st.y
            }, '*');
          }catch(_){}
        });
      }

      function bgBroadcast(){
        if(_bgActiveId){
          bgBroadcastOne(_bgActiveId);
        } else {
          /* activeId 未設定，廣播所有版位 */
          document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
            var id = getIfrBnid(ifrEl);
            if(id) bgSendToIframe(ifrEl, id);
          });
        }
      }

      /* 舊的版位切換函式保留但不使用 */
      function bindBgLayoutSwitch(){
        document.querySelectorAll('.preview-block').forEach(function(block){
          block.addEventListener('click', function(){
            var ifrEl = block.querySelector('iframe');
            if(!ifrEl) return;
            var bnid = getIfrBnid(ifrEl);
            if(!bnid) return;
            _bgActiveId = bnid;
            var st = getBgState(bnid);
            /* 更新控制面板 */
            var scaleEl = document.getElementById('bn-bg-scale');
            var scaleValEl = document.getElementById('bn-bg-scale-val');
            var xEl = document.getElementById('bn-bg-x');
            var yEl = document.getElementById('bn-bg-y');
            var thumbEl = document.getElementById('bn-bg-thumb');
            var previewEl = document.getElementById('bn-bg-preview');
            var openBtnEl = document.getElementById('bn-bg-open-btn');
            if(scaleEl){ scaleEl.value = st.scale; }
            if(scaleValEl){ scaleValEl.textContent = st.scale+'%'; }
            if(xEl){ xEl.value = st.x; }
            if(yEl){ yEl.value = st.y; }
            if(thumbEl && st.src){ thumbEl.src = st.src; }
            if(previewEl){ previewEl.style.display = st.src ? 'block' : 'none'; }
            if(openBtnEl){ openBtnEl.textContent = st.src ? '⬆ 更換背景圖' : '⬆ 上傳背景圖'; }
            updateFitBtns(st.fit);
            /* 標示選取中的版位 */
            document.querySelectorAll('.preview-block').forEach(function(b){
              b.style.outline = b===block ? '2px solid #4a90e2' : '';
            });
          });
        });
        /* 預設選第一個版位 */
        var first = document.querySelector('.preview-block iframe');
        if(first && !_bgActiveId){
          var bnid = getIfrBnid(first);
          if(bnid) _bgActiveId = bnid;
        }
      }

      /* 每次 iframe ready 後重新綁定 */
      var origOnIframeReady = window._bnOnIframeReady;
      window._bnOnIframeReady = function(id){
        if(typeof origOnIframeReady==='function') origOnIframeReady(id);
        setTimeout(function(){
          bindBgLayoutSwitch();
          /* 把已有的狀態推給新 iframe */
          var st = getBgState(id);
          if(st.src){
            document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
              var bnid = getIfrBnid(ifrEl);
              if(bnid && String(bnid)===String(id)){
                try{ ifrEl.contentWindow.postMessage({type:'bn-bg',src:st.src,fit:st.fit,scale:st.scale,x:st.x,y:st.y},'*');}catch(_){}
              }
            });
          }
        }, 300);
      };

      /* 吸取圖片左上角 5x5px 平均色 */
      function sampleTopLeftColor(dataUrl, cb){
        var img = new Image();
        img.onload = function(){
          var c = document.createElement('canvas');
          c.width = 5; c.height = 5;
          var ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, 5, 5);
          var d = ctx.getImageData(0, 0, 5, 5).data;
          var r=0,g=0,b=0;
          for(var i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; }
          var n=d.length/4;
          r=Math.round(r/n); g=Math.round(g/n); b=Math.round(b/n);
          cb('#'+[r,g,b].map(function(v){ return ('0'+v.toString(16)).slice(-2); }).join(''));
        };
        img.src = dataUrl;
      }

      function updateFitBtns(panelEl, fitVal){
        if(!panelEl) return;
        panelEl.querySelectorAll('[data-fit]').forEach(function(btn){
          var active = btn.dataset.fit === fitVal;
          btn.style.background = active ? '#1f6feb' : 'rgba(255,255,255,.06)';
          btn.style.color = active ? '#fff' : '#8b9dbf';
        });
      }

      /* 建立每個 preview-block 右側的背景圖控制面板 */
      function buildBgPanels(){
        document.querySelectorAll('.preview-block').forEach(function(block){
          if(block.querySelector('.bn-bg-panel')) {
            /* 背景圖上傳/暫存載入後，面板已存在時仍要補送目前背景到 iframe。 */
            var existedIframe = block.querySelector('iframe');
            var existedId = existedIframe ? getIfrBnid(existedIframe) : null;
            if(existedIframe && existedId) bgSendToIframe(existedIframe, existedId);
            return;
          }
          var ifrEl = block.querySelector('iframe');
          if(!ifrEl) return;
          var id = getIfrBnid(ifrEl);
          if(!id) return;

          var panel = document.createElement('div');
          panel.className = 'bn-bg-panel';
          panel.style.cssText = [
            'position:fixed;width:150px;',
            'background:#13161f;border:1px solid #2e3347;border-radius:8px;',
            'padding:8px;font-size:10px;color:#8b9dbf;',
            'display:none;z-index:10000;',
            'box-shadow:0 4px 16px rgba(0,0,0,.4);'
          ].join('');

          /* 跟隨視窗捲動：固定在版位右側，垂直置中於視窗可見區域（不超出版位範圍）*/
          function updatePanelPos(){
            if(panel.style.display === 'none') return;
            var blockRect = block.getBoundingClientRect();
            var panelH = panel.offsetHeight || 200;
            /* 水平：版位右側 8px */
            var px = blockRect.right + 8;
            /* 垂直：視窗中心，限制在版位範圍內 */
            var viewMid = window.innerHeight / 2;
            var py = viewMid - panelH / 2;
            var minY = blockRect.top;
            var maxY = blockRect.bottom - panelH;
            py = Math.max(minY, Math.min(py, maxY));
            panel.style.left = px + 'px';
            panel.style.top  = py + 'px';
          }
          window.addEventListener('scroll', updatePanelPos, true);
          panel.innerHTML = [
            '<div style="font-weight:700;margin-bottom:6px;color:#dde3f0">背景圖調整</div>',
            '<div style="display:flex;gap:3px;margin-bottom:6px">',
            '  <button data-fit="cover"   style="flex:1;padding:3px;border-radius:4px;border:none;cursor:pointer;font-size:9px">填滿</button>',
            '  <button data-fit="auto"    style="flex:1;padding:3px;border-radius:4px;border:none;cursor:pointer;font-size:9px">原尺寸</button>',
            '</div>',
            '<div style="margin-bottom:2px">縮放 <span class="bg-scale-val">100%</span></div>',
            '<input type="range" class="bg-scale" min="0" max="400" value="100" style="width:100%;margin-bottom:4px">',
            '<div style="margin-bottom:2px">水平位置</div>',
            '<input type="range" class="bg-x" min="-100" max="200" value="50" style="width:100%;margin-bottom:4px">',
            '<div style="margin-bottom:2px">垂直位置</div>',
            '<input type="range" class="bg-y" min="-100" max="200" value="50" style="width:100%">',
          ].join('');

          /* 事件 */
          function setSlider(el, disabled){
            el.disabled = disabled;
            el.style.opacity = disabled ? '0.3' : '1';
            el.style.cursor  = disabled ? 'not-allowed' : 'pointer';
          }
          function updateSliderState(fitVal){
            var scaleEl = panel.querySelector('.bg-scale');
            var xEl     = panel.querySelector('.bg-x');
            var yEl     = panel.querySelector('.bg-y');
            if(fitVal === 'auto'){
              /* 原尺寸：三個都可用 */
              setSlider(scaleEl, false);
              setSlider(xEl, false);
              setSlider(yEl, false);
            } else if(fitVal === 'cover'){
              /* 填滿：圖片裁切填滿，水平/垂直可移動裁切位置，縮放無效 */
              setSlider(scaleEl, true);
              setSlider(xEl, false);
              setSlider(yEl, false);
}
          }

          panel.querySelectorAll('[data-fit]').forEach(function(btn){
            btn.addEventListener('click', function(){
              getBgState(id).fit = btn.dataset.fit;
              updateFitBtns(panel, btn.dataset.fit);
              updateSliderState(btn.dataset.fit);
              bgBroadcastOne(id);
              markStateDirty();
            });
          });
          panel.querySelector('.bg-scale').addEventListener('input', function(){
            var v = parseInt(this.value);
            getBgState(id).scale = v;
            panel.querySelector('.bg-scale-val').textContent = v + '%';
            bgBroadcastOne(id);
            markStateDirty();
          });
          panel.querySelector('.bg-x').addEventListener('input', function(){
            getBgState(id).x = parseInt(this.value);
            bgBroadcastOne(id);
            markStateDirty();
          });
          panel.querySelector('.bg-y').addEventListener('input', function(){
            getBgState(id).y = parseInt(this.value);
            bgBroadcastOne(id);
            markStateDirty();
          });

          /* 初始 fit 樣式（預設原尺寸）*/
          updateFitBtns(panel, 'auto');
          updateSliderState('auto');

          /* hover 顯示面板：用 timer 延遲隱藏，避免移到面板途中消失 */
          var _hideTimer = null;
          function showPanel(){
            var thumb = document.getElementById('bn-bg-thumb');
            if(!thumb || !thumb.src) return;
            clearTimeout(_hideTimer);
            panel.style.display = 'block';
            updatePanelPos();
          }
          function hidePanel(){
            clearTimeout(_hideTimer);
            _hideTimer = setTimeout(function(){ panel.style.display = 'none'; }, 300);
          }
          block.style.position = 'relative';
          block.addEventListener('mouseenter', showPanel);
          block.addEventListener('mouseleave', hidePanel);
          panel.addEventListener('mouseenter', function(){ clearTimeout(_hideTimer); });
          panel.addEventListener('mouseleave', hidePanel);

          block.appendChild(panel);
        });
      }

      function getBgLayoutOrientation(id, ifrEl){
        /*
         * 背景套用方向改用版位實際寬高比判斷，不再用名稱裡的「橫 / 方 / 直」判斷。
         * 例如「DDCard 橫 Logo」只是 Logo 排法，版位本身仍是方 / 直比例，應吃直式背景。
         */
        function toNum(v){
          var n = parseFloat(v);
          return isFinite(n) && n > 0 ? n : 0;
        }
        function pickBySize(w, h){
          w = toNum(w); h = toNum(h);
          if(w && h) return w > h ? 'horizontal' : 'vertical';
          return '';
        }

        try{
          var doc = ifrEl && (ifrEl.contentDocument || (ifrEl.contentWindow && ifrEl.contentWindow.document));
          if(doc){
            var body = doc.body || null;
            var byData = body ? pickBySize(body.getAttribute('data-fw'), body.getAttribute('data-fh')) : '';
            if(byData) return byData;

            var canvas = doc.getElementById('canvas') || doc.querySelector('#canvas,.canvas,[data-canvas]');
            if(canvas){
              var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
              var byRect = rect ? pickBySize(rect.width, rect.height) : '';
              if(byRect) return byRect;

              var cs = doc.defaultView && doc.defaultView.getComputedStyle ? doc.defaultView.getComputedStyle(canvas) : null;
              var byCss = cs ? pickBySize(cs.width, cs.height) : '';
              if(byCss) return byCss;

              var byEl = pickBySize(canvas.offsetWidth || canvas.clientWidth || canvas.scrollWidth, canvas.offsetHeight || canvas.clientHeight || canvas.scrollHeight);
              if(byEl) return byEl;
            }
          }
        }catch(_){}

        try{
          var layouts = (typeof window.loadLayouts === 'function') ? (window.loadLayouts() || []) : [];
          var item = layouts.find(function(l){ return String(l.id) === String(id); });
          if(item){
            var byLayout = pickBySize(item.width || item.w || item.fw || item.canvasWidth, item.height || item.h || item.fh || item.canvasHeight);
            if(byLayout) return byLayout;
          }
        }catch(_){}

        return 'vertical';
      }

      function applyBgByOrientation(horizontalSrc, verticalSrc){
        var h = horizontalSrc || null;
        var v = verticalSrc || null;
        if(!h && !v) return;
        var single = (h && !v) ? h : ((!h && v) ? v : null);
        window._bgDataUrl = h || v || single || null;
        document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
          var id = getIfrBnid(ifrEl);
          if(!id) return;
          var st = getBgState(id);
          var nextSrc = single || (getBgLayoutOrientation(id, ifrEl) === 'vertical' ? v : h) || h || v;
          st.src = nextSrc;
          if(!st._initialized){
            st.scale = 100; st.x = 50; st.y = 50; st.fit = 'auto';
            st._initialized = true;
          }
        });
        if(bgThumb) bgThumb.src = h || v || '';
        if(bgPreview) bgPreview.style.display = 'block';
        if(bgOpenBtn) bgOpenBtn.textContent = '⬆ 更換背景圖';
        var sum = document.getElementById('bn-bg-summary');
        if(sum) sum.textContent = (h && v) ? '已分別套用橫式 / 直式背景，各版位可在右側獨立調整縮放和位置' : '已套用單張背景到所有版位，各版位可在右側獨立調整縮放和位置';
        bgBroadcastAll();
        markStateDirty();
        setTimeout(buildBgPanels, 100);
        sampleTopLeftColor(h || v, function(hex){
          if(window.colorState && window.applyColor){
            window.colorState.canvasBg = hex;
            window._bnCanvasBgHardLock = hex;
            window._bnPersistentCanvasBg = hex;
            window._bnUserCanvasBgLocked = true;
            var prevKey = window.cpActiveKey;
            window.cpActiveKey = 'canvasBg';
            if(typeof window.applyColor === 'function') window.applyColor(hex);
            window.cpActiveKey = prevKey;
            markStateDirty();
          }
        });
      }

      function buildBgUploadModal(){
        if(document.getElementById('bn-bg-modal')) return;
        var el = document.createElement('div');
        el.id = 'bn-bg-modal';
        el.innerHTML = [
          '<div class="bn-bg-modal-box">',
          '  <div class="bn-modal-head"><h3>上傳背景圖</h3><button class="bn-modal-close" id="bn-bg-close">×</button></div>',
          '  <div class="bn-modal-body">',
          '    <div class="bn-bg-hint">左邊放橫式背景、右邊放直式背景。只放一邊時會套用到全部版位；兩邊都有時，系統會依每個版位的實際寬高比判斷：寬大於高套橫式，否則套直式。</div>',
          '    <div class="bn-bg-pair-grid">',
          '      <div class="bn-bg-drop-card" id="bn-bg-hdrop">',
          '        <div class="bn-bg-drop-title">橫式背景圖</div>',
          '        <div class="bn-bg-drop-desc">拖曳到這裡，或點擊選取檔案</div>',
          '        <img id="bn-bg-himg"><div class="bn-bg-drop-name" id="bn-bg-hname"></div>',
          '        <input id="bn-bg-hinp" type="file" accept="image/*">',
          '      </div>',
          '      <div class="bn-bg-drop-card" id="bn-bg-vdrop">',
          '        <div class="bn-bg-drop-title">直式背景圖</div>',
          '        <div class="bn-bg-drop-desc">拖曳到這裡，或點擊選取檔案</div>',
          '        <img id="bn-bg-vimg"><div class="bn-bg-drop-name" id="bn-bg-vname"></div>',
          '        <input id="bn-bg-vinp" type="file" accept="image/*">',
          '      </div>',
          '    </div>',
          '  </div>',
          '  <div class="bn-modal-foot"><button class="bn-btn-skip" id="bn-bg-cancel">取消</button><button class="bn-btn-confirm" id="bn-bg-confirm">套用背景</button></div>',
          '</div>'
        ].join('');
        document.body.appendChild(el);
        var stagedH = null, stagedV = null;
        function readTo(slot, file){
          if(!file || !file.type || !file.type.startsWith('image/')) return;
          var r = new FileReader();
          r.onload = function(e){
            var dataUrl = e.target.result;
            if(slot === 'h') stagedH = dataUrl; else stagedV = dataUrl;
            var drop = document.getElementById(slot === 'h' ? 'bn-bg-hdrop' : 'bn-bg-vdrop');
            var img = document.getElementById(slot === 'h' ? 'bn-bg-himg' : 'bn-bg-vimg');
            var name = document.getElementById(slot === 'h' ? 'bn-bg-hname' : 'bn-bg-vname');
            if(drop) drop.classList.add('has-img');
            if(img) img.src = dataUrl;
            if(name) name.textContent = file.name;
          };
          r.readAsDataURL(file);
        }
        function bindDrop(slot){
          var drop = document.getElementById(slot === 'h' ? 'bn-bg-hdrop' : 'bn-bg-vdrop');
          var inp = document.getElementById(slot === 'h' ? 'bn-bg-hinp' : 'bn-bg-vinp');
          if(!drop || !inp) return;
          inp.addEventListener('change', function(){ readTo(slot, this.files && this.files[0]); this.value=''; });
          drop.addEventListener('dragover', function(e){ e.preventDefault(); drop.classList.add('over'); });
          drop.addEventListener('dragleave', function(){ drop.classList.remove('over'); });
          drop.addEventListener('drop', function(e){
            e.preventDefault(); drop.classList.remove('over');
            readTo(slot, e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
          });
        }
        bindDrop('h'); bindDrop('v');
        function close(){ el.classList.remove('show'); }
        document.getElementById('bn-bg-close').addEventListener('click', close);
        document.getElementById('bn-bg-cancel').addEventListener('click', close);
        el.addEventListener('click', function(e){ if(e.target === el) close(); });
        document.getElementById('bn-bg-confirm').addEventListener('click', function(){
          applyBgByOrientation(stagedH, stagedV);
          close();
        });
        window._bnOpenBgModal = function(){ el.classList.add('show'); };
      }

      buildBgUploadModal();
      if(bgOpenBtn) bgOpenBtn.addEventListener('click', function(){ if(window._bnOpenBgModal) window._bnOpenBgModal(); });

      if(bgInp){
        bgInp.addEventListener('change', function(){
          var file = this.files[0];
          if(!file) return;
          var reader = new FileReader();
          reader.onload = function(e){
            var dataUrl = e.target.result;
            window._bgDataUrl = dataUrl;
            /* 把所有版位的 src 都設成這張圖，各自保留自己的 scale/x/y/fit */
            document.querySelectorAll('.preview-block iframe').forEach(function(ifrEl){
              var id = getIfrBnid(ifrEl);
              if(!id) return;
              var st = getBgState(id);
              st.src = dataUrl;
              /* 只有第一次上傳才重設位置，已有設定則保留 */
              if(!st._initialized){
                st.scale = 100; st.x = 50; st.y = 50; st.fit = 'auto';
                st._initialized = true;
              }
            });
            bgThumb.src = dataUrl;
            bgPreview.style.display = 'block';
            if(bgOpenBtn) bgOpenBtn.textContent = '⬆ 更換背景圖';
            /* 立即廣播給所有版位 */
            bgBroadcastAll();
            markStateDirty();
            /* 建立/更新版位右側控制面板 */
            setTimeout(buildBgPanels, 100);
            /* 吸左上角顏色→自動套用背景色 */
            sampleTopLeftColor(dataUrl, function(hex){
              if(window.colorState && window.applyColor){
                window.colorState.canvasBg = hex;
                window._bnCanvasBgHardLock = hex;
                window._bnPersistentCanvasBg = hex;
                window._bnUserCanvasBgLocked = true;
                window.applyColor && (function(){
                  /* 直接觸發 canvasBg 更新 */
                  var prevKey = window.cpActiveKey;
                  window.cpActiveKey = 'canvasBg';
                  if(typeof window.applyColor === 'function') window.applyColor(hex);
                  window.cpActiveKey = prevKey;
                  markStateDirty();
                })();
              }
            });
          };
          reader.readAsDataURL(file);
          bgInp.value = '';
        });

        bgClear.addEventListener('click', function(){
          /* 清除所有版位的背景圖 */
          Object.keys(_bgStates).forEach(function(id){ _bgStates[id].src = null; });
          window._bgDataUrl = null;
          bgThumb.src = '';
          bgPreview.style.display = 'none';
          if(bgOpenBtn) bgOpenBtn.textContent = '⬆ 上傳背景圖';
          bgBroadcastAll();
          markStateDirty();
          /* 隱藏所有控制面板 */
          document.querySelectorAll('.bn-bg-panel').forEach(function(p){ p.style.display='none'; });
        });

        /* 初始化版位右側控制面板（iframe ready 後觸發） */
        setTimeout(buildBgPanels, 1000);
      }
    }

    function buildModal(){
      if(document.getElementById('bn-prod-modal'))return;
      var el=document.createElement('div');
      el.id='bn-prod-modal';
      el.innerHTML=[
        '<div class="bn-modal-box">',
        '  <div class="bn-modal-head"><h3>上傳商品圖</h3><button class="bn-modal-close" id="bn-mc">×</button></div>',
        '  <div class="bn-modal-body">',
        '    <div class="bn-step-tabs">',
        '      <button class="bn-step-tab on" id="bn-st1">① 選取圖片</button>',
        '      <button class="bn-step-tab" id="bn-st2">② 確認大小比例</button>',
        '    </div>',
        '    <div id="bn-sc1">',
        '      <div class="bn-modal-drop" id="bn-mdrop">',
        '        <div style="font-size:22px;margin-bottom:4px">🖼️</div>',
        '        <div style="font-size:13px;font-weight:700;color:#dde3f0">拖曳或點擊選取圖片</div>',
        '        <p style="margin:4px 0 0;font-size:11px">最多3張，可多選</p>',
        '        <input id="bn-mfinp" type="file" accept="image/*" multiple>',
        '      </div>',
        '      <div class="bn-preview-grid" id="bn-mpgrid"></div>',
        '      <div id="bn-mno" style="text-align:center;color:#687090;font-size:12px;padding:8px">尚未選取圖片</div>',
        '      <div class="bn-limit-msg" id="bn-mlimit"></div>',
        '    </div>',
        '    <div id="bn-sc2" style="display:none">',
        '      <div style="font-size:12px;color:#4a90e2;background:rgba(74,144,226,.08);border:1px solid rgba(74,144,226,.2);border-radius:10px;padding:8px 12px;margin-bottom:14px;line-height:1.8">',
        '        ・<b style="color:#dde3f0">最前面 = 主品</b>，放中間最大<br>',
        '        ・左側配品第二大，右側配品最小<br>',
        '        ・用 ← → 箭頭或拖曳調整順序',
        '      </div>',
        '      <div class="bn-rank-row" id="bn-rrow"></div>',
        '      <div class="bn-rank-hint">圖片高度反映構圖時的相對大小</div>',
        '    </div>',
        '  </div>',
        '  <div class="bn-modal-foot">',
        '    <button class="bn-btn-skip" id="bn-mback" style="display:none">← 上一步</button>',
        '    <button class="bn-btn-skip" id="bn-mskip">跳過，直接套用</button>',
        '    <button class="bn-btn-confirm" id="bn-mnext">下一步 →</button>',
        '  </div>',
        '</div>',
      ].join('');
      document.body.appendChild(el);
      modal=el;

      // 事件綁定
      document.getElementById('bn-mc').addEventListener('click',closeModal);
      modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
      document.getElementById('bn-st1').addEventListener('click',function(){if(currentStep!==1)showStep(1);});
      document.getElementById('bn-st2').addEventListener('click',function(){if(currentStep!==2&&staged.length&&staged.length<=MAX_PROD)showStep(2);});
      document.getElementById('bn-mnext').addEventListener('click',function(){
        if(currentStep===1){if(!staged.length||staged.length>MAX_PROD)return;showStep(2);}
        else{applyWithOrder(rankOrder.map(function(i){return staged[i];}));closeModal();}
      });
      document.getElementById('bn-mback').addEventListener('click',function(){showStep(1);});
      document.getElementById('bn-mskip').addEventListener('click',function(){
        if(!staged.length){closeModal();return;}
        applyWithOrder(staged.slice(0,MAX_PROD),true);closeModal();
      });
      var mdrop=document.getElementById('bn-mdrop');
      var mfinp=document.getElementById('bn-mfinp');
      mdrop.addEventListener('click',function(e){if(e.target===mfinp)return;mfinp.click();});
      mdrop.addEventListener('dragover',function(e){e.preventDefault();this.classList.add('over');});
      mdrop.addEventListener('dragleave',function(){this.classList.remove('over');});
      mdrop.addEventListener('drop',function(e){e.preventDefault();this.classList.remove('over');handleFiles(Array.from(e.dataTransfer.files));});
      mfinp.addEventListener('change',function(){handleFiles(Array.from(this.files));this.value='';});
    }

    function openModal(){
      staged=window._bnProducts.map(function(p){return{src:p.src,name:p.name,ratio:p.ratio,fromExisting:true,id:p.id,baseSrc:p.baseSrc,meta:p.meta?JSON.parse(JSON.stringify(p.meta)):undefined};});
      heroIdx=0; rankOrder=null; currentStep=1;
      renderPreview(); updateLimit(); showStep(1);
      modal.classList.add('show');
    }
    function closeModal(){modal.classList.remove('show');}

    function handleFiles(files){
      var imgs=files.filter(function(f){return f.type.startsWith('image/');});
      var toAdd=imgs.slice(0,Math.max(0,MAX_PROD-staged.length+(staged.filter(function(s){return s.fromExisting;}).length)));
      if(!toAdd.length){updateLimit();renderPreview();return;}
      Promise.all(toAdd.map(function(f){return readFile(f).then(function(src){return{file:f,src:src,name:f.name.replace(/\.[^.]+$/,''),ratio:1};});}))
        .then(function(results){results.forEach(function(r){if(staged.length<MAX_PROD)staged.push(r);});renderPreview();updateLimit();});
    }

    function updateLimit(){
      var el=document.getElementById('bn-mlimit');
      var n=staged.length;
      if(n>MAX_PROD){el.style.color='#f5a623';el.textContent='目前 '+n+' 張，請移除 '+(n-MAX_PROD)+' 張才可繼續';}
      else if(n===MAX_PROD){el.style.color='#4a90e2';el.textContent='✓ 已選 3 張，可繼續下一步';}
      else if(n>0){el.style.color='#687090';el.textContent='已選 '+n+' 張（最多3張）';}
      else{el.textContent='';}
      var btn=document.getElementById('bn-mnext');
      if(btn&&currentStep===1){var ok=n>0&&n<=MAX_PROD;btn.disabled=!ok;}
    }

    function renderPreview(){
      var grid=document.getElementById('bn-mpgrid');
      var noEl=document.getElementById('bn-mno');
      if(!grid)return;
      grid.innerHTML='';
      noEl.style.display=staged.length?'none':'';
      staged.forEach(function(item,i){
        var isHero=(i===heroIdx);
        var cell=document.createElement('div');
        cell.className='bn-preview-cell'+(isHero?' is-hero':'');
        cell.innerHTML=(isHero?'<div class="pc-hero">主品</div>':'')+
          '<img src="'+item.src+'">'+
          '<div class="pc-name">'+item.name+'</div>'+
          '<div class="pc-rm" data-ri="'+i+'">×</div>';
        cell.addEventListener('click',function(e){if(e.target.dataset.ri!==undefined)return;heroIdx=i;renderPreview();});
        cell.querySelector('.pc-rm').addEventListener('click',function(e){
          e.stopPropagation();
          staged.splice(+e.target.dataset.ri,1);
          if(heroIdx>=staged.length)heroIdx=Math.max(0,staged.length-1);
          renderPreview();updateLimit();
        });
        grid.appendChild(cell);
      });
    }

    /* ── Step 2: 排序 ── */
    function initRankOrder(){
      rankOrder=[];
      if(heroIdx<staged.length)rankOrder.push(heroIdx);
      staged.forEach(function(_,i){if(i!==heroIdx)rankOrder.push(i);});
    }

    function renderRankRow(){
      var row=document.getElementById('bn-rrow');
      if(!row)return;
      row.innerHTML='';
      var posLabels=['最前面（中間）','左側配品','右側配品'];
      var posTags=['hero','left','right'];
      var heights=[120,95,75];
      dragSrc=null;

      rankOrder.forEach(function(itemIdx,pos){
        var item=staged[itemIdx];
        if(!item)return;
        var h=heights[pos]||75;
        var w=Math.round(h*(item.ratio||1));

        var card=document.createElement('div');
        card.className='bn-rank-card'; card.dataset.pos=pos; card.draggable=true;

        var wrap=document.createElement('div');
        wrap.className='bn-rank-img-wrap'; wrap.style.cssText='width:'+w+'px;height:'+h+'px;';
        var img=document.createElement('img');
        img.src=item.src; img.style.cssText='height:'+h+'px;width:auto;max-width:'+w+'px;';
        wrap.appendChild(img);

        if(pos>0){
          var al=document.createElement('button');al.className='bn-rank-arrow left-arr';al.textContent='‹';al.title='往左移';
          al.addEventListener('click',function(e){e.stopPropagation();var t=rankOrder[pos];rankOrder[pos]=rankOrder[pos-1];rankOrder[pos-1]=t;renderRankRow();});
          wrap.appendChild(al);
        }
        if(pos<rankOrder.length-1){
          var ar=document.createElement('button');ar.className='bn-rank-arrow right-arr';ar.textContent='›';ar.title='往右移';
          ar.addEventListener('click',function(e){e.stopPropagation();var t=rankOrder[pos];rankOrder[pos]=rankOrder[pos+1];rankOrder[pos+1]=t;renderRankRow();});
          wrap.appendChild(ar);
        }
        card.appendChild(wrap);

        var nameEl=document.createElement('div');nameEl.className='bn-rank-name';nameEl.textContent=item.name;card.appendChild(nameEl);
        var tagEl=document.createElement('div');tagEl.className='bn-rank-tag '+(posTags[pos]||'left');tagEl.textContent=posLabels[pos]||'配品';card.appendChild(tagEl);

        card.addEventListener('dragstart',function(e){dragSrc=+card.dataset.pos;e.dataTransfer.effectAllowed='move';setTimeout(function(){card.classList.add('dragging');},0);});
        card.addEventListener('dragend',function(){card.classList.remove('dragging');hideLine();dragSrc=null;});
        row.appendChild(card);
      });

      /* drop line */
      var line=document.createElement('div');line.className='bn-drop-line';row.appendChild(line);
      function hideLine(){line.style.display='none';}
      function getInsertIdx(cx){var cards=Array.from(row.querySelectorAll('.bn-rank-card'));for(var i=0;i<cards.length;i++){var r=cards[i].getBoundingClientRect();if(cx<r.left+r.width*.5)return i;}return cards.length;}
      function showLine(cx){var cards=Array.from(row.querySelectorAll('.bn-rank-card'));var rr=row.getBoundingClientRect();var idx=getInsertIdx(cx);var lx;if(!cards.length){lx=0;}else if(idx===0){lx=cards[0].getBoundingClientRect().left-rr.left-8;}else if(idx>=cards.length){lx=cards[cards.length-1].getBoundingClientRect().right-rr.left+8;}else{lx=(cards[idx-1].getBoundingClientRect().right+cards[idx].getBoundingClientRect().left)/2-rr.left;}line.style.left=Math.round(lx)+'px';line.style.display='block';}
      row.addEventListener('dragover',function(e){if(dragSrc===null)return;e.preventDefault();showLine(e.clientX);});
      row.addEventListener('dragleave',function(e){if(!row.contains(e.relatedTarget))hideLine();});
      row.addEventListener('drop',function(e){e.preventDefault();hideLine();if(dragSrc===null)return;var idx=getInsertIdx(e.clientX);var moved=rankOrder.splice(dragSrc,1)[0];if(idx>dragSrc)idx--;rankOrder.splice(idx,0,moved);dragSrc=null;renderRankRow();});
    }

    function showStep(n){
      currentStep=n;
      document.getElementById('bn-sc1').style.display=n===1?'':'none';
      document.getElementById('bn-sc2').style.display=n===2?'':'none';
      document.getElementById('bn-st1').classList.toggle('on',n===1);
      document.getElementById('bn-st2').classList.toggle('on',n===2);
      document.getElementById('bn-mback').style.display=n===2?'':'none';
      document.getElementById('bn-mnext').textContent=n===1?'下一步 →':'確認並套用';
      document.getElementById('bn-mskip').textContent=n===1?'跳過，直接套用':'跳過比例，直接套用';
      document.getElementById('bn-mnext').disabled=false;
      if(n===1)updateLimit();
      if(n===2){initRankOrder();renderRankRow();}
    }

    /* ── 套用 ── */
    async function applyWithOrder(orderedItems,skipRatio){
      if(!orderedItems.length)return;
      /* 清除舊商品 */
      var oldIds=window._bnProducts.map(function(p){return p.id;});
      oldIds.forEach(function(id){broadcast({type:'bn-product-remove',id:id});});
      window._bnProducts=[];

      var sizeRatios=skipRatio?null:[1,0.85,0.72];
      for(var i=0;i<orderedItems.length;i++){
        var item=orderedItems[i];
        var src=item.src;
        /* 如果是已有的商品直接用，否則先 autoTrim */
        if(!item.fromExisting){
          var img=await loadImg(src);
          var trimmed=autoTrim(img);
          src=trimmed.src;
          item.ratio=trimmed.ratio;
        }
        var id='p'+Date.now()+'_'+i;
        var sizeScale=sizeRatios?sizeRatios[i]||0.72:1;
        /* position: 0=主品(中), 1=左配, 2=右配 */
        var positionMap = [0, 1, 2];
        var pos = positionMap[i] !== undefined ? positionMap[i] : i;
        var prod = {id:id,src:src,ratio:item.ratio||1,name:item.name,sizeScale:sizeScale,position:pos,zOrder:i};
        if(item.baseSrc) prod.baseSrc = item.baseSrc;
        if(item.meta) prod.meta = JSON.parse(JSON.stringify(item.meta));
        window._bnProducts.push(prod);
        broadcast({type:'bn-product-add',id:id,src:src,ratio:item.ratio||1,name:item.name,index:i,sizeScale:sizeScale,position:pos,layoutById:item.layouts||null,layout:item.layout||null});
        await new Promise(function(r){setTimeout(r,50);});
      }
      renderProdList();
      markStateDirty();
    }

    /* 大中小位置標籤 */
    var POS_LABELS = ['主品（中）', '左配品', '右配品'];
    var POS_COLORS = ['#4a90e2', '#687090', '#687090'];

    function renderProdList(){
      var list=document.getElementById('bn-prod-list');
      if(!list)return;
      list.innerHTML='';
      /* 依 position 排序顯示：主品第一 */
      var sorted = window._bnProducts.slice().sort(function(a,b){
        var pa = a.position !== undefined ? a.position : 99;
        var pb = b.position !== undefined ? b.position : 99;
        return pa - pb;
      });
      /* 初始化 zOrder（若未設定，依目前 sorted 順序） */
      sorted.forEach(function(p, i){
        if(p.zOrder === undefined) p.zOrder = i;
      });
      /* z-index 排序：zOrder 小的在上面（蓋住其他） */
      var zSorted = window._bnProducts.slice().sort(function(a,b){
        return (a.zOrder||0) - (b.zOrder||0);
      });
      /* 工具列顯示用 zSorted（前面的蓋住後面的） */
      zSorted.forEach(function(p){
        var row=document.createElement('div');row.className='bn-prod-item';
        row.style.flexWrap='wrap';row.style.gap='4px';

        var img=document.createElement('img');img.src=p.src;

        var infoWrap=document.createElement('div');
        infoWrap.style.cssText='flex:1;display:flex;flex-direction:column;gap:2px;min-width:0;';

        var name=document.createElement('span');
        name.textContent=p.name;
        name.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;';

        var posLabel=document.createElement('span');
        var posIdx = p.position !== undefined ? p.position : 0;
        posLabel.textContent = POS_LABELS[posIdx] || '';
        posLabel.style.cssText='font-size:9px;font-weight:700;color:'+( POS_COLORS[posIdx]||'#687090')+';';

        infoWrap.appendChild(name);
        infoWrap.appendChild(posLabel);

        var editBtn=document.createElement('button');editBtn.textContent='編輯';
        editBtn.title='裁切・去背・擦除・影子';
        editBtn.addEventListener('click',(function(pid){return function(){
          openProductEditor(pid);
        };})(p.id));

        var rmBtn=document.createElement('button');rmBtn.textContent='移除';rmBtn.className='rm';
        rmBtn.addEventListener('click',function(){
          window._bnProducts=window._bnProducts.filter(function(x){return x.id!==p.id;});
          renderProdList();broadcast({type:'bn-product-remove',id:p.id});markStateDirty();
        });

        /* 上移/下移：調整 position 值 */
        var moveWrap=document.createElement('div');moveWrap.className='bn-prod-move';

        var upBtn=document.createElement('button');upBtn.textContent='▲';upBtn.title='往前';
        var downBtn=document.createElement('button');downBtn.textContent='▼';downBtn.title='往後';

        /* 依目前 sorted 裡的順序決定能否移動 */
        var sortedIdx = zSorted.indexOf(p);
        upBtn.disabled   = sortedIdx === 0;
        downBtn.disabled = sortedIdx === zSorted.length - 1;
        upBtn.style.opacity   = upBtn.disabled   ? '0.3' : '1';
        downBtn.style.opacity = downBtn.disabled ? '0.3' : '1';

        upBtn.addEventListener('click',(function(pid, si){ return function(){
          /* 往上 = z-index 升高（蓋在前面） */
          var a = window._bnProducts.find(function(x){return x.id===pid;});
          var b = zSorted[si-1];
          if(!a||!b) return;
          var tmp = a.zOrder; a.zOrder = b.zOrder; b.zOrder = tmp;
          renderProdList();
          broadcastZOrder();
          markStateDirty();
        };})(p.id, sortedIdx));

        downBtn.addEventListener('click',(function(pid, si){ return function(){
          /* 往下 = z-index 降低（被蓋在後面） */
          var a = window._bnProducts.find(function(x){return x.id===pid;});
          var b = zSorted[si+1];
          if(!a||!b) return;
          var tmp = a.zOrder; a.zOrder = b.zOrder; b.zOrder = tmp;
          renderProdList();
          broadcastZOrder();
          markStateDirty();
        };})(p.id, sortedIdx));

        moveWrap.appendChild(upBtn);
        moveWrap.appendChild(downBtn);

        row.appendChild(img);row.appendChild(infoWrap);row.appendChild(moveWrap);row.appendChild(editBtn);row.appendChild(rmBtn);
        list.appendChild(row);
      });
    }


    /* 廣播 z-index 更新 */
    function broadcastZOrder(){
      /* zOrder：依工具列順序，index 0 = 最上層（z-index 最高） */
      var order = window._bnProducts.slice().sort(function(a,b){
        return (a.zOrder||0) - (b.zOrder||0);
      }).map(function(p){ return p.id; });
      broadcast({type:'bn-product-zorder', order: order});
    }
    /* 開啟 editor-plugin 編輯器（裁切/去背/擦除/影子） */
    function openProductEditor(pid){
      var p=window._bnProducts.find(function(x){return x.id===pid;});
      if(!p)return;

      /* 確保 editor-plugin.js 已載入 */
      if(!window.HBNProductEditorPlugin){
        var s=document.createElement('script');
        s.src='js/editor-plugin.js';
        s.onload=function(){ doOpenEditor(pid); };
        document.head.appendChild(s);
        return;
      }
      doOpenEditor(pid);
    }

    function doOpenEditor(pid){
      if(!window.HBNProductEditorPlugin){ alert('editor-plugin.js 未載入'); return; }
      var p=window._bnProducts.find(function(x){return x.id===pid;});
      if(!p)return;

      /* 建一個暫存的 .editor-item 結構讓 plugin 使用 */
      var wrap=document.getElementById('bn-edit-wrap');
      if(!wrap){
        wrap=document.createElement('div');
        wrap.id='bn-edit-wrap';
        wrap.style.cssText='position:fixed;left:-9999px;top:-9999px;width:400px;height:400px;';
        document.body.appendChild(wrap);
      }
      wrap.innerHTML='';
      var box=document.createElement('div');
      box.className='editor-item';
      var editMeta = p.meta || {};
      var shadowMeta = editMeta.shadow || null;
      var baseSrc = p.baseSrc || editMeta.baseSrc || p.src;
      box.dataset.baseSrc = baseSrc;
      if(shadowMeta && shadowMeta.enabled){
        box.dataset.shadowEnabled = '1';
        box.dataset.pluginShadowX = String(shadowMeta.x || 0);
        box.dataset.pluginShadowY = String(shadowMeta.y || 0);
        box.dataset.pluginShadowW = String(shadowMeta.w || 0);
        box.dataset.pluginShadowH = String(shadowMeta.h || 0);
      }
      box.style.cssText='position:relative;width:400px;height:400px;';
      var img=document.createElement('img');
      img.src=p.src;
      img.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';
      box.appendChild(img);
      wrap.appendChild(box);

      /* 覆寫 imgRef.src 後同步回 _bnProducts 和 iframe */
      var origOnload=img.onload;
      var observer=new MutationObserver(function(){
        if(img.src && img.src!==p.src && img.src.startsWith('data:')){
          observer.disconnect();
          /* 更新狀態 */
          p.src=img.src;
          p.baseSrc = (box.dataset && box.dataset.baseSrc) ? box.dataset.baseSrc : p.src;
          p.meta = p.meta || {};
          p.meta.baseSrc = p.baseSrc;
          p.meta.productOnlyRatio = box.dataset && box.dataset.productOnlyRatio ? parseFloat(box.dataset.productOnlyRatio) : undefined;
          if(box.dataset && box.dataset.shadowEnabled === '1'){
            p.meta.shadow = {
              enabled:true,
              x:parseFloat(box.dataset.pluginShadowX || '0'),
              y:parseFloat(box.dataset.pluginShadowY || '0'),
              w:parseFloat(box.dataset.pluginShadowW || '0'),
              h:parseFloat(box.dataset.pluginShadowH || '0')
            };
          } else {
            p.meta.shadow = {enabled:false};
          }
          var editedRatio = box.dataset && box.dataset.outputRatio ? parseFloat(box.dataset.outputRatio) : NaN;
          if(isFinite(editedRatio) && editedRatio > 0){
            p.ratio = editedRatio;
          } else if(img.naturalWidth && img.naturalHeight){
            p.ratio = img.naturalWidth / img.naturalHeight;
          }
          if(p.layout){ delete p.layout; }
          if(p.layouts){ delete p.layouts; }
          p.width = p.height = p.x = p.y = undefined;
          markStateDirty();
          /* 更新左側預覽縮圖 */
          var listImg=document.querySelector('#bn-prod-list .bn-prod-item img[src]');
          document.querySelectorAll('#bn-prod-list .bn-prod-item').forEach(function(row){
            var rowImg=row.querySelector('img');
            /* 找對應的 product */
          });
          renderProdList();
          /* 廣播更新 */
          broadcast({type:'bn-product-remove',id:p.id});
          setTimeout(function(){
            var idx = window._bnProducts.indexOf(p);
            broadcast({type:'bn-product-add',id:p.id,src:p.src,ratio:p.ratio,name:p.name,index:idx,sizeScale:p.sizeScale||1,position:p.position||0,layoutById:p.layouts||null,layout:p.layout||null});
          },50);
        }
      });
      observer.observe(img,{attributes:true,attributeFilter:['src']});

      window.HBNProductEditorPlugin.open(img);
    }

    /* ══ 下載 ══ */
    function insertDownloadBar(){
      var sidebar=document.getElementById('sidebar');
      if(!sidebar||document.getElementById('bn-download-bar'))return;
      var bar=document.createElement('div');bar.id='bn-download-bar';
      bar.innerHTML='<button class="bn-dl-btn" id="bn-dl-all">⬇ 下載全部勾選畫版</button><div class="bn-dl-progress" id="bn-dl-progress"></div>';
      /* 加到 sidebar 最底部（sidebar-scroll 下方）*/
      var scroll=document.getElementById('sidebar-scroll');
      if(scroll && scroll.nextSibling) sidebar.insertBefore(bar, scroll.nextSibling);
      else sidebar.appendChild(bar);
      document.getElementById('bn-dl-all').addEventListener('click',downloadAll);
    }

    function _bnClone(obj){
      try { return JSON.parse(JSON.stringify(obj)); }
      catch(_) { return obj; }
    }

    function _bnIsUsableColor(v){
      return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim());
    }

    var BN_DEFAULT_CANVAS_BG = '#6bc0ec';
    function _bnIsDefaultCanvasBg(v){ return _bnIsUsableColor(v) && String(v).toLowerCase() === BN_DEFAULT_CANVAS_BG; }
    function _bnIsUserCanvasBg(v){ return _bnIsUsableColor(v) && (window._bnUserCanvasBgLocked || !_bnIsDefaultCanvasBg(v)); }

    function _bnGetAuthoritativeCanvasBg(){
      /* 關鍵：多圖 ZIP 前，以父層 colorState 的目前值為最高優先。
         舊版會先吃 _bnCanvasBgHardLock/_bnPersistentCanvasBg；若它們仍是初始化預設藍，
         就會把使用者吸色後的背景覆蓋回藍色。 */
      if(window.colorState && _bnIsUserCanvasBg(window.colorState.canvasBg)) return window.colorState.canvasBg;
      if(_bnIsUserCanvasBg(window._bnCanvasBgHardLock)) return window._bnCanvasBgHardLock;
      if(_bnIsUserCanvasBg(window._bnPersistentCanvasBg)) return window._bnPersistentCanvasBg;
      if(window._bnLastUserColorState && _bnIsUserCanvasBg(window._bnLastUserColorState.canvasBg)) return window._bnLastUserColorState.canvasBg;
      if(window.colorState && _bnIsUsableColor(window.colorState.canvasBg)) return window.colorState.canvasBg;
      return null;
    }

    function _bnLockCanvasBg(hex){
      if(!_bnIsUsableColor(hex)) return;
      window._bnCanvasBgHardLock = hex;
      window._bnPersistentCanvasBg = hex;
      window._bnUserCanvasBgLocked = true;
      window._bnBgColorExportGuardUntil = Date.now() + 30000;
      if(window.colorState) window.colorState.canvasBg = hex;
      if(window._bnLastUserColorState) window._bnLastUserColorState.canvasBg = hex;
    }

    function _bnRgbToHex(rgb){
      if(!rgb || rgb === 'transparent') return null;
      var m = String(rgb).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
      if(!m) return null;
      if(m[4] !== undefined && parseFloat(m[4]) === 0) return null;
      function h(n){ n=Math.max(0,Math.min(255,parseInt(n,10)||0)); return n.toString(16).padStart(2,'0'); }
      return '#'+h(m[1])+h(m[2])+h(m[3]);
    }

    function _bnGetLiveCanvasBgColor(){
      var found = null;
      document.querySelectorAll('.preview-block iframe').forEach(function(ifr){
        if(found) return;
        try{
          var doc = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
          if(!doc) return;
          var candidates = [
            doc.querySelector('.背景色'),
            doc.querySelector('.bg'),
            doc.getElementById('canvas'),
            doc.body
          ];
          candidates.forEach(function(el){
            if(found || !el) return;
            var cs = doc.defaultView.getComputedStyle(el);
            var hex = _bnRgbToHex(cs.backgroundColor);
            if(hex) found = hex;
          });
        }catch(_){ }
      });
      return found;
    }

    function _bnBuildExportColorData(){
      var data = (typeof window.getColorData === 'function')
        ? window.getColorData()
        : (window.colorState ? _bnClone(window.colorState) : null);
      data = data ? _bnClone(data) : {};

      /* 多張 ZIP 匯出時，iframe 可能還沒同步完而回報預設藍。
         因此背景色一律以父層最後一次使用者設定值為最高優先，
         不再讓 iframe 的 live background 反向覆蓋父層狀態。 */
      var authoritativeBg = _bnGetAuthoritativeCanvasBg();
      if(_bnIsUsableColor(authoritativeBg)) data.canvasBg = authoritativeBg;
      else {
        var liveBg = _bnGetLiveCanvasBgColor();
        if(_bnIsUsableColor(liveBg)) data.canvasBg = liveBg;
      }
      return data;
    }

    function _bnFreezeExportColors(colorData){
      if(!colorData) return;
      var frozen = _bnClone(colorData);
      if(_bnIsUsableColor(frozen.canvasBg)) _bnLockCanvasBg(frozen.canvasBg);
      window._bnFrozenColorData = frozen;
      window._bnLastUserColorState = _bnClone(frozen);
      window._bnBgColorExportGuardUntil = Date.now() + 30000;
      if(window.colorState){ try{ Object.assign(window.colorState, frozen); }catch(_){} }
      if(_bnIsUsableColor(window._bnCanvasBgHardLock) && window.colorState) window.colorState.canvasBg = window._bnCanvasBgHardLock;
      if(typeof window.renderColorPickers === 'function') window.renderColorPickers();
      if(typeof window.broadcastColors === 'function') window.broadcastColors();
    }

    function downloadAll(){
      /* 多圖恢復 ZIP：1 張直接 PNG；2 張以上先逐張截圖，最後打包 ZIP。 */
      var iframes=Array.from(document.querySelectorAll('.preview-block iframe'));
      if(!iframes.length){setProgress('沒有版位可下載');return;}

      var btn=document.getElementById('bn-dl-all');
      btn.disabled=true;

      var total=iframes.length;
      var done=0, ok=0, fail=0;
      var files=[];
      window._bnExporting = true;
      window._bnSuppressProductLayoutWrite = true;
      var _exportUnlockTimer = null;

      /* 下載前先凍結父層目前狀態，避免截圖期間 iframe 收到舊的 ready/autoload
         或重繪訊息，造成背景色/文字色被還原成預設值。 */
      var exportTextData = (typeof window.getTextData === 'function') ? window.getTextData() : null;
      var exportColorData = _bnBuildExportColorData();
      _bnFreezeExportColors(exportColorData);
      var exportLogos = window._bnLogos ? JSON.parse(JSON.stringify(window._bnLogos)) : [];
      var exportProducts = window._bnProducts ? JSON.parse(JSON.stringify(window._bnProducts)) : [];
      var exportZOrder = exportProducts.slice().sort(function(a,b){ return (a.zOrder||0)-(b.zOrder||0); }).map(function(p){ return p.id; });

      setProgress(total===1 ? '準備下載 1 個版位…' : '準備打包 '+total+' 個版位…');

      function sendToIframe(iframeEl, msg){
        try{ iframeEl && iframeEl.contentWindow && iframeEl.contentWindow.postMessage(msg, '*'); }catch(_){ }
      }

      function syncIframeForExport(iframeEl, cb){
        if(!iframeEl){ cb && cb(); return; }
        var id = getIfrBnidForExport(iframeEl);
        if(exportTextData) sendToIframe(iframeEl, {type:'bn-text', data:exportTextData});
        if(exportColorData) sendToIframe(iframeEl, {type:'bn-color', data:(window._bnFrozenColorData || exportColorData)});
        if(exportLogos && exportLogos.length) sendToIframe(iframeEl, {type:'bn-logos', logos:exportLogos});

        exportProducts.forEach(function(p, idx){
          sendToIframe(iframeEl, {
            type:'bn-product-add', id:p.id, src:p.src, ratio:p.ratio, name:p.name,
            index:idx, sizeScale:p.sizeScale||1, position:p.position||0, zOrder:p.zOrder||0,
            layoutById:p.layouts||null, layout:p.layout||null
          });
        });
        if(exportZOrder.length) sendToIframe(iframeEl, {type:'bn-product-zorder', order:exportZOrder});

        /* 背景圖精準同步到目標 iframe。不要用全域刷新，避免下載某一張時
           把其他尚未 ready 的 iframe 背景/底色送成空值。 */
        if(typeof window._bnSendBgToIframe === 'function' && id){
          window._bnSendBgToIframe(iframeEl, id);
        } else if(typeof window._bnRefreshCanvasBackgrounds === 'function') {
          window._bnRefreshCanvasBackgrounds();
        }

        /* 給 iframe 一點時間套用 style / 圖片 / 背景後再截圖。 */
        setTimeout(function(){ cb && cb(); }, 260);
      }

      function resyncAllAfterExport(){
        document.querySelectorAll('.preview-block iframe').forEach(function(iframeEl){
          var id = getIfrBnidForExport(iframeEl);
          if(exportTextData) sendToIframe(iframeEl, {type:'bn-text', data:exportTextData});
          if(exportColorData) sendToIframe(iframeEl, {type:'bn-color', data:(window._bnFrozenColorData || exportColorData)});
          if(exportLogos && exportLogos.length) sendToIframe(iframeEl, {type:'bn-logos', logos:exportLogos});
          if(typeof window._bnSendBgToIframe === 'function' && id) window._bnSendBgToIframe(iframeEl, id);
        });
      }

      function getIfrBnidForExport(ifrEl){
        try{
          var qs = (ifrEl.src||'').split('?')[1]||'';
          var id = new URLSearchParams(qs).get('bnid');
          if(id) return String(id);
        }catch(_){ }
        return null;
      }

      function safeName(name){
        return String(name||'layout').trim().replace(/[\/\\:*?"<>|]/g,'_') || 'layout';
      }

      function loadJSZip(cb){
        if(window.JSZip){ cb(); return; }

        var existed=document.querySelector('script[data-bn-jszip="1"]');
        if(existed){
          existed.addEventListener('load', cb, {once:true});
          existed.addEventListener('error', function(){ cb(new Error('JSZip 載入失敗')); }, {once:true});
          return;
        }

        var s=document.createElement('script');
        s.dataset.bnJszip='1';
        s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload=function(){ cb(); };
        s.onerror=function(){ cb(new Error('JSZip 載入失敗')); };
        document.head.appendChild(s);
      }

      function dataUrlToBase64(dataUrl){
        return String(dataUrl||'').split(',')[1] || '';
      }

      function finishExport(){
        /* 匯出完成後用凍結色反覆還原；ZIP 下載會載入 JSZip 並造成部分 iframe/ready 流程重播舊狀態，
           這裡保護 15 秒，避免背景色被預設藍覆蓋。 */
        var safeColorData = window._bnFrozenColorData || exportColorData;
        function restoreExportColors(){
          if(safeColorData && window.colorState){
            try{ Object.assign(window.colorState, safeColorData); }catch(_){}
            if(_bnIsUsableColor(window._bnCanvasBgHardLock)) window.colorState.canvasBg = window._bnCanvasBgHardLock;
            else if(_bnIsUsableColor(safeColorData.canvasBg)) _bnLockCanvasBg(safeColorData.canvasBg);
            window._bnLastUserColorState = _bnClone(window.colorState);
            window._bnPersistentCanvasBg = window.colorState.canvasBg;
            window._bnBgColorExportGuardUntil = Date.now() + 30000;
            if(typeof window.renderColorPickers === 'function') window.renderColorPickers();
            if(typeof window.broadcastColors === 'function') window.broadcastColors();
          }
          resyncAllAfterExport();
        }
        restoreExportColors();
        [150, 500, 1200, 2500, 5000].forEach(function(delay){ setTimeout(restoreExportColors, delay); });
        clearTimeout(_exportUnlockTimer);
        _exportUnlockTimer = setTimeout(function(){
          window._bnExporting = false;
          window._bnSuppressProductLayoutWrite = false;
          try{ document.dispatchEvent(new CustomEvent('bn-state-dirty')); }catch(_){ }
          setTimeout(function(){
            delete window._bnFrozenColorData;
            try{ if(window._bnStatePlugin && typeof window._bnStatePlugin.save === 'function') window._bnStatePlugin.save(); }catch(_){ }
          }, 6000);
        }, 1500);
      }

      function makeZip(){
        if(total===1){
          btn.disabled=false;
          finishExport();
          if(ok){ setTimeout(function(){setProgress('');},2500); }
          else { setProgress('下載失敗：截圖逾時或回傳空白'); }
          return;
        }

        if(!files.length){
          btn.disabled=false;
          finishExport();
          setProgress('ZIP 未產生：全部截圖都失敗或逾時');
          return;
        }

        setProgress('正在產生 ZIP（成功 '+ok+'，失敗 '+fail+'）…');

        loadJSZip(function(err){
          if(err || !window.JSZip){
            btn.disabled=false;
            finishExport();
            setProgress('ZIP 失敗：JSZip 載入失敗');
            return;
          }

          try{
            var zip=new JSZip();
            files.forEach(function(f){
              zip.file(f.name, dataUrlToBase64(f.dataUrl), {base64:true});
            });
            zip.generateAsync({type:'blob'}).then(function(blob){
              triggerBlobDownload(blob,'BN_Export.zip');
              btn.disabled=false;
              finishExport();
              setProgress('ZIP下載完成：成功 '+ok+' / '+total+(fail ? '，失敗 '+fail+' 個已跳過' : '')); 
            }).catch(function(){
              btn.disabled=false;
              finishExport();
              setProgress('ZIP 產生失敗');
            });
          }catch(e){
            btn.disabled=false;
            finishExport();
            setProgress('ZIP 產生失敗：'+e.message);
          }
        });
      }

      function captureOne(iframeEl, fileName, cb){
        var msgId='dl_'+Date.now()+'_'+Math.random().toString(36).slice(2);
        var settled=false;
        var timer;

        function settle(dataUrl){
          if(settled) return;
          settled=true;
          clearTimeout(timer);
          window.removeEventListener('message',onMsg);
          cb(dataUrl||null);
        }

        function onMsg(e){
          if(!e.data || e.data.type!=='bn-snapshot' || e.data.msgId!==msgId) return;
          settle(e.data.dataUrl || null);
        }

        window.addEventListener('message',onMsg);

        try{
          iframeEl.contentWindow.postMessage({type:'bn-capture',msgId:msgId},'*');
        }catch(e){
          settle(null);
          return;
        }

        /* 單一版位最多等 12 秒；失敗就跳過，整包繼續 */
        timer=setTimeout(function(){ settle(null); },12000);
      }

      function next(idx){
        if(idx>=total){
          makeZip();
          return;
        }

        var iframe=iframes[idx];
        var blockEl=iframe.closest('.preview-block');
        var baseName=safeName(blockEl ? ((blockEl.querySelector('.pname')||{}).textContent||'layout') : 'layout');

        syncIframeForExport(iframe, function(){
          captureOne(iframe, baseName+'.png', function(dataUrl){
            done++;

            if(dataUrl){
              ok++;
              if(total===1){
                triggerDownload(dataUrl, baseName+'.png');
              }else{
                files.push({name:baseName+'.png', dataUrl:dataUrl});
              }
            }else{
              fail++;
            }

            if(total===1){
              setProgress(dataUrl ? '已下載 1 / 1' : '下載失敗：截圖逾時或回傳空白');
            }else{
              setProgress('打包中 '+done+' / '+total+'（成功 '+ok+'，失敗 '+fail+'）');
            }

            /* 稍微讓瀏覽器釋放資源，避免連續截圖卡住 */
            setTimeout(function(){ next(idx+1); },250);
          });
        });
      }

      next(0);
    }
    function setProgress(msg){var el=document.getElementById('bn-dl-progress');if(el)el.textContent=msg;}
    function triggerDownload(dataUrl,filename){var a=document.createElement('a');a.href=dataUrl;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},1000);}
    function triggerBlobDownload(blob,filename){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},2000);}

    /* ── iframe ready 推送 ── */
    var origOnReady=window._bnOnIframeReady;
    window._bnOnIframeReady=function(id){
      if(origOnReady)origOnReady(id);
      setTimeout(function(){
        if(window._bnLogos&&window._bnLogos.length){
          broadcastTo(id,{type:'bn-logos',logos:window._bnLogos});
        } else if(window._bnLogoDataUrl){
          broadcastTo(id,{type:'bn-logo',dataUrl:window._bnLogoDataUrl});
        }
        /* 先送 product-add，再送 zorder */
        window._bnProducts.forEach(function(p,idx){broadcastTo(id,{type:'bn-product-add',id:p.id,src:p.src,ratio:p.ratio,name:p.name,index:idx,sizeScale:p.sizeScale,position:p.position||0,zOrder:p.zOrder||0,layoutById:p.layouts||null,layout:p.layout||null});});
        setTimeout(function(){
          var order=window._bnProducts.slice().sort(function(a,b){return (a.zOrder||0)-(b.zOrder||0);}).map(function(p){return p.id;});
          broadcastTo(id,{type:'bn-product-zorder',order:order});
        },100);
      },200);
    };

    /* ── init ── */
    function init(){
      if(document.getElementById('sidebar-scroll')){insertLogoUI();insertProductUI();insertDownloadBar();}
      else setTimeout(init,200);
    }
    init();

    /* 暴露給 bn-state-plugin 使用 */
    window._bnRenderLogoList = function(){ renderLogoList(); };
    window._bnBroadcastLogos = function(){
      if(window._bnLogos && window._bnLogos.length){
        broadcast({type:'bn-logos', logos:window._bnLogos});
      }
    };
    window._bnRenderProdList = function(){ renderProdList(); };
    window._bnRequestProductLayouts = requestProductLayouts;
    window._bnRebroadcastProducts = function(){
      var ids = (window._bnProducts||[]).map(function(p){ return p.id; });
      ids.forEach(function(id){ broadcast({type:'bn-product-remove', id:id}); });
      var reordered = (window._bnProducts||[]).slice().sort(function(a,b){
        return (a.position||0)-(b.position||0);
      });
      setTimeout(function(){
        reordered.forEach(function(p, idx){
          broadcast({type:'bn-product-add', id:p.id, src:p.src, ratio:p.ratio,
            name:p.name, index:idx, sizeScale:p.sizeScale||1,
            position:p.position||0, zOrder:p.zOrder||0, layoutById:p.layouts||null, layout:p.layout||null});
        });
        /* z-index */
        var order = (window._bnProducts||[]).slice().sort(function(a,b){
          return (a.zOrder||0)-(b.zOrder||0);
        }).map(function(p){ return p.id; });
        setTimeout(function(){ broadcast({type:'bn-product-zorder', order:order}); }, 100);
      }, 60);
    };
  });
})();
