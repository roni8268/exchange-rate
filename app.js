const CURRENCIES={TWD:{name:'台幣',flag:'🇹🇼',symbol:'NT$'},KRW:{name:'韓元',flag:'🇰🇷',symbol:'₩'},PHP:{name:'披索',flag:'🇵🇭',symbol:'₱'},USD:{name:'美元',flag:'🇺🇸',symbol:'US$'}};
const API='https://api.frankfurter.dev/v2/rates?base=USD&quotes=TWD,KRW,PHP';
const $=id=>document.getElementById(id);
const savedPair=JSON.parse(localStorage.getItem('lastPair')||'null');
let from=savedPair?.from&&CURRENCIES[savedPair.from]?savedPair.from:'TWD',to=savedPair?.to&&CURRENCIES[savedPair.to]?savedPair.to:'PHP',calc='0',storedValue=null,operator=null,waiting=false,expression='',rates={},customRates=JSON.parse(localStorage.getItem('myRates')||'{}'),rateMode='market',selecting='from';

function fmt(n){if(!Number.isFinite(n))return '錯誤';return new Intl.NumberFormat('en-US',{maximumFractionDigits:6}).format(n)}
function raw(n){return Number(String(n).replace(/,/g,''))}
function pairKey(a,b){return `${a}_${b}`}
function customRate(a,b){if(a===b)return 1;if(customRates[pairKey(a,b)]!=null)return Number(customRates[pairKey(a,b)]);if(customRates[pairKey(b,a)]!=null)return 1/Number(customRates[pairKey(b,a)]);return null}
function marketRate(a,b){if(a===b)return 1;if(!rates.USD)return null;const usd={USD:1,...rates};if(usd[a]&&usd[b])return usd[b]/usd[a];return null}
function getRate(a,b){return rateMode==='custom'?customRate(a,b):marketRate(a,b)}
function symbol(c){return CURRENCIES[c].symbol}
function currencyLabel(c){return `${CURRENCIES[c].flag} ${c} ${CURRENCIES[c].name}`}
function savePair(){localStorage.setItem('lastPair',JSON.stringify({from,to}))}
function render(){
  $('fromBtn').textContent=currencyLabel(from);$('toBtn').textContent=currencyLabel(to);
  $('expression').textContent=expression||'\u00a0';$('amount').textContent=fmt(raw(calc));
  const r=getRate(from,to);const val=raw(calc);
  $('converted').textContent=r==null?'—':`${symbol(to)}${fmt(val*r)}`;
  $('rateText').textContent=r==null?`尚未設定 ${from} → ${to}`:`1 ${from} = ${fmt(r)} ${to}`;
  $('rateModeBtn').textContent=rateMode==='market'?'市場匯率':'我的匯率';
  renderQuick();renderSaved();
}
function renderQuick(){const values={TWD:[1000,3000,5000],KRW:[10000,50000,100000],PHP:[500,1000,2000],USD:[10,50,100]}[from];$('quickButtons').innerHTML=values.map(v=>`<button data-quick="${v}">${symbol(from)}${fmt(v)}</button>`).join('');document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{calc=String(b.dataset.quick);waiting=false;expression='';render()})}
function calculate(a,b,op){a=Number(a);b=Number(b);if(op==='+')return a+b;if(op==='-')return a-b;if(op==='*')return a*b;if(op==='/')return b===0?NaN:a/b;return b}
function press(k){
 if(k==='clear'){calc='0';storedValue=null;operator=null;waiting=false;expression='';render();return}
 if(k==='back'){if(waiting){calc='0';waiting=false}else{calc=calc.length>1?calc.slice(0,-1):'0';if(calc==='-0')calc='0'}render();return}
 if(k==='sign'){calc=String(-raw(calc));render();return}
 if(k==='%'){calc=String(raw(calc)/100);render();return}
 if('0123456789'.includes(k)){
   if(waiting){calc=k;waiting=false}else calc=calc==='0'?k:calc+k;render();return;
 }
 if(k==='.') {if(waiting){calc='0.';waiting=false}else if(!calc.includes('.'))calc+='.';render();return}
 if(['+','-','*','/'].includes(k)){
   if(operator&&!waiting){const result=calculate(storedValue,calc,operator);storedValue=result;calc=String(result)}else storedValue=raw(calc);
   operator=k;waiting=true;expression=`${fmt(storedValue)} ${k==='*'?'×':k==='/'?'÷':k}`;render();return;
 }
 if(k==='='){
   if(operator){const left=storedValue,right=raw(calc),result=calculate(left,right,operator);expression=`${fmt(left)} ${operator==='*'?'×':operator==='/'?'÷':operator} ${fmt(right)}`;calc=String(result);storedValue=null;operator=null;waiting=true;render();}return;
 }
}
function openCurrency(which){selecting=which;$('currencyList').innerHTML=Object.keys(CURRENCIES).map(c=>`<button data-currency="${c}">${currencyLabel(c)}</button>`).join('');document.querySelectorAll('[data-currency]').forEach(b=>b.onclick=()=>{if(selecting==='from'&&b.dataset.currency===to)to=from; if(selecting==='to'&&b.dataset.currency===from)from=to; if(selecting==='from')from=b.dataset.currency;else to=b.dataset.currency;savePair();close('currencyModal');render()});$('currencyModal').classList.remove('hidden')}
function close(id){$(id).classList.add('hidden')}
function renderCustomSelects(){const opts=Object.keys(CURRENCIES).map(c=>`<option value="${c}">${c} ${CURRENCIES[c].name}</option>`).join('');$('customBase').innerHTML=opts;$('customQuote').innerHTML=opts;$('customBase').value='USD';$('customQuote').value='PHP'}
function renderSaved(){const entries=Object.entries(customRates);$('savedRates').innerHTML=entries.length?entries.map(([k,v])=>{const [a,b]=k.split('_');return `<div class="saved-rate"><span>1 ${a} = ${v} ${b}</span><button data-del="${k}">刪除</button></div>`}).join(''):'<div class="hint">尚未設定我的匯率</div>';document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{delete customRates[b.dataset.del];localStorage.setItem('myRates',JSON.stringify(customRates));render()})}
async function fetchRates(){try{const res=await fetch(API,{cache:'no-store'});if(!res.ok)throw new Error();const data=await res.json();const next={USD:1};if(Array.isArray(data)){data.forEach(x=>next[x.quote]=x.rate)}else if(data.rates){Object.assign(next,data.rates)}rates=next;localStorage.setItem('marketRates',JSON.stringify({rates,updatedAt:Date.now()}));$('statusDot').className='dot online';$('statusText').textContent='線上｜匯率已更新';render()}catch(e){const saved=JSON.parse(localStorage.getItem('marketRates')||'null');if(saved?.rates){rates=saved.rates;$('statusDot').className='dot offline';$('statusText').textContent='離線｜使用上次匯率';render()}else{$('statusDot').className='dot offline';$('statusText').textContent='離線｜尚無市場匯率';render()}}}

document.querySelectorAll('.key').forEach(b=>b.addEventListener('click',()=>press(b.dataset.key)));
$('fromBtn').onclick=()=>openCurrency('from');$('toBtn').onclick=()=>openCurrency('to');$('swapBtn').onclick=()=>{[from,to]=[to,from];savePair();render()};$('rateModeBtn').onclick=()=>{rateMode=rateMode==='market'?'custom':'market';render()};$('settingsBtn').onclick=()=>{$('settingsModal').classList.remove('hidden');renderCustomSelects();renderSaved()};
$('saveRate').onclick=()=>{const a=$('customBase').value,b=$('customQuote').value,v=Number($('customRate').value);if(a===b||!v||v<=0)return;customRates[pairKey(a,b)]=v;localStorage.setItem('myRates',JSON.stringify(customRates));$('customRate').value='';rateMode='custom';render()};
$('clearCustom').onclick=()=>{if(confirm('確定清除全部我的匯率？')){customRates={};localStorage.setItem('myRates','{}');render()}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>close(b.dataset.close));
document.addEventListener('keydown',e=>{const map={'Enter':'=','Escape':'clear','Backspace':'back','+':'+','-':'-','*':'*','/':'/','x':'*','X':'*','%':'%'};if(/^[0-9.]$/.test(e.key)||map[e.key]){e.preventDefault();press(map[e.key]||e.key)}});
render();fetchRates();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
