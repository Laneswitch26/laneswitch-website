import {FAQ,REVIEWED,AI_AVAILABLE,classifyLocal,canUseAI} from './assistant-knowledge.mjs?v=5';
// Chat-style assistant (2026-10-29). Curated answers first; free questions go to grounded AI after a
// one-time confirmation that lasts until the page is reloaded (kept only in memory) and can be switched off.
let aiConsent; // undefined = not asked yet, true = agreed, false = declined/switched off
const states={school:{messages:[],draft:''},learner:{messages:[],draft:''}};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const icon=d=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('class','icon');s.innerHTML=d;return s;};
const SEND='<path d="M5 12h14m-6-6 6 6-6 6"/>';

export function mountAssistant(root,audience){
  const school=audience==='school',state=states[school?'school':'learner'],you=school?'Sie':'du';
  const contact=school?'#kontakt':'/?zielgruppe=learner#kontakt';
  root.replaceChildren();root.className='ls-assistant';
  const chat=el('section',undefined,'ls-chat');chat.setAttribute('aria-labelledby','ls-chat-title');
  // Header
  const head=el('header',undefined,'ls-chat-head');const titles=el('div');
  titles.append(el('h1','Frag LANE SWITCH','ls-chat-title'),el('p',school?'Fragen zu Kooperation, Navigator und Werkzeugen':'Fragen zu Lernwelt, Werkzeugen und LANE SWITCH','ls-chat-sub'));titles.firstChild.id='ls-chat-title';
  const tools=el('div',undefined,'ls-chat-tools');
  const aiBtn=el('button','', 'ls-chat-chip');aiBtn.type='button';
  const reset=el('button','Neuer Chat','ls-chat-chip');reset.type='button';
  tools.append(aiBtn,reset);head.append(titles,tools);
  // Log
  const log=el('div',undefined,'ls-chat-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-label','Chatverlauf');
  // Input
  const form=el('form',undefined,'ls-chat-form');const label=el('label',school?'Ihre Frage':'Deine Frage','ls-sr');label.htmlFor='assistant-question';
  const input=el('input');input.id='assistant-question';input.name='question';input.maxLength=300;input.required=true;input.autocomplete='off';input.enterKeyHint='send';input.value=state.draft;
  input.placeholder=school?'Ihre Frage …':'Deine Frage …';input.setAttribute('aria-describedby','assistant-privacy');
  const send=el('button',undefined,'ls-chat-send');send.type='submit';send.setAttribute('aria-label','Frage senden');send.append(icon(SEND));
  form.append(label,input,send);
  const note=el('p',undefined,'ls-chat-note');note.id='assistant-privacy';
  chat.append(head,log,form,note);root.append(chat);

  function drawNote(){note.replaceChildren(document.createTextNode(aiConsent?'KI-Antworten aktiv: Fragen werden zur Beantwortung an Cloudflare Workers AI übermittelt. Bitte keine persönlichen Daten eingeben. ':'Bitte keine persönlichen, Gesundheits-, Vertrags- oder Zugangsdaten eingeben. '));const a=el('a','Datenschutz');a.href='/konzept/datenschutz/#assistent';note.append(a);
    aiBtn.textContent=aiConsent?'KI an':'KI aus';aiBtn.setAttribute('aria-pressed',String(!!aiConsent));aiBtn.title=aiConsent?'KI-Antworten ausschalten':'KI-Antworten einschalten';aiBtn.hidden=!AI_AVAILABLE;}
  const scroll=()=>requestAnimationFrame(()=>{log.scrollTop=log.scrollHeight;});
  function topics(ids){const wrap=el('div',undefined,'ls-chat-topics');ids.filter(id=>FAQ[id]).forEach(id=>{const b=el('button',FAQ[id].title,'ls-chat-chip');b.type='button';b.onclick=()=>submit(FAQ[id].title,id);wrap.append(b);});return wrap;}
  function bubble(role,...nodes){const b=el('div',undefined,'ls-msg ls-msg-'+role);b.append(...nodes);return b;}
  function link(id,text){const f=FAQ[id];const a=el('a',text||f.label,'ls-chat-action');a.href=id==='kontakt'||id==='versicherung'?contact:f.href;return a;}
  function contactLink(){const a=el('a','Steven direkt kontaktieren','ls-chat-contact');a.href=contact;return a;}
  // Render one stored message to DOM
  function render(m){
    if(m.role==='user')return bubble('user',el('p',m.text));
    const r=m.result,body=[];
    if(r.kind==='answer'){const f=FAQ[r.id];body.push(el('p',f.title,'ls-msg-title'),el('p',f.text),link(r.id),el('p','Geprüfte Information · Stand '+REVIEWED,'ls-msg-meta'));}
    else if(r.kind==='ai'){body.push(el('p',r.text));const links=el('div',undefined,'ls-chat-links');r.sources.filter(id=>FAQ[id]).forEach(id=>links.append(link(id)));body.push(links,el('p','KI-Antwort aus geprüften LANE-SWITCH-Informationen','ls-msg-meta'));}
    else if(r.kind==='consent'){
      body.push(el('p','Für freie Fragen nutze ich KI. Dazu wird '+(school?'Ihre':'deine')+' Frage an Cloudflare Workers AI übermittelt, auch außerhalb der EU möglich, ohne Chatverlauf. Antworten stützen sich nur auf geprüfte LANE-SWITCH-Informationen.'));
      const row=el('div',undefined,'ls-chat-topics');
      const yes=el('button','Zustimmen & fragen','ls-chat-chip ls-chat-primary');yes.type='button';const no=el('button','Ohne KI fragen','ls-chat-chip');no.type='button';
      const a=el('a','Datenschutz','ls-chat-contact');a.href='/konzept/datenschutz/#assistent';
      if(m.done){row.append(el('span',m.done,'ls-msg-meta'));}else{yes.onclick=()=>decide(m,true);no.onclick=()=>decide(m,false);row.append(yes,no,a);}
      body.push(row);
    }
    else if(r.kind==='info')body.push(el('p',r.text));
    else if(r.kind==='typing'){const t=el('span',undefined,'ls-typing');t.setAttribute('aria-label','Antwort wird geschrieben');t.append(el('i'),el('i'),el('i'));body.push(t);}
    else{
      const text=r.kind==='private'?'Bitte keine persönlichen oder vertraulichen Angaben in den Chat schreiben. Für dieses Anliegen hilft Steven direkt.':
        r.kind==='clarify'?'Worauf bezieht sich die Kostenfrage? Die Kooperation ist kostenfrei; Versicherungen sind ein eigenes, freiwilliges Angebot.':
        r.kind==='unavailable'?'Die KI ist gerade nicht erreichbar oder ihr Tageskontingent ist ausgeschöpft. Diese geprüften Themen helfen vielleicht weiter:':
        r.kind==='suggest'?'Dazu habe ich diese geprüften Themen:':
        r.kind==='unknown'?'Dazu habe ich keine gesicherte Information gefunden, und raten möchte ich nicht. Steven klärt das gern persönlich.':
        'Das klärt Steven am besten persönlich.';
      body.push(el('p',text));if(r.ids?.length)body.push(topics(r.ids));
      if(r.offerAI&&AI_AVAILABLE){const b=el('button','Mit KI beantworten','ls-chat-chip ls-chat-primary');b.type='button';b.onclick=()=>{b.disabled=true;askWithConsent(r.question);};body.push(b);}
      body.push(contactLink());
    }
    return bubble('bot',...body);
  }
  function draw(){log.replaceChildren();
    log.append(bubble('bot',el('p',school?'Hallo! Ich beantworte Fragen rund um LANE SWITCH. Womit kann ich helfen?':'Hallo! Ich beantworte Fragen rund um LANE SWITCH. Womit kann ich dir helfen?'),topics(school?['kosten','kooperation','partner','navigator']:['lernwelt','unfallhelfer','fahrzeugkosten','nachfuehrerschein'])));
    state.messages.forEach(m=>log.append(render(m)));scroll();}
  function push(m){state.messages.push(m);while(state.messages.length>40)state.messages.shift();draw();return m;}
  function replace(m,next){Object.keys(m).forEach(k=>delete m[k]);Object.assign(m,next);draw();}

  async function askAI(question){
    const pending=push({role:'bot',result:{kind:'typing'}});send.disabled=true;
    let result;
    try{
      const response=await fetch('/api/assistent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,consent:true,version:3,audience:school?'school':'learner'}),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)});
      const data=response.ok?await response.json():null;
      if(data?.mode==='answer'&&typeof data.answer==='string'&&data.answer.length<=1200&&Array.isArray(data.sources)&&data.sources.length&&data.sources.every(id=>Object.hasOwn(FAQ,id)))result={kind:'ai',text:data.answer,sources:data.sources};
      else if(data?.mode==='clarify')result={kind:'clarify',ids:['kosten','versicherung']};
      else{const local=classifyLocal(question);result={kind:data?'unknown':'unavailable',ids:local.ids||[]};}
    }catch{const local=classifyLocal(question);result={kind:'unavailable',ids:local.ids||[]};}
    finally{send.disabled=false;}
    replace(pending,{role:'bot',result});
  }
  function localOnly(question,local){
    if(local.kind==='suggest')return {kind:'suggest',ids:local.ids,offerAI:canUseAI(question),question};
    return {kind:'contact',offerAI:canUseAI(question),question};
  }
  function decide(m,agree){aiConsent=agree;m.done=agree?'KI-Antworten eingeschaltet.':'Ohne KI weiter.';drawNote();const q=m.question;
    if(!q){draw();return;}const local=classifyLocal(q);if(agree)askAI(q);else push({role:'bot',result:localOnly(q,local)});}
  function askWithConsent(question){
    if(aiConsent===true)return askAI(question);
    push({role:'bot',result:{kind:'consent'},question});
  }
  function submit(question,id){
    question=question.trim();if(!question)return;
    push({role:'user',text:classifyLocal(question).kind==='private'?'[Vertrauliche Eingabe nicht übernommen]':question});
    state.draft='';input.value='';
    if(id)return push({role:'bot',result:{kind:'answer',id}});
    const local=classifyLocal(question);
    if(['private','clarify','answer'].includes(local.kind))return push({role:'bot',result:local});
    if(AI_AVAILABLE&&canUseAI(question)){
      if(aiConsent===true)return askAI(question);
      if(aiConsent===undefined)return push({role:'bot',result:{kind:'consent'},question});
    }
    push({role:'bot',result:localOnly(question,local)});
  }
  aiBtn.onclick=()=>{
    if(aiConsent){aiConsent=false;drawNote();push({role:'bot',result:{kind:'info',text:'KI-Antworten sind ausgeschaltet. Ich antworte jetzt nur noch mit geprüften Standardtexten.'}});}
    else push({role:'bot',result:{kind:'consent'},question:''});
  };
  input.addEventListener('input',()=>state.draft=input.value);
  form.addEventListener('submit',e=>{e.preventDefault();submit(input.value);input.focus({preventScroll:true});});
  reset.onclick=()=>{state.messages=[];state.draft='';input.value='';draw();input.focus();};
  drawNote();draw();
  // Fit the chat to the visible area so the page itself does not scroll; the log scrolls inside.
  if(window.scrollY>0)window.scrollTo({top:0});
  fit=()=>{if(!chat.isConnected){removeEventListener('resize',fit);removeEventListener('hashchange',fit);visualViewport?.removeEventListener('resize',fit);document.documentElement.classList.remove('ls-chat-open');return}
    const nav=document.querySelector('.bottom-nav'),bar=document.querySelector('.topbar');
    const mobile=nav&&getComputedStyle(nav).display!=='none';
    document.documentElement.classList.toggle('ls-chat-open',!!mobile);
    if(mobile){
      // Phone: fill the whole space between top bar and bottom navigation, like a chat app.
      const top=Math.max(0,bar?bar.getBoundingClientRect().bottom:0),vh=window.visualViewport?.height||innerHeight;
      const bottom=Math.max(0,innerHeight-nav.getBoundingClientRect().top);
      chat.style.top=(top+8)+'px';chat.style.bottom=(vh<innerHeight-120?innerHeight-vh+8:bottom+8)+'px';chat.style.height='auto';
    }else{
      chat.style.top=chat.style.bottom='';
      const top=chat.getBoundingClientRect().top+window.scrollY;chat.style.height=Math.max(480,Math.min(900,innerHeight-top-24))+'px';
    }
    scroll();};
  if(lastFit){removeEventListener('resize',lastFit);visualViewport?.removeEventListener('resize',lastFit);}lastFit=fit;addEventListener('resize',fit);addEventListener('hashchange',()=>setTimeout(fit,50));visualViewport?.addEventListener('resize',fit);requestAnimationFrame(fit);setTimeout(fit,400);
}
let fit,lastFit;
