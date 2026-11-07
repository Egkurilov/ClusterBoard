/* Integration is evaluated before the legacy bootstrap; it preserves other modules. */
paths.gantt='<path d="M3 3v18h18M7 6h8M10 11h11M7 16h6"/>';
const ganttResultsBase=c9Results,ganttShellBase=c9Shell,ganttPresentBase=c9StartPresentation;
c9Results=function(){return c9.page==='gantt'?ganttView(false):ganttResultsBase();};
c9Shell=function(){let html=ganttShellBase();if(c9.page==='gantt')html=html.replace('c9-app module-initiatives','c9-app cbg-work module-initiatives');return html;};
c9StartPresentation=function(){return c9.page==='gantt'?ganttPresent():ganttPresentBase();};
const ganttSlidesBase=c9PresentationHTML;
c9PresentationHTML=function(){return ganttSlidesBase().replace('<button class="btn c9-native"','<button class="btn" data-gantt="present">Гант</button><button class="btn c9-native"');};
const ganttDetailBase=c9Detail;
c9Detail=function(x){return '<div class="cbg-notice"><b>Плановый период</b><p>'+esc(x.startDate?c9Fmt(x.startDate,true):'Начало не задано')+' — '+esc(x.deadline?c9Fmt(x.deadline,true):'Срок не задан')+'</p></div>'+ganttDetailBase(x);};
function ganttRemember(){const el=document.querySelector(gantt.full?'#cbg-full .cbg-scroll':'#c9-results .cbg-scroll');if(el){gantt.left=el.scrollLeft;gantt.top=el.scrollTop;}}
function ganttRestore(){const el=document.querySelector(gantt.full?'#cbg-full .cbg-scroll':'#c9-results .cbg-scroll');if(el){el.scrollLeft=gantt.left;el.scrollTop=gantt.top;}}
function ganttRefresh(){if(gantt.full){const el=document.querySelector('#cbg-full .cbg-body');if(el)el.innerHTML=ganttView(true);}else ganttRefreshBase();ganttRestore();}
const ganttRefreshBase=c9Refresh,ganttSelectionBase=c9SelectRefresh;
c9Refresh=function(){if(c9.page==='gantt')ganttRemember();ganttRefreshBase();if(c9.page==='gantt')ganttRestore();};
c9SelectRefresh=function(){if(c9.page==='gantt')ganttRemember();ganttSelectionBase();if(c9.page==='gantt')ganttRestore();};
function ganttPresent(){
 if(!c9Discard())return;
 const selected=[...c9.selected].map(c9ById).filter(Boolean),prior=c9.presentation;
 const rows=prior?prior.ids.map(c9ById).filter(Boolean):selected.length?selected:c9Filtered();
 ganttRemember();gantt.focus=document.activeElement;gantt.full={ids:rows.map(x=>x.id),prior,left:gantt.left,top:gantt.top};gantt.left=0;gantt.top=0;c9.presentation=null;
 const el=document.createElement('section');el.id='cbg-full';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Гант: презентация');
 el.innerHTML='<header><div><b>Инициативы · Диаграмма Ганта</b><small>'+esc(data.current.cluster.name)+' · Только просмотр · v0.10.1</small></div><div class="c9-actions"><button class="btn" data-gantt="fullscreen">Полный экран</button><button class="btn" data-gantt="exit">Выйти</button></div></header><main class="cbg-body"></main>';
 document.body.appendChild(el);document.querySelector('#app').inert=true;document.querySelector('#app').setAttribute('aria-hidden','true');ganttRefresh();el.querySelector('[data-gantt="exit"]').focus();
}
function ganttExit(){const state=gantt.full;if(!state)return;document.querySelector('#cbg-full').remove();gantt.full=null;gantt.peek=null;gantt.left=state.left;gantt.top=state.top;c9.presentation=state.prior;const app=document.querySelector('#app');app.inert=false;app.removeAttribute('aria-hidden');if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});render();ganttRestore();if(gantt.focus&&gantt.focus.isConnected)gantt.focus.focus();}
function ganttPeek(id){const x=c9ById(id);if(!x)return;const old=document.querySelector('#cbg-peek');if(old)old.remove();const el=document.createElement('div');el.id='cbg-peek';el.innerHTML='<section role="dialog" aria-modal="true" aria-label="Инициатива: только просмотр"><button class="btn" data-gantt="back">Назад</button>'+c9Detail(x)+'</section>';document.querySelector('#cbg-full').appendChild(el);gantt.peek=id;el.querySelector('button').focus();}
function ganttBack(){const el=document.querySelector('#cbg-peek');if(el)el.remove();gantt.peek=null;document.querySelector('#cbg-full [data-gantt="exit"]').focus();}
function ganttDemoDates(){const rows=data.initiatives.filter(x=>x.demo&&!x.startDate&&x.deadline&&c9ValidDate(x.deadline));if(!rows.length)return;if(!confirm('Добавить учебные даты начала '+rows.length+' демопримерам? Реальные инициативы не меняются.'))return;if(c9Commit(()=>rows.forEach(x=>{x.startDate=ganttISO(ganttDay(x.deadline)-28);x.updatedAt=new Date().toISOString();x.events=x.events.concat([{at:x.updatedAt,note:'Учебный период; только демонстрационные данные.',changes:['Дата начала: не задана → '+x.startDate]}]).slice(-200);}), 'Добавлены даты демопримеров.'))render();}
window.addEventListener('click',function(e){const b=e.target.closest('[data-gantt]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const action=b.dataset.gantt;
 if(action==='present')return ganttPresent();if(action==='exit')return ganttExit();if(action==='back')return ganttBack();
 if(action==='open'){if(gantt.full)return ganttPeek(b.dataset.id);return c9Open(b.dataset.id,'view');}
 if(action==='dates'){c9Open(b.dataset.id,'update');setTimeout(()=>{const x=document.querySelector('#c9f-startDate');if(x){x.scrollIntoView({block:'center'});x.focus();}},20);return;}
 if(action==='demo-dates')return ganttDemoDates();
 if(action==='fullscreen'){if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>toast('Режим без панелей уже работает.'));else toast('Режим без панелей уже работает.');return;}
 if(action==='scale'){ganttRemember();gantt.scale=b.dataset.scale;gantt.left=0;ganttRefresh();return;}
 if(action==='fold'){ganttRemember();const k=b.dataset.key;if(gantt.folded.has(k))gantt.folded.delete(k);else gantt.folded.add(k);ganttRefresh();return;}
 if(action==='today'){gantt.includeToday=true;ganttRefresh();const el=document.querySelector(gantt.full?'#cbg-full .cbg-scroll':'#c9-results .cbg-scroll'),l=gantt.layout;if(el&&l){el.scrollLeft=(l.today-l.from)*l.px-(el.clientWidth-l.label)/2;ganttRemember();}return;}
},true);
window.addEventListener('change',e=>{if(e.target.id==='cbg-slice'){c9.metric=e.target.value;c9Refresh();return;}if(e.target.id==='cbg-group'){ganttRemember();gantt.group=e.target.value;gantt.folded.clear();ganttRefresh();}},true);
window.addEventListener('keydown',e=>{if(!gantt.full)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();return gantt.peek?ganttBack():ganttExit();}if(e.key==='Tab'){const area=document.querySelector(gantt.peek?'#cbg-peek':'#cbg-full'),nodes=[...area.querySelectorAll('button,input,select,summary,[tabindex="0"]')].filter(x=>!x.disabled&&x.offsetParent!==null),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}if(!e.target.closest('input,select,textarea')&&!gantt.peek&&['ArrowLeft','ArrowRight'].includes(e.key)){const el=document.querySelector('#cbg-full .cbg-scroll');el.scrollLeft+=e.key==='ArrowRight'?180:-180;e.preventDefault();}},true);
let ganttResizeTimer;
window.addEventListener('resize',()=>{if(!gantt.full&&!(ui.view==='initiatives'&&c9.page==='gantt'))return;clearTimeout(ganttResizeTimer);ganttResizeTimer=setTimeout(()=>{ganttRemember();ganttRefresh();},120);});
