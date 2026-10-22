import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatorShareUrl,shareCalculator,setupShare} from '../assets/altersvorsorge/share.mjs';
for(const base of ['https://laneswitch.de/altersvorsorge/','https://laneswitch.online/konzept/altersvorsorge/']) {
  for(const audience of ['fahrschueler','fahrschulen']) test(`${base} preserves audience ${audience} only`,()=>{
    assert.equal(calculatorShareUrl(`${base}?zielgruppe=${audience}&age=24&name=Private#result`),`${base}?zielgruppe=${audience}`);
  });
  test(`${base} defaults to student`,()=>assert.equal(calculatorShareUrl(base+'?zielgruppe=unknown'),base+'?zielgruppe=fahrschueler'));
}
test('native sharing sends only public URL and title',async()=>{
  let payload;
  assert.equal(await shareCalculator({share:async value=>{payload=value;}},'https://laneswitch.de/altersvorsorge/'),'shared');
  assert.deepEqual(Object.keys(payload).sort(),['title','url']);
});
test('cancel never writes to clipboard',async()=>{
  assert.equal(await shareCalculator({share:async()=>{throw {name:'AbortError'};},clipboard:{writeText:()=>assert.fail('unexpected copy')}},'url'),'cancelled');
});
test('unsupported native share copies URL',async()=>{
  let copied;
  assert.equal(await shareCalculator({clipboard:{writeText:async text=>{copied=text;}}},'url'),'copied');
  assert.equal(copied,'url');
});
test('native rejection falls back to clipboard',async()=>{
  assert.equal(await shareCalculator({share:async()=>{throw Error();},clipboard:{writeText:async()=>{}}},'url'),'copied');
});
test('missing or blocked clipboard exposes manual fallback',async()=>{
  assert.equal(await shareCalculator({},'url'),'manual');
  assert.equal(await shareCalculator({clipboard:{writeText:async()=>{throw Error();}}},'url'),'manual');
});
test('manual fallback selects link and restores usable button',async()=>{
  const nodes=Object.fromEntries(['share-calculator','share-status','share-fallback','share-url'].map(id=>[id,{hidden:true,addEventListener(type,fn){this.click=fn;},focus(){this.focused=true;},select(){this.selected=true;}}]));
  setupShare({getElementById:id=>nodes[id]}, {}, 'https://laneswitch.online/konzept/altersvorsorge/?name=private');
  await nodes['share-calculator'].click();
  assert.equal(nodes['share-calculator'].disabled,false);
  assert.equal(nodes['share-fallback'].hidden,false);
  assert.equal(nodes['share-url'].selected,true);
  assert.equal(nodes['share-url'].focused,true);
  assert.equal(nodes['share-url'].value,'https://laneswitch.online/konzept/altersvorsorge/?zielgruppe=fahrschueler');
});
