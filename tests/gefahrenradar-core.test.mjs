import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, RULES } from '../lernwelt/gefahrenradar/scenes.mjs';
import { hazardAt, isHit, scoreScene, summarize, shuffle } from '../lernwelt/gefahrenradar/core.mjs';
test('five unique scenarios with one correct answer, stable answer IDs and a source',()=>{
 assert.equal(SCENES.length,5);assert.equal(new Set(SCENES.map(s=>s.id)).size,5);
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
 const perfect=SCENES.map(s=>({id:s.id,detected:true,early:true,correct:true,misclicks:0}));
 assert.deepEqual({...summarize(perfect),badge:undefined},{points:100,detected:5,correct:5,missed:0,early:5,penalty:0,badge:undefined});
 assert.equal(summarize(perfect).badge.id,'profi');
 assert.equal(summarize(perfect.map(x=>({...x,detected:false,early:false}))).badge,null);
 assert.equal(summarize(perfect.map((x,i)=>i>2?{...x,detected:false,early:false,correct:false}:x)).badge.id,'entdecker');
});
test('shuffle preserves data and input order; zero random gives a different order',()=>{
 const ids=SCENES.map(s=>s.id), original=[...ids], shuffled=shuffle(ids,()=>0);
 assert.deepEqual(ids,original);assert.deepEqual([...shuffled].sort(),[...ids].sort());assert.notDeepEqual(ids,shuffled);
});
