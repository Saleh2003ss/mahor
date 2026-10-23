/* Rooz Planner — offline-first local PWA */
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = n => String(n).replace(/\d/g, d => PERSIAN_DIGITS[+d]);
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d,12); };
const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const weekdays = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const weekShort = ['ش','ی','د','س','چ','پ','ج'];
function gregorianToJalali(gy,gm,gd){
  const gdm=[0,31,((gy%4===0&&gy%100!==0)||gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  let gy2=gy-1600, gm2=gm-1, gd2=gd-1;
  let gdn=365*gy2+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400);
  for(let i=0;i<gm2;i++)gdn+=gdm[i+1]; gdn+=gd2;
  let jdn=gdn-79, jnp=Math.floor(jdn/12053); jdn%=12053;
  let jy=979+33*jnp+4*Math.floor(jdn/1461); jdn%=1461;
  if(jdn>=366){jy+=Math.floor((jdn-1)/365);jdn=(jdn-1)%365;}
  let jm,jd;
  if(jdn<186){jm=1+Math.floor(jdn/31);jd=1+jdn%31;}
  else{jm=7+Math.floor((jdn-186)/30);jd=1+(jdn-186)%30;}
  return [jy,jm,jd];
}
function jalaliToGregorian(jy,jm,jd){
  jy-=979; let jdn=365*jy+Math.floor(jy/33)*8+Math.floor(((jy%33)+3)/4);
  jdn+=(jm<=6?(jm-1)*31:186+(jm-7)*30)+(jd-1)+79;
  let gy=1600+400*Math.floor(jdn/146097); jdn%=146097;
  let leap=true;
  if(jdn>=36525){jdn--;gy+=100*Math.floor(jdn/36524);jdn%=36524;if(jdn>=365)jdn++;}
  gy+=4*Math.floor(jdn/1461);jdn%=1461;
  if(jdn>=366){leap=false;jdn--;gy+=Math.floor(jdn/365);jdn%=365;}
  const md=[0,31,leap?29:28,31,30,31,30,31,31,30,31,30,31];let gm=1;
  while(gm<=12&&jdn>=md[gm]){jdn-=md[gm];gm++;}
  return new Date(gy,gm-1,jdn+1,12);
}
const jalali = date => gregorianToJalali(date.getFullYear(),date.getMonth()+1,date.getDate());
const jalaliString = date => {const [y,m,d]=jalali(date);return `${toFa(d)} ${persianMonths[m-1]} ${toFa(y)}`};
const jalaliKey = date => {const [y,m,d]=jalali(date);return `${y}/${pad(m)}/${pad(d)}`};
const weekdayName = d => weekdays[(d.getDay()+1)%7];
const monthKey = d => {const [y,m]=jalali(d);return `${y}/${pad(m)}`};
const jalaliMonthFirst = (y,m) => jalaliToGregorian(y,m,1);
const dayDiff = (a,b) => Math.round((parseISO(a)-parseISO(b))/86400000);

const EVENTS = {
  // Dates are Jalali unless marked gregorian; annual fixed-date events are kept locally.
  '1/1': [{name:'نوروز',kind:'تعطیل',holiday:true},{name:'آغاز سال نو خورشیدی',kind:'ایرانی'}],
  '1/2': [{name:'عید نوروز',kind:'تعطیل',holiday:true}],
  '1/3': [{name:'عید نوروز',kind:'تعطیل',holiday:true}],
  '1/4': [{name:'عید نوروز',kind:'تعطیل',holiday:true}],
  '1/12': [{name:'روز جمهوری اسلامی ایران',kind:'تعطیل',holiday:true}],
  '1/13': [{name:'روز طبیعت',kind:'تعطیل',holiday:true}],
  '1/25': [{name:'روز بزرگداشت عطار نیشابوری',kind:'ایرانی'}],
  '2/1': [{name:'روز بزرگداشت سعدی',kind:'ایرانی'}],
  '2/10': [{name:'روز ملی خلیج فارس',kind:'ایرانی'}],
  '2/25': [{name:'روز بزرگداشت فردوسی',kind:'ایرانی'}],
  '3/14': [{name:'رحلت امام خمینی (تاریخ شمسی ثابت)',kind:'تعطیل',holiday:true}],
  '3/15': [{name:'قیام ۱۵ خرداد',kind:'تعطیل',holiday:true}],
  '3/20': [{name:'روز جهانی پناهندگان',kind:'جهانی'}],
  '3/30': [{name:'روز جهانی یوگا',kind:'جهانی'}],
  '4/7': [{name:'روز جهانی بوسه',kind:'جهانی'}],
  '4/10': [{name:'روز جهانی جمعیت',kind:'جهانی'}],
  '4/22': [{name:'روز جهانی مغز',kind:'جهانی'}],
  '5/17': [{name:'روز خبرنگار',kind:'ایرانی'}],
  '5/28': [{name:'روز جهانی عکاسی',kind:'جهانی'}],
  '6/1': [{name:'روز بزرگداشت ابوعلی سینا و روز پزشک',kind:'ایرانی'}],
  '6/4': [{name:'روز کارمند',kind:'ایرانی'}],
  '6/5': [{name:'روز بزرگداشت زکریای رازی و روز داروسازی',kind:'ایرانی'}],
  '6/13': [{name:'روز تعاون',kind:'ایرانی'}],
  '6/27': [{name:'روز جهانی گردشگری',kind:'جهانی'}],
  '7/1': [{name:'روز بزرگداشت حافظ',kind:'ایرانی'}],
  '7/13': [{name:'روز نیروی انتظامی',kind:'ایرانی'}],
  '7/20': [{name:'روز بزرگداشت مولوی',kind:'ایرانی'}],
  '8/13': [{name:'روز دانش‌آموز',kind:'ایرانی'}],
  '8/24': [{name:'روز کتاب و کتاب‌خوانی',kind:'ایرانی'}],
  '9/5': [{name:'روز جهانی داوطلب',kind:'جهانی'}],
  '9/16': [{name:'روز دانشجو',kind:'ایرانی'}],
  '10/1': [{name:'شب یلدا',kind:'ایرانی'}],
  '10/5': [{name:'روز ایمنی در برابر زلزله',kind:'ایرانی'}],
  '10/13': [{name:'روز جهانی بریل',kind:'جهانی'}],
  '10/29': [{name:'روز هوای پاک',kind:'ایرانی'}],
  '11/10': [{name:'جشن سده',kind:'ایرانی'}],
  '11/22': [{name:'پیروزی انقلاب اسلامی',kind:'تعطیل',holiday:true}],
  '12/5': [{name:'روز مهندس',kind:'ایرانی'}],
  '12/15': [{name:'روز درختکاری',kind:'ایرانی'}],
  '12/29': [{name:'روز ملی شدن صنعت نفت ایران',kind:'تعطیل',holiday:true}],
};
const GREGORIAN_EVENTS = [
  {m:1,d:1,name:'آغاز سال میلادی',kind:'جهانی',holiday:false},
  {m:2,d:14,name:'روز عشق (ولنتاین)',kind:'جهانی',holiday:false},
  {m:3,d:8,name:'روز جهانی زن',kind:'جهانی',holiday:false},
  {m:3,d:20,name:'روز جهانی شادی',kind:'جهانی',holiday:false},
  {m:3,d:21,name:'روز جهانی نوروز',kind:'جهانی',holiday:false},
  {m:4,d:7,name:'روز جهانی بهداشت',kind:'جهانی',holiday:false},
  {m:4,d:22,name:'روز زمین',kind:'جهانی',holiday:false},
  {m:5,d:1,name:'روز جهانی کارگر',kind:'جهانی',holiday:false},
  {m:5,d:3,name:'روز جهانی آزادی مطبوعات',kind:'جهانی',holiday:false},
  {m:6,d:5,name:'روز جهانی محیط زیست',kind:'جهانی',holiday:false},
  {m:6,d:21,name:'روز جهانی یوگا',kind:'جهانی',holiday:false},
  {m:7,d:30,name:'روز جهانی دوستی',kind:'جهانی',holiday:false},
  {m:8,d:12,name:'روز جهانی جوانان',kind:'جهانی',holiday:false},
  {m:9,d:21,name:'روز جهانی صلح',kind:'جهانی',holiday:false},
  {m:10,d:5,name:'روز جهانی معلم',kind:'جهانی',holiday:false},
  {m:10,d:10,name:'روز جهانی سلامت روان',kind:'جهانی',holiday:false},
  {m:10,d:16,name:'روز جهانی غذا',kind:'جهانی',holiday:false},
  {m:11,d:13,name:'روز جهانی مهربانی',kind:'جهانی',holiday:false},
  {m:12,d:3,name:'روز جهانی افراد دارای معلولیت',kind:'جهانی',holiday:false},
  {m:12,d:10,name:'روز جهانی حقوق بشر',kind:'جهانی',holiday:false},
  {m:12,d:25,name:'کریسمس',kind:'جهانی',holiday:false}
];
function eventsFor(date){
  const [jy,jm,jd]=jalali(date);const arr=[...(EVENTS[`${jm}/${jd}`]||[])];
  GREGORIAN_EVENTS.filter(e=>e.m===date.getMonth()+1&&e.d===date.getDate()).forEach(e=>arr.push({...e}));
  // Date-dependent lunar holidays are intentionally not guessed; authoritative annual data should be supplied for them.
  return arr;
}

const DB_NAME='rooz-planner-db', DB_VERSION=1, STORE='notes';
let db;
function openDB(){return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('IndexedDB در دسترس نیست'));return;}
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE)){const s=d.createObjectStore(STORE,{keyPath:'id'});s.createIndex('date','date',{unique:false});s.createIndex('completed','completed',{unique:false});}};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
function txStore(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function allNotes(){return new Promise((resolve,reject)=>{const r=txStore().getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
function putNote(note){return new Promise((resolve,reject)=>{const r=txStore('readwrite').put(note);r.onsuccess=()=>resolve(note);r.onerror=()=>reject(r.error)})}
function deleteNote(id){return new Promise((resolve,reject)=>{const r=txStore('readwrite').delete(id);r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}
let notes=[], selectedDate=new Date(), calendarCursor=new Date(), editingId=null, pendingImages=[], toastTimer;
selectedDate.setHours(12,0,0,0);calendarCursor=new Date(selectedDate);
const todayKey=()=>iso(new Date());
function dateFromJalaliKey(key){const [y,m,d]=key.split('/').map(Number);return jalaliToGregorian(y,m,d)}
function localDateFromInput(s){if(!s)return new Date();return parseISO(s)}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function getByDate(date){const k=iso(date);return notes.filter(n=>n.date===k).sort((a,b)=>a.createdAt-b.createdAt)}
function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtShort(key){return jalaliString(parseISO(key))}
function renderHeader(){
 const now=new Date();$('#fullDate').textContent=`${weekdayName(now)}، ${jalaliString(now)}`;
 const same=iso(selectedDate)===todayKey();$('#selectedDayLabel').textContent=same?'برنامه‌های امروز':'برنامه‌های این روز';
 $('#selectedDateTitle').textContent=same?'امروز':`${weekdayName(selectedDate)}، ${jalaliString(selectedDate)}`;
 const dayNotes=getByDate(selectedDate),done=dayNotes.filter(n=>n.completed).length,todo=dayNotes.length-done;
 $('#doneCount').textContent=toFa(done);$('#todoCount').textContent=toFa(todo);
 const pct=dayNotes.length?Math.round(done/dayNotes.length*100):0;$('#progressBar').style.width=pct+'%';$('#progressLabel').textContent=toFa(pct)+'٪ تکمیل شده';
 const remaining=notes.filter(n=>!n.completed).length;$('#remainingBadge').hidden=!remaining;$('#floatingAdd').style.display=$('.nav-item.active')?.dataset.view==='todayView'?'grid':'none';
}
function noteCard(n,compact=false){
 const done=n.completed?' completed':'';
 const title=n.title?`<h3 class="note-title">${escapeHTML(n.title)}</h3>`:'';
 const content=n.content?`<p class="note-content">${escapeHTML(n.content)}</p>`:'';
 const imgs=(n.images||[]).length?`<div class="note-images">${n.images.map((src,i)=>`<img src="${src}" alt="تصویر یادداشت" data-photo="${n.id}" data-image="${i}" loading="lazy">`).join('')}</div>`:'';
 const datePill=compact?`<span class="date-pill">${escapeHTML(fmtShort(n.date))}</span>`:'';
 return `<article class="note-card${done}" data-note="${n.id}"><input class="note-check" type="checkbox" aria-label="علامت‌گذاری انجام‌شدن" ${n.completed?'checked':''} data-check="${n.id}"><div class="note-body">${title}${content}${imgs}<div class="note-meta">${datePill}<span>${n.completed?'✓ انجام شد':'یادداشت شخصی'}</span></div></div><div class="note-actions"><button class="mini-action" data-edit="${n.id}" aria-label="ویرایش یادداشت" title="ویرایش">✎</button><button class="mini-action" data-delete="${n.id}" aria-label="حذف یادداشت" title="حذف">⌫</button></div></article>`;
}
function renderNotes(){
 const day=getByDate(selectedDate);$('#notesList').innerHTML=day.map(n=>noteCard(n)).join('');$('#emptyNotes').hidden=day.length>0;
 const rem=notes.filter(n=>!n.completed).sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt);
 $('#remainingList').innerHTML=rem.map(n=>noteCard(n,true)).join('');$('#emptyRemaining').hidden=rem.length>0;
 const calNotes=getByDate(selectedDate);$('#calendarNotesList').innerHTML=calNotes.map(n=>noteCard(n,true)).join('');$('#calendarNotesTitle').textContent=`یادداشت‌های ${jalaliString(selectedDate)}`;
 renderHeader();renderCalendar();
}
function renderCalendar(){
 const [jy,jm]=jalali(calendarCursor);$('#monthTitle').textContent=`${persianMonths[jm-1]} ${toFa(jy)}`;
 $('#weekdayLabels').innerHTML=weekShort.map(x=>`<span>${x}</span>`).join('');
 const first=jalaliMonthFirst(jy,jm);let offset=(first.getDay()+1)%7; // Saturday first
 const gridStart=new Date(first);gridStart.setDate(first.getDate()-offset);
 let html='';
 for(let i=0;i<42;i++){
   const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);
   const key=iso(d),jd=jalali(d),sameMonth=jd[0]===jy&&jd[1]===jm,ev=eventsFor(d),hasNote=notes.some(n=>n.date===key),hasEvent=ev.length>0,isHoliday=ev.some(e=>e.holiday);
   const cls=['calendar-day',!sameMonth?'outside':'',key===todayKey()?'today':'',key===iso(selectedDate)?'selected':'',isHoliday?'holiday':''].filter(Boolean).join(' ');
   html+=`<button class="${cls}" data-day="${key}" aria-label="${escapeHTML(jalaliString(d))}"><span class="day-number">${toFa(jd[2])}</span><span class="day-markers">${hasNote?'<i></i>':''}${hasEvent?'<i class="event-marker"></i>':''}</span></button>`;
 }
 $('#calendarGrid').innerHTML=html;
 const ev=eventsFor(selectedDate);$('#eventsDateTitle').textContent=jalaliString(selectedDate);
 $('#eventsList').innerHTML=ev.length?ev.map(e=>`<div class="event-row ${e.holiday?'holiday-event':''}">${escapeHTML(e.name)} <span class="event-kind">${e.holiday?'تعطیل رسمی':escapeHTML(e.kind||'مناسبت')}</span></div>`).join(''):'<p class="no-events">برای این روز مناسبتی در فهرست محلی ثبت نشده است.</p>';
}
function setView(id){
 $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
 $$('.nav-item').forEach((b,i)=>b.classList.toggle('active',b.dataset.view===id));
 const idx=['todayView','calendarView','remainingView'].indexOf(id);$('#navIndicator').className='nav-indicator'+(idx?` pos-${idx}`:'');
 $('#floatingAdd').style.display=id==='todayView'?'grid':'none';
 if(id==='calendarView')renderCalendar();
}
function openDialog(note=null,defaultDate=selectedDate){
 editingId=note?.id||null;pendingImages=(note?.images||[]).slice();
 $('#dialogTitle').textContent=note?'ویرایش یادداشت':'یادداشت جدید';
 $('#noteTitle').value=note?.title||'';$('#noteContent').value=note?.content||'';
 $('#noteDate').value=note?.date||iso(defaultDate);$('#noteImages').value='';
 $('#storageMessage').textContent='اطلاعات روی همین دستگاه ذخیره می‌شود.';
 renderPreviews();$('#noteDialog').showModal();setTimeout(()=>$('#noteContent').focus(),80);
}
function renderPreviews(){
 $('#imagePreviews').innerHTML=pendingImages.map((src,i)=>`<div class="preview-wrap"><img src="${src}" alt="پیش‌نمایش تصویر"><button type="button" class="remove-preview" data-remove-image="${i}" aria-label="حذف تصویر">×</button></div>`).join('');
}
function fileToDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function compressImage(file,max=1400,quality=.82){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{const img=new Image();img.onerror=()=>resolve(fr.result);img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',quality))};img.src=fr.result};fr.readAsDataURL(file)})}
async function saveNote(ev){
 ev.preventDefault();const content=$('#noteContent').value.trim();if(!content){$('#noteContent').focus();return}
 const date=$('#noteDate').value;if(!date)return;
 const old=notes.find(n=>n.id===editingId);const note={id:editingId||crypto.randomUUID(),title:$('#noteTitle').value.trim(),content,date,completed:old?.completed||false,createdAt:old?.createdAt||Date.now(),updatedAt:Date.now(),images:pendingImages};
 try{await putNote(note);notes=await allNotes();$('#noteDialog').close();selectedDate=parseISO(date);calendarCursor=new Date(selectedDate);renderNotes();showToast(old?'یادداشت ویرایش شد':'یادداشت ذخیره شد ✨')}
 catch(e){$('#storageMessage').textContent='ذخیره‌سازی انجام نشد؛ فضای دستگاه را بررسی کن.';console.error(e)}
}
async function toggleNote(id,completed){const n=notes.find(x=>x.id===id);if(!n)return;n.completed=completed;n.updatedAt=Date.now();try{await putNote(n);notes=await allNotes();renderNotes()}catch(e){showToast('ذخیره وضعیت انجام نشد')}}
async function removeNote(id){if(!confirm('این یادداشت حذف شود؟'))return;await deleteNote(id);notes=await allNotes();renderNotes();showToast('یادداشت حذف شد')}
function openPhoto(src){const wrap=document.createElement('div');wrap.className='photo-overlay';wrap.innerHTML='<button aria-label="بستن">×</button><img alt="تصویر یادداشت">';$('img',wrap).src=src;wrap.addEventListener('click',()=>wrap.remove());document.body.append(wrap)}
function applyTheme(theme){document.documentElement.dataset.theme=theme;$('#themeIcon').textContent=theme==='dark'?'☀':'☾';$('#themeToggle').setAttribute('aria-label',theme==='dark'?'فعال کردن حالت روشن':'فعال کردن حالت تاریک');try{localStorage.setItem('rooz-theme',theme)}catch{}}
function initTheme(){let theme;try{theme=localStorage.getItem('rooz-theme')}catch{}if(!theme)theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';applyTheme(theme)}
function exportBackup(){/* intentionally kept minimal; no extra UI */}

// Events
$('#themeToggle').addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
$('#addNoteBtn').addEventListener('click',()=>openDialog(null,selectedDate));$('#emptyAddBtn').addEventListener('click',()=>openDialog(null,selectedDate));$('#floatingAdd').addEventListener('click',()=>openDialog(null,selectedDate));$('#calendarAddBtn').addEventListener('click',()=>openDialog(null,selectedDate));
$('#closeDialog').addEventListener('click',()=>$('#noteDialog').close());$('#cancelDialog').addEventListener('click',()=>$('#noteDialog').close());$('#noteForm').addEventListener('submit',saveNote);
$('#noteImages').addEventListener('change',async e=>{const files=[...e.target.files].slice(0,6-pendingImages.length);for(const f of files){if(!f.type.startsWith('image/'))continue;try{pendingImages.push(await compressImage(f))}catch{showToast('خواندن تصویر ممکن نشد')}}renderPreviews();e.target.value=''});
$('#imagePreviews').addEventListener('click',e=>{const b=e.target.closest('[data-remove-image]');if(b){pendingImages.splice(+b.dataset.removeImage,1);renderPreviews()}});
document.addEventListener('click',async e=>{
 const check=e.target.closest('[data-check]');if(check){await toggleNote(check.dataset.check,check.checked);return}
 const edit=e.target.closest('[data-edit]');if(edit){const n=notes.find(x=>x.id===edit.dataset.edit);if(n)openDialog(n);return}
 const del=e.target.closest('[data-delete]');if(del){await removeNote(del.dataset.delete);return}
 const photo=e.target.closest('[data-photo]');if(photo){const n=notes.find(x=>x.id===photo.dataset.photo);if(n)openPhoto(n.images[+photo.dataset.image]);return}
 const day=e.target.closest('[data-day]');if(day){selectedDate=parseISO(day.dataset.day);renderNotes();$('#calendarNotesTitle').textContent=`یادداشت‌های ${jalaliString(selectedDate)}`}
});
$('#prevDay').addEventListener('click',()=>{selectedDate.setDate(selectedDate.getDate()-1);renderNotes()});$('#nextDay').addEventListener('click',()=>{selectedDate.setDate(selectedDate.getDate()+1);renderNotes()});$('#todayBtn').addEventListener('click',()=>{selectedDate=new Date();selectedDate.setHours(12,0,0,0);calendarCursor=new Date(selectedDate);renderNotes()});
$('#prevMonth').addEventListener('click',()=>{const [y,m]=jalali(calendarCursor);calendarCursor=jalaliToGregorian(m===1?y-1:y,m===1?12:m-1,1);renderCalendar()});$('#nextMonth').addEventListener('click',()=>{const [y,m]=jalali(calendarCursor);calendarCursor=jalaliToGregorian(m===12?y+1:y,m===12?1:m+1,1);renderCalendar()});
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#noteDialog').addEventListener('click',e=>{if(e.target===$('#noteDialog'))$('#noteDialog').close()});
document.addEventListener('contextmenu',e=>{if(e.target.closest('.note-title,.note-content,.note-images'))e.preventDefault()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&e.target.closest('.note-title,.note-content'))e.preventDefault()});

(async function init(){
 initTheme();
 try{db=await openDB();notes=await allNotes()}catch(e){console.error(e);showToast('ذخیره‌سازی محلی در این مرورگر در دسترس نیست')}
 renderHeader();renderNotes();
 if('serviceWorker' in navigator && location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW registration failed',e))}
})();
