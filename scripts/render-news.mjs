import fs from 'node:fs';
import {validateFeed,renderNews} from '../assets/news/news.mjs';
const root=new URL('../',import.meta.url);
for(const [audience,path] of [['learner','fahrschueler/index.html'],['school','fahrschulen/index.html']]) {
 const data=validateFeed(JSON.parse(fs.readFileSync(new URL('news/'+audience+'.json',root))));
 const seed=JSON.stringify(data).replace(/</g,'\\u003c');
 const content=renderNews(data)+`<script type="application/json" class="ls-news-seed">${seed}</script>`;
 const file=new URL(path,root);let html=fs.readFileSync(file,'utf8');
 const begin='<!-- ls-news:start -->',end='<!-- ls-news:end -->';
 const block=`${begin}<div data-ls-news="${audience}" class="ls-news">${content}</div>${end}`;
 if(html.includes(begin)&&html.includes(end)) html=html.slice(0,html.indexOf(begin))+block+html.slice(html.indexOf(end)+end.length);
 else {
  const old=`<div data-ls-news="${audience}"><h2>LANE SWITCH News</h2><p>News werden geladen.</p></div>`;
  if(!html.includes(old)) throw Error('News insertion point missing: '+path);
  html=html.replace(old,block);
 }
 html=html.replace('<noscript>Für aktuelle Meldungen bitte JavaScript aktivieren.</noscript>','<noscript>Stand der angezeigten Meldungen siehe Prüfdatum. Ohne JavaScript erfolgt keine automatische Ausblendung abgelaufener Meldungen.</noscript>');
 fs.writeFileSync(file,html);
}
console.log('Rendered both .de audience news sections from validated feeds.');
