import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, RULES } from '../lernwelt/gefahrenradar/scenes.mjs';
import { hazardAt, isHit, scoreScene, summarize, shuffle, createSceneDeck } from '../lernwelt/gefahrenradar/core.mjs';
test('25 unique scenarios with one correct answer, stable answer IDs and a source',()=>{
 assert.equal(SCENES.length,25);assert.equal(new Set(SCENES.map(s=>s.id)).size,25);
 for(const s of SCENES){assert.equal(s.options.filter(o=>o.correct).length,1);assert.equal(new Set(s.options.map(o=>o.id)).size,3);assert(s.durationMs>s.cueMs+RULES.earlyMs);assert(s.source.url.startsWith('https://www.gesetze-im-internet.de/'));}
});
test('hit areas track motion, exclude premature and expired clicks and remain touchable',()=>{
 for(const s of SCENES){
  assert(!isHit(s,s.cueMs-1,...s.hazard.from));
  for(const width of [296,354,800]) for(const t of [s.cueMs,s.cueMs+3000,s.durationMs-1]){
   const p=hazardAt(s,t);assert(isHit(s,t,p.x,p.y,width));assert(isHit(s,t,p.x+27*800/width,p.y,width));assert(!isHit(s,t,20,20,width));
  }
  assert(!isHit(s,s.durationMs,...s.hazard.to));
 }
});
test('decisions outweigh speed; penalties cap at four and cannot make a negative score',()=>{
 assert.equal(scoreScene({detected:true,early:true,correct:true,misclicks:0}),20);
 assert.equal(scoreScene({detected:true,early:false,correct:true,misclicks:0}),18);
 assert.equal(scoreScene({detected:false,early:false,correct:true,misclicks:0}),12);
 assert.equal(scoreScene({detected:true,early:true,correct:false,misclicks:0}),8);
 assert.equal(scoreScene({detected:true,early:true,correct:true,misclicks:99}),16);
 assert.equal(scoreScene({detected:false,early:false,correct:false,misclicks:99}),0);
});
test('totals and badges include detection as well as correct decisions',()=>{
 const perfect=SCENES.slice(0,5).map(s=>({id:s.id,detected:true,early:true,correct:true,misclicks:0}));
 assert.deepEqual({...summarize(perfect),badge:undefined},{points:100,detected:5,correct:5,missed:0,early:5,penalty:0,badge:undefined});
 assert.equal(summarize(perfect).badge.id,'profi');
 assert.equal(summarize(perfect.map(x=>({...x,detected:false,early:false}))).badge,null);
 assert.equal(summarize(perfect.map((x,i)=>i>2?{...x,detected:false,early:false,correct:false}:x)).badge.id,'entdecker');
});
test('shuffle preserves data and input order; zero random gives a different order',()=>{
 const ids=SCENES.map(s=>s.id), original=[...ids], shuffled=shuffle(ids,()=>0);
 assert.deepEqual(ids,original);assert.deepEqual([...shuffled].sort(),[...ids].sort());assert.notDeepEqual(ids,shuffled);
});

// Reproducible random stream exercises many orderings, including wrap boundaries.
const seeded = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0) / 4294967296);
test('all scenes occur before reuse, with no overlaps between consecutive rounds',()=>{
 for (const length of [25,26,27,29,30,51]) for (let seed=1;seed<=80;seed++) {
  const pool=Array.from({length},(_,id)=>({id:String(id)}));
  const deck=createSceneDeck(pool,seeded(seed));
  const draws=Array.from({length:length*20},()=>deck.next().id);
  for(let i=0;i+length<=draws.length;i+=length) assert.equal(new Set(draws.slice(i,i+length)).size,length);
  for(let i=0;i+10<=draws.length;i+=5) assert.equal(new Set(draws.slice(i,i+10)).size,10);
 }
});
test('an interrupted round consumes only scenes that were actually requested',()=>{
 const deck=createSceneDeck(SCENES,seeded(43));
 const first=deck.next(); // User goes home immediately; no reservation of unseen scenes.
 const rest=Array.from({length:24},()=>deck.next());
 assert.equal(new Set([first,...rest].map(s=>s.id)).size,25);
 assert(SCENES.includes(deck.next()));
});
test('small future pools remain usable and invalid pools are rejected',()=>{
 assert.throws(()=>createSceneDeck([]));assert.throws(()=>createSceneDeck([{id:'a'},{id:'a'}]));
 const deck=createSceneDeck([{id:'a'}]);assert.equal(deck.next().id,'a');assert.equal(deck.next().id,'a');
});
