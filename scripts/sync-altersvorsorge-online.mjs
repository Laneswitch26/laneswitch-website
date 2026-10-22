// Generate .online's calculator from the canonical .de implementation. Never hand-edit copied logic.
// node scripts/sync-altersvorsorge-online.mjs /absolute/path/to/cloudflare-online-worktree
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';
const source=resolve(fileURLToPath(new URL('..',import.meta.url))),target=process.argv[2];
if(!target)throw new Error('Pass the cloudflare-online worktree path.');
const dist=join(target,'dist');await mkdir(join(dist,'konzept/assets/altersvorsorge'),{recursive:true});await mkdir(join(dist,'konzept/altersvorsorge'),{recursive:true});
for(const f of ['rules.mjs','engine.mjs','ui.mjs','calculator.css'])await copyFile(join(source,'assets/altersvorsorge',f),join(dist,'konzept/assets/altersvorsorge',f));
let html=await readFile(join(source,'altersvorsorge/index.html'),'utf8');
html=html.replaceAll('href="/','href="/konzept/').replaceAll('src="/assets/','src="/konzept/assets/');
html=html.replace(/<script src="\/konzept\/assets\/theme\.js[^>]*><\/script>/,'<script type="module" src="/app/detail.js?v=7-altersvorsorge"></script>');
html=html.replace('<body class="av-page">','<body class="av-page" data-detail="true">');
html=html.replace('</head>',`<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/konzept/assets/concept.css?v=11-audit"><link rel="stylesheet" href="/app/shell.css?v=6-footer"><link rel="stylesheet" href="/app/contrast.css?v=5d"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/app/pwa.css?v=2-safe-area"><script defer src="/app/pwa.js?v=1"></script><style>
.av-page{--paper:var(--card);--ice:var(--bg);--dark-page:var(--bg);--dark-surface:var(--card);--dark-surface-2:var(--tint);--dark-field:var(--card);--dark-line:var(--line);--dark-text:var(--ink);--dark-muted:var(--muted)}
.av-page .av-card{border-radius:18px;background:var(--card)}.av-page .av-small{color:var(--muted)}.av-page .av-total p,.av-page .av-total strong{color:#fff!important}.av-page .av-total{border-radius:12px}.av-page .av-audiences a[aria-current]{color:#fff!important}
@media(max-width:1100px){.av-layout{grid-template-columns:1fr}}
</style></head>`);
await writeFile(join(dist,'konzept/altersvorsorge/index.html'),html);
// Add only the new privacy subsection, preserving all .online-specific text.
const privacy=await readFile(join(source,'datenschutz/index.html'),'utf8'),addition=privacy.slice(privacy.indexOf('<h3>Förderrechner für Altersvorsorge</h3>'),privacy.indexOf('<h2>4. Cookies'));
const path=join(dist,'konzept/datenschutz/index.html');let current=await readFile(path,'utf8');current=current.replace(/<h3>Förderrechner für Altersvorsorge<\/h3>[\s\S]*?(?=<h2>4\. Cookies)/,'');current=current.replace('<h2>4. Cookies',addition+'<h2>4. Cookies');await writeFile(path,current);
console.log('Copied one shared implementation; adapted only paths and existing .online shell.');
