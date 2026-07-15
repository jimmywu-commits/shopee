(function(){
'use strict';
var api, rows=[];
function fmt(ts){
  if(!ts)return '-';
  var d=ts.toDate?ts.toDate():new Date(ts.seconds?ts.seconds*1000:ts);
  return d.toLocaleString('zh-TW',{hour12:false});
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fileLink(a){
  if(!a)return '<span class="muted">無</span>';
  var url=a.url||a.dataUrl||'';
  if(!url)return esc(a.name||'附件');
  return '<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(a.name||'查看附件')+'</a>';
}
function render(){
  var q=(document.getElementById('search').value||'').trim().toLowerCase();
  var filter=document.getElementById('filter').value;
  var list=rows.filter(function(r){
    if(filter==='open'&&r.fixed)return false;
    if(filter==='fixed'&&!r.fixed)return false;
    if(!q)return true;
    return [r.name,r.company,r.email,r.summary].join(' ').toLowerCase().indexOf(q)>=0;
  });
  document.getElementById('count').textContent='共 '+list.length+' 筆';
  var body=document.getElementById('tbody');
  body.innerHTML=list.map(function(r){return '<tr class="'+(r.fixed?'is-fixed':'')+'">'
    +'<td><input class="fixed-box" type="checkbox" data-id="'+esc(r.id)+'" '+(r.fixed?'checked':'')+'></td>'
    +'<td>'+esc(fmt(r.createdAt))+'</td>'
    +'<td><strong>'+esc(r.name)+'</strong><div class="muted">'+esc(r.company||'')+'</div></td>'
    +'<td><a href="mailto:'+esc(r.email)+'">'+esc(r.email)+'</a></td>'
    +'<td class="summary">'+esc(r.summary).replace(/\n/g,'<br>')+'</td>'
    +'<td>'+fileLink(r.attachment)+'</td>'
    +'<td><button class="delete-btn" data-id="'+esc(r.id)+'">刪除</button></td>'
    +'</tr>';}).join('')||'<tr><td colspan="7" class="empty">目前沒有反饋資料</td></tr>';
}
function initCloudRows(){
  return api.initCloud().then(function(app){
    if(!app)return Promise.resolve(null);
    var db=firebase.firestore();
    return db.collection(api.config.collectionName||'bn_feedback').orderBy('createdAt','desc').onSnapshot(function(snap){
      rows=snap.docs.map(function(d){var x=d.data();x.id=d.id;return x;});render();
    });
  });
}
function updateFixed(id,fixed){
  var row=rows.find(function(r){return r.id===id;});if(row)row.fixed=fixed;render();
  if(api.hasCloud())return firebase.firestore().collection(api.config.collectionName||'bn_feedback').doc(id).update({fixed:fixed,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  return api.put(row);
}
function removeRow(id){
  if(!confirm('確定刪除這筆反饋？'))return;
  if(api.hasCloud()){
    firebase.firestore().collection(api.config.collectionName||'bn_feedback').doc(id).delete();
  }else{
    api.remove(id).then(function(){rows=rows.filter(function(r){return r.id!==id;});render();});
  }
}
function boot(){
  api=window.BNFeedbackLocal;
  document.getElementById('mode').textContent=api.hasCloud()?'Firebase 雲端模式':'本機測試模式（僅此瀏覽器）';
  document.getElementById('search').addEventListener('input',render);
  document.getElementById('filter').addEventListener('change',render);
  document.getElementById('tbody').addEventListener('change',function(e){if(e.target.classList.contains('fixed-box'))updateFixed(e.target.dataset.id,e.target.checked);});
  document.getElementById('tbody').addEventListener('click',function(e){if(e.target.classList.contains('delete-btn'))removeRow(e.target.dataset.id);});
  api.all().then(function(localRows){rows=(localRows||[]).sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0);});render();});
  if(api.hasCloud())initCloudRows().catch(function(err){document.getElementById('mode').textContent='Firebase 連線失敗：'+err.message;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
