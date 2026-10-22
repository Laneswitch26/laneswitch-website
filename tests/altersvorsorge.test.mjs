import test from 'node:test';import assert from 'node:assert/strict';
import {calculate,parseContribution,mailto,emailDraft} from '../assets/altersvorsorge/engine.mjs';
const base={year:2027,annualCents:180000,age:30,children:0,status:'pension-insured',scope:'new-single',domestic:true,bonus:'used',childrenAssigned:true};
// Independently hand-computed fixtures; expected values are euro amounts, not copied engine expressions.
const cases=[
 ['Null',0,0,0,0,0],['Unter Minimum',11999,0,0,0,0],['Minimum',12000,0,60,0,60],['Erste Stufe',24000,0,120,0,120],
 ['Ende erste Stufe',36000,0,180,0,180],['Ein Cent über Schwelle',36001,0,180.0025,0,180.0025],['Zweite Stufe',60000,0,240,0,240],
 ['Fördermaximum',180000,0,540,0,540],['Über Fördermaximum',200000,0,540,0,540],['Vertragsmaximum',684000,0,540,0,540],
 ['Ein Kind Minimum',12000,1,60,120,180],['Ein Kind unter Kindergrenze',29999,1,149.995,299.99,449.985],['Ein Kind Grenze',30000,1,150,300,450],
 ['Ein Kind Maximum',180000,1,540,300,840],['Drei Kinder',180000,3,540,900,1440],['Kinder unter Minimum',11999,3,0,0,0]
];
for(const [name,annualCents,children,basic,child,total] of cases)test(name,()=>{const r=calculate({...base,annualCents,children});assert.equal(r.status,'calculated');assert.equal(r.basicQ,basic*400);assert.equal(r.childQ,child*400);assert.equal(r.totalQ,total*400);console.log(JSON.stringify({case:name,input:{annualCents,children},expectedEuro:total,actualEuro:r.totalQ/400,status:'PASS'}));});
for(const [name,patch,expected,bonus=0]of [
 ['Bonus 24',{age:24,bonus:'unused'},'calculated',200],['Bonus 25',{age:25,bonus:'unused'},'calculated'],['Bonus verbraucht',{age:24,bonus:'used'},'calculated'],['Bonus unklar',{age:24,bonus:'unknown'},'review'],
 ['Bonus unter Minimum',{age:24,bonus:'unused',annualCents:11999},'calculated'],
 ['Selbstständig bestätigt',{status:'self-employed',selfConditions:true,age:40},'calculated'],['Selbstständig 65',{status:'self-employed',selfConditions:true,age:65},'calculated'],
 ['Selbstständig 66 Grenzjahr',{status:'self-employed',selfConditions:true,age:66},'review'],['Selbstständig 67',{status:'self-employed',selfConditions:true,age:67},'review'],
 ['Selbstständig Voraussetzungen unklar',{status:'self-employed',selfConditions:false},'review'],['Mittelbar',{status:'indirect'},'review'],['Berufsständisch',{status:'professional'},'review'],['Beamter',{status:'civil'},'review'],['Unklar',{status:'other'},'review'],
 ['Altvertrag',{scope:'old'},'review'],['Mehrere Verträge',{scope:'multiple'},'review'],['Ausland',{domestic:false},'review'],['Kinder unklar',{children:1,childrenAssigned:false},'review'],['Über Vertragsmaximum',{annualCents:684001},'review'],['2028',{year:2028},'review'],
 ['Negativ',{annualCents:-1},'invalid'],['Kein Betrag',{annualCents:null},'invalid'],['Bruchteilcent',{annualCents:1.1},'invalid'],['Kind nicht ganzzahlig',{children:1.5},'invalid'],['Alter leer',{age:NaN},'invalid']
])test(name,()=>{const r=calculate({...base,...patch});assert.equal(r.status,expected);if(expected==='calculated')assert.equal(r.bonusQ,bonus*400);else assert.equal(r.totalQ,undefined);console.log(JSON.stringify({case:name,input:patch,expected,actual:r.status,status:'PASS'}));});
test('Monat/Jahr und deutsche Dezimalzahlen',()=>{assert.equal(parseContribution('10,01'),12012);assert.equal(parseContribution('120,12','year'),12012);for(const s of ['','-1','1e3','12.123','NaN','1.000,00'])assert.equal(parseContribution(s),null);});
test('Bonus getrennt, Quote, Nullbeitrag',()=>{const r=calculate({...base,age:24,bonus:'unused',annualCents:12000,children:1});assert.equal(r.totalQ,152000);assert.equal(r.recurringQ,72000);assert.equal(r.combinedQ,200000);assert.equal(r.regularCombinedQ,120000);assert.equal(calculate({...base,annualCents:0}).ratio,null);});
test('Mailto roundtrip UTF-8, Betrag, keine Steuerfiktion, kein HTML',()=>{const r=calculate(base),d=emailDraft(base,r,{name:'Änne & Ömer + Test',audience:'school'}),url=new URL(mailto(base,r,{name:'Änne & Ömer + Test',audience:'school'}));assert.equal(url.pathname,'kontakt@laneswitch.de');assert.equal(url.searchParams.get('body'),d.body);assert.equal(url.searchParams.get('subject'),d.subject);assert.match(d.body,/150,00 € monatlich/);assert.match(d.body,/Fahrschulinhaber/);assert.match(d.body,/Kein zusätzlicher Steuervorteil/);});
test('Prüffall Mail enthält keine erfundene Nullförderung',()=>{const i={...base,status:'other'},d=emailDraft(i,calculate(i));assert.match(d.body,/Keine Förderhöhe berechnet/);assert.doesNotMatch(d.body,/Zulagen 2027 insgesamt/);});
