import {RULES as R, CONTACT} from './rules.mjs';
export function parseContribution(text, period='month') {
  if(!['month','year'].includes(period)) return null;
  const v=String(text).trim().replace(',','.');
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(v)) return null;
  const [a,b='']=v.split('.'); const cents=Number(a)*100+Number(b.padEnd(2,'0'));
  return cents*(period==='month'?12:1);
}
export function calculate(i) {
  const review=reason=>({status:'review',reason});
  const invalid=reason=>({status:'invalid',reason});
  if(i.year!==R.year) return review('Dieser Rechner unterstützt ausschließlich das Beitragsjahr 2027.');
  if(!Number.isSafeInteger(i.annualCents)||i.annualCents<0) return invalid('Bitte einen gültigen Beitrag mit höchstens zwei Nachkommastellen eingeben.');
  if(!Number.isInteger(i.age)||i.age<0||i.age>120) return invalid('Bitte das Alter am 01.01.2027 als ganze Zahl eingeben.');
  if(!Number.isInteger(i.children)||i.children<0||i.children>50) return invalid('Bitte eine gültige Anzahl förderrelevanter Kinder eingeben.');
  if(i.scope!=='new-single') return review('Bestehende Verträge, mehrere Verträge, betriebliche Altersvorsorge oder bereits begonnene Auszahlung erfordern eine individuelle Prüfung.');
  if(i.domestic!==true) return review('Wohnsitz- oder Steuerverhältnisse mit Auslandsbezug müssen individuell geprüft werden.');
  if(i.annualCents>R.contractCapCents) return review('Der Beitrag liegt über der jährlichen Einzahlungsgrenze für einen neuen Vertrag. Bitte die Vertragsaufteilung individuell prüfen lassen.');
  if(i.status==='self-employed') {
    if(i.selfConditions!==true) return review('Für Selbstständige müssen die Einkunftsart und die Steuererklärung für 2027 geklärt werden.');
    if(i.age>=R.selfEmployedAgeExclusive-1) return review('Die Altersgrenze für die neue Selbstständigenförderung muss anhand des Geburtstags und des Förderzeitraums geprüft werden.');
  } else if(i.status!=='pension-insured') return review('Für diesen beruflichen Status ist eine individuelle Prüfung der Förderberechtigung erforderlich.');
  if(i.children>0 && i.childrenAssigned!==true) return review('Bitte die Zuordnung der Kinderzulagen und die Kindergeldvoraussetzungen individuell prüfen lassen.');
  if(i.age<R.bonusAgeExclusive && !['unused','used'].includes(i.bonus)) return review('Ob der einmalige Berufseinsteigerbonus noch verfügbar ist, muss zuerst geklärt werden.');
  const b=i.annualCents;
  // Exact integer quarter-cents throughout; rounding is presentation-only.
  const basicQ=b<R.minimumCents?0:Math.min(b,R.firstTierCents)*R.firstRate*4+Math.max(0,Math.min(b,R.eligibleCapCents)-R.firstTierCents)*R.secondRate*4;
  const childQ=b<R.minimumCents?0:i.children*Math.min(b,R.childCapCents)*R.childRate*4;
  const bonusQ=b>=R.minimumCents && i.age<R.bonusAgeExclusive && i.bonus==='unused'?R.bonusCents*4:0;
  const recurringQ=basicQ+childQ, totalQ=recurringQ+bonusQ;
  return {status:'calculated',annualCents:b,basicQ,childQ,bonusQ,recurringQ,totalQ,
    combinedQ:b*4+totalQ,regularCombinedQ:b*4+recurringQ,
    ratio:b===0?null:totalQ/(b*4)*100,regularRatio:b===0?null:recurringQ/(b*4)*100,
    belowMinimum:b<R.minimumCents,remainingCents:Math.max(0,R.eligibleCapCents-b)};
}
export const euros=cents=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(cents/100);
export const amountQ=q=>euros(q/4);
export function emailDraft(i,r,{audience='student',name=''}={}) {
 const statusNames={'pension-insured':'Gesetzlich rentenversicherungspflichtig','self-employed':'Selbstständig / Gewerbe','indirect':'Möglicherweise mittelbar über Ehepartner:in','professional':'Berufsständische Versorgung','civil':'Beamtin / Beamter','other':'Sonstiger / unklarer Status'};
 const lines=['Hallo Steven,','','ich habe den LANE-SWITCH-Förderrechner genutzt und möchte meine Möglichkeiten für eine geförderte Altersvorsorge prüfen lassen.','','Beitragsjahr: '+R.year,
 'Gewünschter eigener Beitrag: '+euros(i.annualCents/12)+' monatlich (Jahresdurchschnitt) / '+euros(i.annualCents)+' jährlich',
 'Beruflicher Status: '+(statusNames[i.status]||'Nicht angegeben'), 'Alter am 01.01.2027: '+i.age,
 'Angegebene förderrelevante Kinder: '+i.children,
 'Kinderzuordnung bestätigt: '+(i.children===0?'Nicht erforderlich':i.childrenAssigned?'Ja':'Nein / unklar'),
 'Neuvertrag ohne weitere geförderte Verträge, vor Auszahlung: '+(i.scope==='new-single'?'Ja':'Nein / unklar'),
 'Wohnsitz und unbeschränkte Steuerpflicht in Deutschland: '+(i.domestic?'Ja':'Nein / unklar'),
 'Bonusstatus: '+(i.age>=R.bonusAgeExclusive?'Altersgrenze überschritten':i.bonus==='unused'?'Noch nicht erhalten':i.bonus==='used'?'Bereits erhalten':'Unklar'),
 'Selbstständigen-Voraussetzungen für 2027 bestätigt: '+(i.status==='self-employed'?(i.selfConditions?'Ja, vorbehaltlich tatsächlicher Erfüllung':'Nein / unklar'):'Nicht einschlägig'),
 'Zielgruppe: '+(audience==='school'?'Fahrschulinhaber:in':'Fahrschüler:in'),''];
 if(r.status==='calculated') lines.push('Unverbindliche Modellrechnung bei Erfüllung aller Voraussetzungen:',
 'Grundzulage: '+amountQ(r.basicQ),'Kinderzulage: '+amountQ(r.childQ),'Einmaliger Berufseinsteigerbonus: '+amountQ(r.bonusQ),
 'Zulagen 2027 insgesamt: '+amountQ(r.totalQ),'Vergleich ohne Einmalbonus bei gleichen Voraussetzungen: '+amountQ(r.recurringQ));
 else lines.push('Keine Förderhöhe berechnet. Individuelle Prüfung erforderlich: '+r.reason);
 lines.push('','Kein zusätzlicher Steuervorteil enthalten. Rechtsstand: '+R.reviewedAt+'.',
 'Ich interessiere mich für eine persönliche Produktberatung über deine Tätigkeit bei SIGNAL IDUNA nach individueller Bedarfsanalyse. Bitte melde dich bei mir zur Terminvereinbarung.','','Viele Grüße',name.trim().slice(0,120)||'[Name]');
 return {subject:'LANE SWITCH – Anfrage zur geförderten Altersvorsorge ab 2027',body:lines.join('\n')};
}
export function mailto(i,r,options){const d=emailDraft(i,r,options);return 'mailto:'+CONTACT.email+'?subject='+encodeURIComponent(d.subject)+'&body='+encodeURIComponent(d.body);}
