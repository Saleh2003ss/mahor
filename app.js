'use strict';
const J=window.Jalali,FA='۰۱۲۳۴۵۶۷۸۹',fa=n=>String(n).replace(/\d/g,d=>FA[d]);
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const WD=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],WDS=['ش','ی','د','س','چ','پ','ج'];
const MSG=['امروزت رو قشنگ بساز!','قدم‌های کوچیک، نتیجه‌های بزرگ','یه کار کوچیک شروع کن، بقیه خودش میاد ✨','هر تیک، یه لبخند کوچیکه','آروم و پیوسته، قشنگ‌ترین راهه','امروز هم روز توئه 🌸'];
const pad=n=>String(n).padStart(2,'0'),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const jOf=s=>{const[a,b,c]=s.split('-').map(Number);return J.toJalali(a,b,c)};
const isoJ=(y,m,d)=>{const g=J.toGregorian(y,m,d);return`${g.gy}-${pad(g.gm)}-${pad(g.gd)}`};
const longD=s=>{const j=jOf(s);return`${WD[parse(s).getDay()]} ${fa(j.jd)} ${MONTHS[j.jm-1]} ${fa(j.jy)}`};
const shortD=s=>{const j=jOf(s);return`${fa(j.jd)} ${MONTHS[j.jm-1]} ${fa(j.jy)}`};
const diff=(a,b)=>Math.round((parse(a)-parse(b))/864e5);
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const $=s=>document.querySelector(s);
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){const v=a[k];if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v)}c.flat().forEach(x=>e.append(x&&x.nodeType?x:document.createTextNode(x==null||x===false?'':x)));return e};
const P={plus:'M12 5v14M5 12h14',check:'M20 6 9 17l-5-5',trash:'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',img:'M3 5h18v14H3zM8.5 10.5h.01M21 15l-5-5L5 19',home:'M3 11l9-8 9 8M5 10v10h14V10',cal:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',list:'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',gear:'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M16 4v4M8 10v4M18 16v4',next:'m9 6 6 6-6 6',prev:'m15 6-6 6 6 6',x:'M18 6 6 18M6 6l12 12',open:'M7 17 17 7M8 7h9v9'};
const ico=p=>{const s=h('span');s.style.display='inline-flex';s.innerHTML=`<svg viewBox="0 0 24 24"><path d="${P[p]}"/></svg>`;return s};
const URLS=new WeakMap(),urlOf=b=>{let u=URLS.get(b);if(!u){u=URL.createObjectURL(b);URLS.set(b,u)}return u};
/* ---- IndexedDB ---- */
const DB=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('daily-planner',1);r.onupgradeneeded=()=>r.result.createObjectStore('notes',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const tx=async(m,f)=>{const db=await open();return new Promise((res,rej)=>{const t=db.transaction('notes',m),r=f(t.objectStore('notes'));t.oncomplete=()=>res(r.result);t.onerror=()=>rej(t.error)})};
return{all:()=>tx('readonly',s=>s.getAll()),put:n=>tx('readwrite',s=>s.put(n)),del:id=>tx('readwrite',s=>s.delete(id)),clear:()=>tx('readwrite',s=>s.clear())}})();
/* ---- state ---- */
let notes=[],today=iso(new Date()),sel=today,tab=localStorage.getItem('tab')||'today',cal={y:jOf(today).jy,m:jOf(today).jm};
const dayNotes=d=>notes.filter(n=>n.date===d).sort((a,b)=>a.createdAt-b.createdAt);
const pending=()=>notes.filter(n=>!n.completed).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.createdAt-b.createdAt);
const toast=t=>{const e=h('div',{class:'toast'},t);document.body.append(e);setTimeout(()=>e.remove(),2200)};
function sheet(title,...content){const ov=h('div',{class:'ov'}),close=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),230)};
 ov.append(h('div',{class:'sheet',role:'dialog'},title&&h('h2',{},title),...content));
 ov.addEventListener('click',e=>{if(e.target===ov)close()});document.body.append(ov);requestAnimationFrame(()=>ov.classList.add('on'));return close}
const confirmBox=(msg,ok='تأیید')=>new Promise(res=>{const c=sheet('',h('p',{style:'line-height:2;margin:0 0 6px;font-size:15px'},msg),h('div',{class:'btns'},h('button',{class:'btn dng',onclick:()=>{c();res(true)}},ok),h('button',{class:'btn',onclick:()=>{c();res(false)}},'انصراف')))});
function lightbox(b){const ov=h('div',{class:'ov lb'},h('img',{src:urlOf(b),alt:''}));ov.onclick=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),230)};document.body.append(ov);requestAnimationFrame(()=>ov.classList.add('on'))}
/* ---- actions ---- */
function stats(){const e=$('#stats');if(!e)return;const l=dayNotes(sel),d=l.filter(n=>n.completed).length;e.querySelector('[data-d]').textContent=fa(d);e.querySelector('[data-r]').textContent=fa(l.length-d)}
async function toggle(n,el,rem){n.completed=!n.completed;n.updatedAt=Date.now();await DB.put(n);const c=el.querySelector('.chk');c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop');c.setAttribute('aria-pressed',n.completed);
 el.classList.toggle('done',n.completed);stats();badge();
 if(rem&&n.completed){el.classList.add('out');setTimeout(render,280)}else if(tab==='cal')setTimeout(render,320)}
async function remove(n){if(await confirmBox('این یادداشت برای همیشه حذف شود؟','حذف')){await DB.del(n.id);notes=notes.filter(x=>x.id!==n.id);render();toast('حذف شد')}}
function goDay(d){sel=d;const j=jOf(d);cal={y:j.jy,m:j.jm};tab='today';localStorage.setItem('tab',tab);render();scrollTo({top:0,behavior:'smooth'})}
function card(n,rem){const late=rem&&n.date<today,el=h('article',{class:'card note'+(n.completed?' done':'')});
 const chk=h('button',{class:'chk','aria-label':'انجام شد','aria-pressed':n.completed,onclick:()=>toggle(n,el,rem)},ico('check'));
 const meta=rem&&h('div',{class:'meta'},h('span',{class:'tag'},shortD(n.date)),late&&h('span',{class:'tag late'},`عقب‌افتاده · ${fa(diff(today,n.date))} روز پیش`));
 const th=n.images.length&&h('div',{class:'thumbs'},n.images.map(b=>h('img',{src:urlOf(b),alt:'تصویر یادداشت',loading:'lazy',onclick:()=>lightbox(b)})));
 const acts=h('div',{class:'acts'},rem&&h('button',{onclick:()=>goDay(n.date)},ico('open'),'باز کردن در روز اصلی'),h('button',{onclick:()=>editor(n)},ico('edit'),'ویرایش'),h('button',{onclick:()=>remove(n)},ico('trash'),'حذف'));
 el.append(chk,h('div',{class:'nb'},n.title&&h('h3',{},n.title),n.content&&h('p',{},n.content),meta,th,acts));return el}
/* ---- editor ---- */
async function shrink(f){try{const bm=await createImageBitmap(f),s=Math.min(1,1400/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*s);c.height=Math.round(bm.height*s);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return await new Promise(r=>c.toBlob(r,'image/jpeg',.85))||f}catch{return f}}
function editor(n,date){const dr={title:n?n.title:'',content:n?n.content:'',imgs:n?[...n.images]:[]},j0=jOf(n?n.date:date||sel);
 const t=h('input',{type:'text',placeholder:'عنوان (اختیاری)',value:dr.title,maxlength:120}),c=h('textarea',{placeholder:'چی تو ذهنته؟'});c.value=dr.content;
 const sD=h('select'),sM=h('select'),sY=h('select');
 for(let i=1;i<=31;i++)sD.append(h('option',{value:i},fa(i)));MONTHS.forEach((m,i)=>sM.append(h('option',{value:i+1},m)));for(let y=j0.jy-6;y<=j0.jy+6;y++)sY.append(h('option',{value:y},fa(y)));
 sD.value=j0.jd;sM.value=j0.jm;sY.value=j0.jy;
 const pv=h('div',{class:'thumbs'}),draw=()=>{pv.replaceChildren(...dr.imgs.map((b,i)=>h('div',{class:'pv'},h('img',{src:urlOf(b),alt:''}),h('button',{type:'button','aria-label':'حذف تصویر',onclick:()=>{dr.imgs.splice(i,1);draw()}},'×'))))};draw();
 const fi=h('input',{type:'file',accept:'image/*',multiple:true,hidden:true,onchange:async()=>{for(const f of fi.files)dr.imgs.push(await shrink(f));fi.value='';draw()}});
 let busy=false;
 const close=sheet(n?'ویرایش یادداشت':'یادداشت جدید',h('label',{class:'f'},'عنوان',t),h('label',{class:'f'},'متن',c),
  h('div',{class:'row'},h('label',{class:'f'},'روز',sD),h('label',{class:'f'},'ماه',sM),h('label',{class:'f'},'سال',sY)),
  h('button',{class:'chip',type:'button',onclick:()=>fi.click()},ico('img'),'افزودن عکس'),fi,pv,
  h('div',{class:'btns'},h('button',{class:'btn pri',onclick:async()=>{if(busy)return;const title=t.value.trim(),content=c.value.trim();if(!title&&!content&&!dr.imgs.length){toast('یه چیزی بنویس یا عکس اضافه کن 🌸');return}
   busy=true;const y=+sY.value,m=+sM.value,d=Math.min(+sD.value,J.monthLength(y,m)),date=isoJ(y,m,d),now=Date.now();
   const rec=n||{id:uid(),completed:false,createdAt:now};Object.assign(rec,{title,content,date,images:dr.imgs,updatedAt:now});await DB.put(rec);if(!n)notes.push(rec);
   sel=date;const jj=jOf(date);cal={y:jj.jy,m:jj.jm};close();render();toast(n?'ذخیره شد':'اضافه شد ✨')}},'ذخیره'),h('button',{class:'btn',onclick:()=>close()},'انصراف')));
 setTimeout(()=>{if(!n)t.focus()},260)}
/* ---- backup ---- */
const toURL=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
async function exportAll(){const out=[];for(const n of notes)out.push({...n,images:await Promise.all(n.images.map(toURL))});
 const b=new Blob([JSON.stringify({app:'daily-planner',version:1,exportedAt:new Date().toISOString(),notes:out})],{type:'application/json'}),a=h('a',{href:URL.createObjectURL(b),download:`planner-backup-${today}.json`});document.body.append(a);a.click();a.remove();toast('فایل پشتیبان دانلود شد')}
async function importFile(f){try{const d=JSON.parse(await f.text());if(d.app!=='daily-planner'||!Array.isArray(d.notes))throw 0;
 if(!await confirmBox(`با بازیابی، همه یادداشت‌های فعلی با ${fa(d.notes.length)} یادداشت فایل پشتیبان جایگزین می‌شوند. ادامه می‌دهی؟`,'جایگزین کن'))return;
 const list=[];for(const n of d.notes)list.push({id:n.id||uid(),title:n.title||'',content:n.content||'',date:n.date,completed:!!n.completed,createdAt:n.createdAt||Date.now(),updatedAt:n.updatedAt||Date.now(),images:await Promise.all((n.images||[]).map(u=>fetch(u).then(r=>r.blob())))});
 await DB.clear();for(const n of list)await DB.put(n);notes=list;render();toast('بازیابی انجام شد ✅')}catch{toast('فایل پشتیبان معتبر نیست')}}
function settings(){const fi=h('input',{type:'file',accept:'application/json,.json',hidden:true,onchange:()=>{if(fi.files[0])importFile(fi.files[0]);fi.value=''}});
 const close=sheet('پشتیبان‌گیری',h('p',{style:'font-size:13.5px;color:var(--mute);line-height:2;margin:0 0 12px'},'یادداشت‌ها و عکس‌ها فقط روی همین دستگاه ذخیره می‌شوند. با پاک شدن اطلاعات مرورگر ممکنه از بین بروند؛ پس گاهی نسخه پشتیبان بگیر.'),
  h('div',{class:'btns',style:'flex-direction:column'},h('button',{class:'btn pri',onclick:exportAll},'دانلود نسخه پشتیبان'),h('button',{class:'btn',onclick:()=>{close();fi.click()}},'بازیابی از فایل'),fi))}
/* ---- views ---- */
function listOf(l,rem,emptyMsg){return l.length?l.map(n=>card(n,rem)):h('div',{class:'empty'},emptyMsg)}
function viewToday(){const isT=sel===today,l=dayNotes(sel),dn=l.filter(n=>n.completed).length,doy=Math.floor(parse(sel)/864e5);
 const rel=isT?'امروز':sel===addDays(today,-1)?'دیروز':sel===addDays(today,1)?'فردا':'';
 return[h('section',{class:'card hero'},h('small',{},rel||' '),h('h2',{},WD[parse(sel).getDay()]),h('div',{class:'dt'},shortD(sel)),h('div',{class:'msg'},MSG[doy%MSG.length]),
   h('div',{class:'stats',id:'stats'},h('span',{class:'pill'},'انجام‌شده',h('b',{'data-d':1},fa(dn))),h('span',{class:'pill'},'باقی‌مانده',h('b',{'data-r':1},fa(l.length-dn))))),
  h('div',{class:'dnav'},h('button',{class:'chip',onclick:()=>{sel=addDays(sel,-1);render()}},ico('next'),'روز قبل'),!isT?h('button',{class:'chip',onclick:()=>{sel=today;render()}},'برو به امروز'):h('span'),h('button',{class:'chip',onclick:()=>{sel=addDays(sel,1);render()}},'روز بعد',ico('prev'))),
  ...[].concat(listOf(l,false,'هنوز یادداشتی برای این روز نداری 🌱\nبا دکمه + شروع کن'))]}
function viewCal(){const len=J.monthLength(cal.y,cal.m),first=isoJ(cal.y,cal.m,1),off=(parse(first).getDay()+1)%7,cnt={};
 notes.forEach(n=>{const o=cnt[n.date]||(cnt[n.date]={t:0,u:0});o.t++;if(!n.completed)o.u++});
 const g=h('div',{class:'grid'},WDS.map(w=>h('div',{class:'wd'},w)),Array.from({length:off},()=>h('span')));
 for(let d=1;d<=len;d++){const s=isoJ(cal.y,cal.m,d),o=cnt[s];g.append(h('button',{class:'day'+(s===today?' today':'')+(s===sel?' sel':''),'aria-label':longD(s),onclick:()=>{sel=s;render()}},fa(d),o&&h('i',{class:o.u?'':'ok'},fa(o.t))))}
 const mv=k=>{cal.m+=k;if(cal.m>12){cal.m=1;cal.y++}if(cal.m<1){cal.m=12;cal.y--}render()};
 return[h('section',{class:'card'},h('div',{class:'mh'},h('button',{class:'ib','aria-label':'ماه قبل',onclick:()=>mv(-1)},ico('next')),h('h2',{},`${MONTHS[cal.m-1]} ${fa(cal.y)}`),h('button',{class:'ib','aria-label':'ماه بعد',onclick:()=>mv(1)},ico('prev'))),g,
   h('div',{class:'meta',style:'margin-top:12px;justify-content:center'},h('span',{class:'tag late'},'دارای کار انجام‌نشده'),h('span',{class:'tag',style:'background:var(--mint)'},'همه انجام شده'))),
  h('h3',{class:'sec'},longD(sel)),...[].concat(listOf(dayNotes(sel),false,'یادداشتی برای این روز نیست'))]}
function viewRem(){const l=pending();return[h('h3',{class:'sec'},l.length?`${fa(l.length)} کار باقی‌مانده`:'کارهای باقی‌مانده'),...[].concat(listOf(l,true,'عالی پیش رفتی! همه کارهات انجام شدن ✨'))]}
function badge(){const n=pending().filter(x=>x.date<today).length,b=$('#nav [data-t=rem] .n');if(b){b.textContent=fa(n);b.hidden=!n}}
function render(){const v=$('#view');v.className='view-in';const f={today:viewToday,cal:viewCal,rem:viewRem}[tab]();v.replaceChildren(...f);
 document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));badge()}
function setTab(t){tab=t;localStorage.setItem('tab',t);render()}
function init(){const nav=$('#nav');[['today','home','امروز'],['cal','cal','تقویم'],['rem','list','باقی‌مانده‌ها']].forEach(([t,i,l])=>nav.append(h('button',{'data-t':t,onclick:()=>setTab(t)},ico(i),l,t==='rem'&&h('span',{class:'n',hidden:true}))));
 $('#gear').append(ico('gear'));$('#fab').append(ico('plus'));$('#fab').onclick=()=>editor(null,sel);$('#gear').onclick=settings;
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){const t=iso(new Date());if(t!==today){if(sel===today)sel=t;today=t;render()}}});
 DB.all().then(a=>{notes=a.map(n=>({...n,images:n.images||[]}));render()}).catch(()=>{$('#view').replaceChildren(h('div',{class:'empty'},'مرورگر شما اجازه ذخیره‌سازی محلی نمی‌دهد (حالت ناشناس؟)'))});
 navigator.storage&&navigator.storage.persist&&navigator.storage.persist();
 if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{})}
init();
