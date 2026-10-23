import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,emailDraft,mailto} from '../assets/altersvorsorge/engine.mjs';
const input={year:2027,annualCents:180000,age:30,children:0,status:'pension-insured',scope:'new-single',domestic:true,bonus:'used',childrenAssigned:true};
const result=calculate(input);
test('optional contacts allow requests without a callback',()=>{
 const body=emailDraft(input,result).body;
 assert.ok(!body.includes('Rufnummer:'));
 assert.ok(!body.includes('Bitte rufe mich'));
});
test('name, international telephone and request survive mailto encoding',()=>{
 const options={name:' Erika Muster & Beispiel ',phone:' +49 (0) 30 / 123456-0 '};
 const url=new URL(mailto(input,result,options));
 assert.equal(url.searchParams.get('body'),emailDraft(input,result,options).body);
 assert.ok(url.searchParams.get('body').includes('Rufnummer: +49 (0) 30 / 123456-0'));
 assert.ok(url.searchParams.get('body').endsWith('Erika Muster & Beispiel'));
 assert.ok(url.searchParams.get('body').includes('Bitte rufe mich zu dieser Anfrage zurück.'));
});
test('empty telephone never adds a callback request',()=>assert.ok(!emailDraft(input,result,{name:'Test',phone:'  '}).body.includes('Bitte rufe mich')));
test('contact line breaks are flattened',()=>{
 const body=emailDraft(input,result,{name:'Erika\nMuster',phone:'123\r\n456'}).body;
 assert.ok(body.endsWith('Erika Muster'));
 assert.ok(body.includes('Rufnummer: 123 456'));
});
