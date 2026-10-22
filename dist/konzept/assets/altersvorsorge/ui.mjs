import {setupShare} from './share.mjs';
import {RULES as R} from './rules.mjs';
import {calculate,parseContribution,euros,amountQ,emailDraft,mailto} from './engine.mjs';
const $=id=>document.getElementById(id), form=$('av-form');
const audience=new URLSearchParams(location.search).get('zielgruppe')==='fahrschulen'?'school':'student';
$(audience==='school'?'school-link':'student-link').setAttribute('aria-current','page');
if(audience==='school'){
 $('av-heading').textContent='Private Vorsorge. Förderung im Blick.';
 $('av-lead').textContent='Was bedeutet die erweiterte Förderung ab 2027 für Sie als Fahrschulinhaber:in? Prüfen Sie Ihren Beitrag und die Voraussetzungen für eine persönliche Einordnung.';
 $('cta-copy').textContent='Lassen Sie Ihre persönliche Förderberechtigung und passende Vorsorgemöglichkeiten über SIGNAL IDUNA prüfen.';
 // Use formal address throughout the B2B interface without duplicating markup or engine.
 const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode()) nodes.push(walker.currentNode);
 for(const n of nodes)n.nodeValue=n.nodeValue.replace(/\bDeine\b/g,'Ihre').replace(/\bDein\b/g,'Ihr').replace(/\bdeinen\b/g,'Ihren').replace(/\bdeiner\b/g,'Ihrer').replace(/\bdeinem\b/g,'Ihrem').replace(/\bdeine\b/g,'Ihre').replace(/\bDeinem\b/g,'Ihrem').replace(/\bDein\b/g,'Ihr').replace(/\bdein\b/g,'Ihr').replace(/\bdir\b/g,'Ihnen');
}
$('law-year').textContent=R.year;$('reviewed').textContent=R.reviewedAt.split('-').reverse().join('.');$('law-name').textContent=R.law;
for(const [label,url]of R.sources){const li=document.createElement('li'),a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('sources').append(li);}
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
if(today>=R.effectiveFrom)$('effective').textContent='Förderung nach der seit 01.01.2027 geltenden Rechtslage · Beitragsjahr 2027.';
let override=null,lastPeriod='month',result=null,input=null;
function integer(id){const value=$(id).value;return /^\d+$/.test(value)?Number(value):NaN;}
function collect(){return {year:R.year,annualCents:override??parseContribution($('contribution').value,$('period').value),age:integer('age'),children:integer('children'),status:$('status').value,scope:$('scope').value,domestic:$('domestic').value==='yes',selfConditions:$('self-conditions').value==='yes',childrenAssigned:$('assigned').value==='yes',bonus:$('bonus').value};}
const say=text=>audience==='school'?text.replace(/\bdeiner\b/g,'Ihrer').replace(/\bdeinem\b/g,'Ihrem').replace(/\bdir\b/g,'Ihnen').replace(/\bdeinen\b/g,'Ihren').replace(/\bdeine\b/g,'Ihre').replace(/\bDein\b/g,'Ihr').replace(/\bdu\b/g,'Sie'):text;
function paragraph(text,className=''){const p=document.createElement('p');p.textContent=say(text);p.className=className;return p;}
function rows(entries){const dl=document.createElement('dl');dl.className='av-rows';for(const [label,value] of entries){const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;d.append(dt,dd);dl.append(d);}return dl;}
function update(){
 input=collect();
 $('self-fields').hidden=input.status!=='self-employed';$('bonus-fields').hidden=!Number.isInteger(input.age)||input.age>=R.bonusAgeExclusive;
 $('children-fields').hidden=!(input.children>0);
 $('converted').textContent=input.annualCents===null?'Bitte einen gültigen Beitrag eingeben.':`${euros(input.annualCents/12)} monatlich im Durchschnitt · ${euros(input.annualCents)} jährlich${override!==null?' · Jahresbetrag bleibt beim Umschalten exakt erhalten.':''}`;
 const missing=['status','scope','domestic'].filter(id=>!$(id).value);
 result=calculate(input);
 if(missing.length && result.status!=='invalid') result={status:'invalid',reason:'Bitte die noch offenen Auswahlfelder beantworten.'};
 const box=$('result-content');box.replaceChildren();$('inquiry').hidden=result.status==='invalid';
 if(result.status!=='calculated'){
  box.append(paragraph(result.status==='review'?'Für deine Situation ist eine individuelle Prüfung erforderlich.':'Noch fehlen Angaben.','av-notice'),paragraph(result.reason));
  $('result-status').textContent=result.status==='review'?'Keine Förderhöhe berechnet. Persönliche Prüfung möglich.':'Bitte Beitrag, Alter und Voraussetzungen vervollständigen.';
 }else{
  box.append(rows([['Eigener Beitrag / Monat (Ø)',euros(input.annualCents/12)],['Eigener Beitrag / Jahr',euros(input.annualCents)]]));
  box.append(rows([['Grundzulage',amountQ(result.basicQ)],['Kinderzulagen',amountQ(result.childQ)],['Einsteigerbonus · einmalig',amountQ(result.bonusQ)]]));
  const total=document.createElement('div');total.className='av-total';total.append(paragraph('Voraussichtliche Zulagen 2027'));const big=document.createElement('strong');big.textContent=amountQ(result.totalQ);total.append(big);box.append(total);
  box.append(rows([['Eigenbeitrag + Zulagen 2027',amountQ(result.combinedQ)],['Förderquote (Zulagen / Eigenbeitrag)',result.ratio===null?'Nicht definiert':result.ratio.toLocaleString('de-DE',{maximumFractionDigits:2})+' %']]));
  box.append(paragraph('Summe vor Kosten und Wertentwicklung. Die Förderquote ist keine Rendite. Keine verbindliche Förderzusage.','av-small'));
  if(result.bonusQ)box.append(paragraph('Vergleich ohne Einmalbonus: '+amountQ(result.recurringQ)+' Zulagen und '+amountQ(result.regularCombinedQ)+' Eigenbeitrag + Zulagen pro Jahr, sofern Beitrag sowie persönliche und gesetzliche Voraussetzungen gleich bleiben. Keine eigene 2028-Berechnung.','av-notice'));
  if(result.belowMinimum)box.append(paragraph('Unter '+euros(R.minimumCents)+' Eigenbeitrag im Jahr entstehen nach diesen Regeln keine Zulagen.','av-notice'));
  else if(result.remainingCents>0)box.append(paragraph('Bis zur maximalen Grundzulage fehlen '+euros(result.remainingCents)+' eigener Jahresbeitrag (monatlich im Durchschnitt '+euros(result.remainingCents/12)+').','av-notice'));
  else box.append(paragraph('Die maximale Grundzulage ist erreicht. Ein höherer Beitrag erhöht die Zulagen nicht.','av-notice'));
  box.append(paragraph('Ein zusätzlicher steuerlicher Vorteil kann abhängig von deiner persönlichen Steuersituation entstehen und ist in dieser Berechnung nicht enthalten.','av-small'));
  $('result-status').textContent='Berechnung aktualisiert: '+amountQ(result.totalQ)+' voraussichtliche Zulagen im Jahr 2027.';
 }
 updateDraft();
}
function updateDraft(){if(input&&result&&result.status!=='invalid'){const draft=emailDraft(input,result,{audience,name:$('inquiry-name').value});$('email-preview').value='Betreff: '+draft.subject+'\n\n'+draft.body;}}
form.addEventListener('input',e=>{if(e.target.id==='contribution')override=null;update();});
$('period').addEventListener('change',()=>{const current=override??parseContribution($('contribution').value,lastPeriod);lastPeriod=$('period').value;if(current!==null){override=current;$('contribution').value=(current/(lastPeriod==='month'?1200:100)).toFixed(2).replace('.',',');}update();});
form.addEventListener('change',e=>{if(e.target.id!=='period')update();});
for(const b of document.querySelectorAll('[data-preset]')){const cents=R[b.dataset.preset];b.textContent=euros(cents/12)+' / Monat';b.addEventListener('click',()=>{override=null;$('contribution').value=String(cents/($('period').value==='month'?1200:100));update();});}
form.addEventListener('submit',e=>{e.preventDefault();update();$('result-title').tabIndex=-1;$('result-title').focus();});
$('inquiry-name').addEventListener('input',updateDraft);
$('prepare-email').addEventListener('click',()=>{update();if(result.status!=='invalid')location.href=mailto(input,result,{audience,name:$('inquiry-name').value});});
update();

setupShare(document, navigator, location.href);
