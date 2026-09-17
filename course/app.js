/* Integrated reader: original public lessons, local figures, no student-data writes. */
import {i as getReact, t as getReactDOM} from './vendor/framework-D_rUT4EX.js';
import Lesson from './vendor/lesson-DIhAjWhw.js';
import {a as units, i as stages, r as ranges} from './vendor/course-iwkjHcS-.js';

const React = getReact();
const {createRoot} = getReactDOM();
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const query = new URLSearchParams(location.search);
const n = Number(query.get('week') || 1);
const week = Number.isInteger(n) && n >= 1 && n <= 18 ? n : 1;
const tab = ['learn','assessment','discussion','teacher'].includes(query.get('tab')) ? query.get('tab') : 'learn';
const overview = query.get('view') === 'overview';
const media = matchMedia('(max-width: 820px)');
const root = createRoot($('lesson-root'));
let menuOpen = false;

function renderMenu(search = '') {
  const needle = search.trim().toLocaleLowerCase();
  let count = 0;
  $('course-nav').innerHTML = stages.map((stage,index) => {
    const list = units.filter(u => u.stage === index && (!needle || JSON.stringify(u).toLocaleLowerCase().includes(needle)));
    count += list.length;
    if (!list.length) return '';
    return `<section class="nav-stage"><h2><span>${esc(stage)}</span><small>${esc(ranges[index])}</small></h2>${list.map(u=>`<a href="?week=${u.week}" data-week="${u.week}" ${u.week===week&&!overview?'aria-current="page"':''}><span>${String(u.week).padStart(2,'0')}</span><strong>${esc(u.title)}</strong></a>`).join('')}</section>`;
  }).join('');
  $('search-status').textContent = needle ? `${count} 個章節符合「${search.trim()}」` : '';
}

function setMenu(open, restoreFocus = true) {
  menuOpen = Boolean(open && media.matches);
  document.body.classList.toggle('course-menu-open', menuOpen);
  $('open-menu').setAttribute('aria-expanded', String(menuOpen));
  $('menu-backdrop').hidden = !menuOpen;
  $('integration-sidebar').inert = media.matches && !menuOpen;
  if(media.matches && !menuOpen) $('integration-sidebar').setAttribute('aria-hidden','true');
  else $('integration-sidebar').removeAttribute('aria-hidden');
  if(menuOpen) $('close-menu').focus();
  else if(restoreFocus && media.matches) $('open-menu').focus();
}

function Overview() {
  return React.createElement('main',{className:'integrated-overview'},
    React.createElement('p',{className:'section-kicker'},'COURSE ROADMAP / 18 WEEKS'),
    React.createElement('h1',null,'從服務現象，到可信的研究設計'),
    React.createElement('p',{className:'overview-lead'},'依原課程的18週順序，逐步累積一份8–12頁的可行研究計畫。每週的完整教材、備課與圖解，在同一個閱讀頁。'),
    React.createElement('div',{className:'overview-facts'},
      ...[['18','週完整教材'],['54','個核心概念段落'],['36','組獨立圖解'],['120','分鐘／每週']].map(([a,b])=>React.createElement('div',{key:b},React.createElement('strong',null,a),React.createElement('span',null,b)))),
    ...stages.map((stage,index)=>React.createElement('section',{className:'overview-stage',key:stage},
      React.createElement('header',null,React.createElement('span',null,String(index+1).padStart(2,'0')),React.createElement('div',null,React.createElement('h2',null,stage),React.createElement('p',null,'第 '+ranges[index]+' 週'))),
      React.createElement('div',{className:'overview-lessons'},...units.filter(u=>u.stage===index).map(u=>React.createElement('a',{href:'?week='+u.week,key:u.week,className:'overview-card'},React.createElement('small',null,'WEEK '+String(u.week).padStart(2,'0')),React.createElement('h3',null,u.title),React.createElement('p',null,u.core),React.createElement('span',null,'本週成果：'+u.deliverable),React.createElement('strong',{className:'overview-go'},'閱讀本週教材與圖解 →')))))));
}

renderMenu();
setMenu(false,false);
$('open-menu').addEventListener('click',()=>setMenu(!menuOpen));
$('close-menu').addEventListener('click',()=>setMenu(false));
$('menu-backdrop').addEventListener('click',()=>setMenu(false));
$('course-search').addEventListener('input',event=>renderMenu(event.target.value));
$('print-course').addEventListener('click',()=>window.print());
media.addEventListener('change',()=>setMenu(false,false));
document.addEventListener('keydown',event=>{
  if(!menuOpen) return;
  if(event.key==='Escape'){event.preventDefault();setMenu(false);return;}
  if(event.key==='Tab') {
    const items=[...$('integration-sidebar').querySelectorAll('a[href],button,input')].filter(e=>e.offsetParent!==null);
    const first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});

if(overview) {
  document.title='18週學程總覽｜原教材與圖解整合版';
  root.render(React.createElement(Overview));
} else {
  document.title=`第${week}週 ${units[week-1].title}｜研究方法整合課程`;
  root.render(React.createElement(Lesson,{unit:units[week-1],displayName:'',initialTab:tab}));
}
// Metadata only: no cookies, local storage, API endpoints or personal records.
window.IntegratedCourse=Object.freeze({version:'2.0.0',week,chapterCount:units.length,backend:'original-service',contentSource:'original-public-course',overview});
