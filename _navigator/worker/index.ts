import {GET,POST} from '../app/api/navigator/route';
const security={
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'X-Robots-Tag':'noindex, nofollow',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
// Registrierte Fahrschulen erhalten /navigator/<adresse>, sofern sie existieren und nicht gesperrt sind.
async function registeredSchool(env:any,path:string){const m=/^\/navigator\/([a-z0-9][a-z0-9-]{1,39})$/.exec(path);if(!m||!env.DB)return false;try{return !!await env.DB.prepare('SELECT 1 FROM nav_schools WHERE school=? AND disabled=0').bind(m[1]).first();}catch{return false;}}
function protect(response:Response){const result=new Response(response.body,response);for(const [key,value] of Object.entries(security))if(key==='Cache-Control'||!result.headers.has(key))result.headers.set(key,value);return result;}
export default {
  async fetch(req:Request,env:any){
    const u=new URL(req.url),path=u.pathname.replace(/\/$/,'');
    let response:Response;
    if(path==='/api/navigator'){
      if(!env.DB||!env.NAV_ACCOUNTS)return protect(Response.json({error:'Der Navigator wird eingerichtet. Bitte später erneut versuchen.'},{status:503}));
      response=req.method==='GET'?await GET(req):req.method==='POST'?await POST(req):new Response(null,{status:405,headers:{Allow:'GET, POST'}});
      // Only public profile availability can be read from the sister domain.
      // Private sessions, files and all writes remain same-origin.
      if(req.method==='GET'&&u.searchParams.get('action')==='public'&&req.headers.get('origin')==='https://laneswitch.de'){
        response=new Response(response.body,response);
        response.headers.set('Access-Control-Allow-Origin','https://laneswitch.de');
        response.headers.set('Vary','Origin');
      }
    }else if(path==='/navigator/ai-studio'){
      if(req.method!=='GET'&&req.method!=='HEAD') response=new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
      else {
        const authUrl=new URL('/api/navigator',req.url);
        const auth=await GET(new Request(authUrl,{method:'GET',headers:req.headers}));
        if(!auth.ok)response=new Response(null,{status:302,headers:{Location:'/navigator/zugang?next=ai-studio'}});
        else {
          const account=await auth.json() as {admin?:boolean,school?:string};
          if(account.school==='test')response=new Response("<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>LANESWITCH AI Studio – Demo</title><style>*{box-sizing:border-box}body{margin:0;background:#091525;color:#eef6ff;font:16px/1.55 system-ui,Arial,sans-serif}main{max-width:1080px;margin:auto;padding:26px}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;padding-bottom:25px}.brand{font-weight:900;letter-spacing:.15em;color:#67dce4}.pill{background:#243447;color:#bce4e9;border-radius:99px;padding:6px 13px;font-size:13px}.hero{padding:28px;border:1px solid #2b4562;border-radius:20px;background:#12253b}h1{font-size:clamp(28px,5vw,51px);line-height:1.1;margin:10px 0 16px}p{color:#bdcfe0}.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:25px 0}.step{background:#162a40;border:1px solid #2d4961;border-radius:14px;padding:20px}h2{font-size:17px;margin:0 0 12px}.sample{position:relative;margin:20px auto 0;width:min(440px,100%);aspect-ratio:4/5;background:#20232b;border-radius:12px;overflow:hidden;border:2px solid #455366;padding:24px}.sample strong{font-size:clamp(24px,5vw,50px);line-height:1.05;display:block}.sample .red{color:#f5414c}.road{height:37%;margin-top:25px;border-radius:100% 100% 0 0;background:linear-gradient(165deg,transparent 40%,#ed263b 41%,#ed263b 56%,transparent 57%);border-bottom:5px solid #fff7}.comparison{display:flex;gap:10px}.comparison div{flex:1;background:#f8f9fa;color:#14283d;padding:10px;border-radius:8px;font-size:12px}.comparison b{font-size:22px}.watermark{position:absolute;transform:rotate(-22deg);top:50%;left:4%;right:4%;padding:8px;text-align:center;font-weight:900;letter-spacing:.5em;font-size:42px;color:#fff9;background:#18304eaa;border:3px solid #fff6}.notice{border:1px solid #446178;padding:18px;border-radius:12px;background:#172b42}a{color:#92edf6}@media(max-width:650px){.steps{grid-template-columns:1fr}.top{align-items:flex-start}.sample{padding:18px}.watermark{font-size:26px}}</style></head><body><main><div class=\"top\"><div class=\"brand\">LANESWITCH · AI STUDIO</div><span class=\"pill\">Nur Ansicht · Testzugang</span></div><section class=\"hero\"><span class=\"pill\">Beispiel – frei erfunden</span><h1>So entsteht ein eigener KI-Markenauftritt.</h1><p>Im vollständigen Partnerzugang führt dich das Studio vom Markenprofil über deinen persönlichen KI-Coach bis zur fertigen Marketingkampagne. Hier siehst du nur ein unveränderliches Muster.</p></section><section class=\"steps\"><div class=\"step\"><h2>01 · Markenprofil</h2><p>Beispielwerte festlegen: Zielgruppe, Tonalität, eigene Farben und besondere Stärken.</p></div><div class=\"step\"><h2>02 · KI-Projekt</h2><p>Individuelle Projektanweisungen für ChatGPT, Gemini oder Claude erstellen.</p></div><div class=\"step\"><h2>03 · Content</h2><p>Ein fertiges Werbemotiv entwickeln, prüfen und in die PDF-Projektmappe übernehmen.</p></div></section><div class=\"sample\" aria-label=\"Fiktive, nicht bearbeitbare Instagram-Demografik\"><div class=\"pill\">MUSTERFAHRSCHULE</div><strong>DEIN WEG<br><span class=\"red\">ZUM FÜHRERSCHEIN.</span></strong><div class=\"road\"></div><div class=\"comparison\"><div><b>KLAR.</b><br>Individuelle Markenidee</div><div><b>EINFACH.</b><br>Professioneller Social-Post</div></div><div class=\"watermark\">DEMO</div></div><p class=\"notice\">Diese Ansicht enthält keine echten Fahrschuldaten, keine Arbeits-Prompts und keine Generator-Funktionen. Für die vollständige Nutzung wird ein regulärer Partnerzugang benötigt. Sichtbare Demo-Inhalte können grundsätzlich als Screenshot gesichert werden.</p><p><a href=\"/navigator/zugang\">← Zurück zum Fahrschul-Navigator</a></p></main></body></html>",{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'"}});
          else if(account.admin||account.school){
            const html=await env.AI_STUDIO_KV?.get('studio-v06');
            response=html?new Response(req.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; font-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'"}}):new Response('AI Studio wird eingerichtet.',{status:503});
          }else response=new Response('Kein Zugriff.',{status:403});
        }
      }
    }else if(req.method!=='GET'&&req.method!=='HEAD')response=new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
    else if(/^\/navigator\/(zugang|demo|admin|registrierung|a1|emre|test)$/.test(path)||await registeredSchool(env,path)){
      u.pathname='/navigator/app.html';u.search='';
      response=await env.ASSETS.fetch(new Request(u,{method:req.method}));
    }else if(/^\/navigator\/assets\/[A-Za-z0-9._-]+$/.test(path))response=await env.ASSETS.fetch(req);
    else response=new Response('Nicht gefunden.',{status:404});
    return protect(response);
  }
};
