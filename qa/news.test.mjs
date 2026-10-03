import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateFeed,activeItems,freshness} from '../dist/app/news.mjs';
const feeds=['learner','school'].map(a=>JSON.parse(fs.readFileSync(new URL('../dist/news/'+a+'.json',import.meta.url))));
test('Both audience feeds meet the schema',()=>feeds.forEach(validateFeed));
test('Expiry is exclusive and future news stays hidden',()=>{
 const n=feeds[0].items[0],data={...feeds[0],items:[n]};
 assert.equal(activeItems(data,Date.parse(n.publishedAt)-1).length,0);
 assert.equal(activeItems(data,Date.parse(n.publishedAt)).length,1);
 assert.equal(activeItems(data,Date.parse(n.expiresAt)).length,0);
});
test('Stale or future review timestamps never claim freshness',()=>{
 const t=feeds[0].checkedAt,now=Date.parse(t);
 assert.match(freshness(t,now+37*3600000),/ausstehend/);
 assert.match(freshness(t,now-1),/ausstehend/);
 assert.match(freshness(t,now),/Zuletzt geprüft/);
});
test('Unsafe sources, duplicate ids and invalid dates are rejected',()=>{
 for(const change of [d=>d.items[0].sources[0].url='javascript:alert(1)',d=>d.items.push(d.items[0]),d=>d.items[0].expiresAt='invalid']){
  const d=structuredClone(feeds[0]);change(d);assert.throws(()=>validateFeed(d));
 }
});
