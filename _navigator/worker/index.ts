import {GET,POST} from '../app/api/navigator/route';
import {AI_STUDIO_DEMO_HTML} from './aiStudioDemo';
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
          if(account.school==='test')response=new Response(AI_STUDIO_DEMO_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'"}});
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
