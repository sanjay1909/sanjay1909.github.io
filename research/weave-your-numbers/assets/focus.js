const app=document.querySelector('.rama-app'),history=document.querySelector('.focus-history');
function pane(value){app.dataset.mobilePane=value;for(const b of document.querySelectorAll('[data-pane]'))b.setAttribute('aria-pressed',String(b.dataset.pane===value));}
function tool(value){history.dataset.trailTab=value;for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===value));}
for(const b of document.querySelectorAll('[data-pane]'))b.addEventListener('click',()=>pane(b.dataset.pane));
for(const b of document.querySelectorAll('[data-tool]'))b.addEventListener('click',()=>tool(b.dataset.tool));
document.querySelector('#time-travel-toggle').addEventListener('click',()=>{const p=document.querySelector('#time-travel-panel'),visible=!p.hidden&&history.dataset.trailTab==='replay'&&(!window.matchMedia('(max-width:1050px)').matches||app.dataset.mobilePane==='trail'),open=!visible;p.hidden=!open;document.querySelector('#time-travel-toggle').setAttribute('aria-expanded',String(open));if(open){tool('replay');pane('trail');document.querySelector('#time-travel-slider').focus();}window.dispatchEvent(new Event('diary-layout'));});
