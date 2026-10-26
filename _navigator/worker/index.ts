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
function protect(response:Response){const result=new Response(response.body,response);for(const [key,value] of Object.entries(security))if(!result.headers.has(key))result.headers.set(key,value);return result;}
export default {
  async fetch(req:Request,env:any){
    const u=new URL(req.url),path=u.pathname.replace(/\/$/,'');
    let response:Response;
    if(path==='/api/navigator'){
      if(!env.DB||!env.NAV_ACCOUNTS)return protect(Response.json({error:'Der Navigator wird eingerichtet. Bitte später erneut versuchen.'},{status:503}));
      response=req.method==='GET'?await GET(req):req.method==='POST'?await POST(req):new Response(null,{status:405,headers:{Allow:'GET, POST'}});
    }else if(req.method!=='GET'&&req.method!=='HEAD')response=new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
    else if(/^\/navigator\/(zugang|a1|emre|test)$/.test(path)){
      u.pathname='/navigator/app.html';u.search='';
      response=await env.ASSETS.fetch(new Request(u,{method:req.method}));
    }else if(/^\/navigator\/assets\/[A-Za-z0-9._-]+$/.test(path))response=await env.ASSETS.fetch(req);
    else response=new Response('Nicht gefunden.',{status:404});
    return protect(response);
  }
};
