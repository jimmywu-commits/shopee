(function(){
  'use strict';

  var CFG = window.BN_FEEDBACK_CONFIG || {};
  var DRAFT_KEY = 'bn_feedback_draft_v1';
  var DB_NAME = 'bn_feedback_local_v1';
  var DB_STORE = 'feedback';
  var dbPromise = null;

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function uid(){ return 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9); }
  function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise(function(resolve,reject){
      if(!window.indexedDB){ reject(new Error('此瀏覽器不支援 IndexedDB')); return; }
      var req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=function(){
        var db=req.result;
        if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE,{keyPath:'id'});
      };
      req.onsuccess=function(){resolve(req.result);};
      req.onerror=function(){reject(req.error);};
    });
    return dbPromise;
  }
  function idbPut(row){ return openDb().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(row);tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};});}); }
  function idbAll(){ return openDb().then(function(db){return new Promise(function(resolve,reject){var req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).getAll();req.onsuccess=function(){resolve(req.result||[]);};req.onerror=function(){reject(req.error);};});}); }
  function idbDelete(id){ return openDb().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};});}); }

  function loadScript(src){
    return new Promise(function(resolve,reject){
      var found=[].slice.call(document.scripts).some(function(s){return s.src===src;});
      if(found){resolve();return;}
      var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=function(){reject(new Error('無法載入 Firebase'));};document.head.appendChild(s);
    });
  }
  function hasCloud(){ return !!(CFG.firebaseConfig && CFG.firebaseConfig.apiKey && CFG.firebaseConfig.projectId); }
  var cloudPromise=null;
  function initCloud(){
    if(!hasCloud()) return Promise.resolve(null);
    if(cloudPromise) return cloudPromise;
    cloudPromise=Promise.all([
      loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js')
    ]).then(function(){
      var app=firebase.apps.length?firebase.app():firebase.initializeApp(CFG.firebaseConfig);
      return firebase.auth().signInAnonymously().catch(function(){return null;}).then(function(){return app;});
    });
    return cloudPromise;
  }
  function fileToLocal(file){
    return new Promise(function(resolve,reject){
      if(!file){resolve(null);return;}
      var r=new FileReader();r.onload=function(){resolve({name:file.name,type:file.type,size:file.size,dataUrl:r.result});};r.onerror=function(){reject(r.error);};r.readAsDataURL(file);
    });
  }
  function submitCloud(row,file){
    return initCloud().then(function(app){
      if(!app) throw new Error('未設定 Firebase');
      var db=firebase.firestore();
      var storage=firebase.storage();
      var base={
        id:row.id,name:row.name,company:row.company,email:row.email,summary:row.summary,
        fixed:false,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
        attachment:null,userAgent:navigator.userAgent,pageUrl:location.href
      };
      if(!file) return db.collection(CFG.collectionName||'bn_feedback').doc(row.id).set(base).then(function(){return row.id;});
      var safe=(file.name||'attachment').replace(/[\\/:*?"<>|]/g,'_');
      var ref=storage.ref((CFG.storageFolder||'bn_feedback_attachments')+'/'+row.id+'/'+safe);
      return ref.put(file).then(function(snap){return snap.ref.getDownloadURL();}).then(function(url){
        base.attachment={name:file.name,type:file.type,size:file.size,url:url};
        return db.collection(CFG.collectionName||'bn_feedback').doc(row.id).set(base);
      }).then(function(){return row.id;});
    });
  }

  function injectCss(){
    if(document.getElementById('bn-feedback-style')) return;
    var s=document.createElement('style');s.id='bn-feedback-style';s.textContent=[
      '#bn-feedback-modal{display:none;position:fixed;inset:0;z-index:100010;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:20px}',
      '#bn-feedback-modal.show{display:flex}',
      '.bn-feedback-card{width:min(620px,94vw);max-height:92vh;overflow:auto;background:#161b22;border:1px solid #30363d;border-radius:14px;box-shadow:0 22px 70px rgba(0,0,0,.55);color:#e6edf3}',
      '.bn-feedback-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #30363d}',
      '.bn-feedback-head h2{font-size:18px;margin:0}.bn-feedback-close{border:0;background:transparent;color:#aab4c3;font-size:26px;cursor:pointer}',
      '.bn-feedback-body{padding:18px 20px}.bn-feedback-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
      '.bn-feedback-field{display:flex;flex-direction:column;gap:6px}.bn-feedback-field.full{grid-column:1/-1}',
      '.bn-feedback-field label{font-size:12px;color:#9da7b5;font-weight:700}',
      '.bn-feedback-field input,.bn-feedback-field textarea{box-sizing:border-box;width:100%;border:1px solid #3a4350;border-radius:8px;background:#0d1117;color:#e6edf3;padding:10px 12px;font:inherit;outline:none}',
      '.bn-feedback-field textarea{min-height:150px;resize:vertical}.bn-feedback-field input:focus,.bn-feedback-field textarea:focus{border-color:#ff6b35}',
      '.bn-feedback-file{border:1px dashed #495363;border-radius:9px;padding:12px;background:#111720}',
      '.bn-feedback-note{font-size:12px;color:#8b98a8;margin-top:7px;line-height:1.5}',
      '.bn-feedback-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:15px 20px;border-top:1px solid #30363d}',
      '.bn-feedback-actions button{border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer}',
      '.bn-feedback-cancel{background:#21262d;color:#d9e0ea;border:1px solid #3a4350}.bn-feedback-submit{background:#ee4d2d;color:#fff;border:1px solid #ee4d2d}',
      '.bn-feedback-submit:disabled{opacity:.55;cursor:wait}.bn-feedback-status{margin-right:auto;font-size:12px;color:#9da7b5}',
      '@media(max-width:620px){.bn-feedback-grid{grid-template-columns:1fr}.bn-feedback-field.full{grid-column:auto}}'
    ].join('');document.head.appendChild(s);
  }
  function buildModal(){
    injectCss();
    if(document.getElementById('bn-feedback-modal')) return document.getElementById('bn-feedback-modal');
    var modal=document.createElement('div');modal.id='bn-feedback-modal';modal.innerHTML='\
      <div class="bn-feedback-card" role="dialog" aria-modal="true" aria-labelledby="bn-feedback-title">\
        <div class="bn-feedback-head"><h2 id="bn-feedback-title">使用反饋</h2><button class="bn-feedback-close" type="button" aria-label="關閉">×</button></div>\
        <form id="bn-feedback-form">\
          <div class="bn-feedback-body"><div class="bn-feedback-grid">\
            <div class="bn-feedback-field"><label for="bn-fb-name">姓名 *</label><input id="bn-fb-name" name="name" required maxlength="80"></div>\
            <div class="bn-feedback-field"><label for="bn-fb-company">公司名</label><input id="bn-fb-company" name="company" maxlength="120"></div>\
            <div class="bn-feedback-field full"><label for="bn-fb-email">郵件 *</label><input id="bn-fb-email" name="email" type="email" required maxlength="160"></div>\
            <div class="bn-feedback-field full"><label for="bn-fb-summary">簡述 *</label><textarea id="bn-fb-summary" name="summary" required maxlength="5000" placeholder="請描述遇到的問題、操作步驟與預期結果"></textarea></div>\
            <div class="bn-feedback-field full"><label for="bn-fb-file">上傳附件</label><div class="bn-feedback-file"><input id="bn-fb-file" name="attachment" type="file" accept="image/*,.pdf,.zip,.json,.txt"><div class="bn-feedback-note">單一附件上限 '+Math.round((CFG.maxAttachmentBytes||10485760)/1048576)+' MB。文字欄位與附件會保留在這台電腦，關閉視窗後再開仍可繼續編輯。</div></div></div>\
          </div></div>\
          <div class="bn-feedback-actions"><span class="bn-feedback-status" aria-live="polite"></span><button class="bn-feedback-cancel" type="button">取消</button><button class="bn-feedback-submit" type="submit">送出反饋</button></div>\
        </form>\
      </div>';
    document.body.appendChild(modal);return modal;
  }
  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch(_){return {};}}
  function saveDraft(form){
    var d={name:form.name.value,company:form.company.value,email:form.email.value,summary:form.summary.value,updatedAt:Date.now()};
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d));}catch(_){}
  }
  function clearDraft(){try{localStorage.removeItem(DRAFT_KEY);}catch(_){} }
  function init(){
    var btn=document.getElementById('feedback-btn');if(!btn)return;
    var modal=buildModal(),form=modal.querySelector('#bn-feedback-form'),status=modal.querySelector('.bn-feedback-status'),submit=modal.querySelector('.bn-feedback-submit');
    var draft=readDraft();['name','company','email','summary'].forEach(function(k){if(draft[k]) form[k].value=draft[k];});
    var t=null;form.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){saveDraft(form);status.textContent='已暫存';setTimeout(function(){if(status.textContent==='已暫存')status.textContent='';},1000);},180);});
    function close(){saveDraft(form);modal.classList.remove('show');}
    btn.onclick=function(){modal.classList.add('show');setTimeout(function(){form.name.focus();},30);};
    modal.querySelector('.bn-feedback-close').onclick=close;modal.querySelector('.bn-feedback-cancel').onclick=close;
    modal.addEventListener('click',function(e){if(e.target===modal)close();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('show'))close();});
    form.addEventListener('submit',function(e){
      e.preventDefault();if(!form.reportValidity())return;
      var file=form.attachment.files[0]||null,max=CFG.maxAttachmentBytes||10485760;
      if(file&&file.size>max){status.textContent='附件超過 '+Math.round(max/1048576)+' MB';return;}
      submit.disabled=true;status.textContent='送出中…';
      var row={id:uid(),name:form.name.value.trim(),company:form.company.value.trim(),email:form.email.value.trim(),summary:form.summary.value.trim(),fixed:false,createdAt:Date.now(),updatedAt:Date.now(),syncStatus:hasCloud()?'pending':'local'};
      var task=hasCloud()?submitCloud(row,file).then(function(){row.syncStatus='synced';return fileToLocal(file);}):fileToLocal(file);
      task.then(function(localAttachment){row.attachment=localAttachment;return idbPut(row);}).then(function(){
        clearDraft();form.reset();status.textContent=hasCloud()?'已成功送出，謝謝你的反饋！':'已儲存在本機。完成 Firebase 設定後才會傳到管理者。';
        setTimeout(function(){modal.classList.remove('show');status.textContent='';},hasCloud()?1200:2600);
      }).catch(function(err){
        fileToLocal(file).then(function(a){row.attachment=a;row.syncStatus='local';return idbPut(row);}).then(function(){status.textContent='雲端送出失敗，已保存在本機：'+(err&&err.message?err.message:'未知錯誤');});
      }).finally(function(){submit.disabled=false;});
    });
  }
  window.BNFeedbackLocal={all:idbAll,put:idbPut,remove:idbDelete,initCloud:initCloud,hasCloud:hasCloud,config:CFG,escape:esc};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
