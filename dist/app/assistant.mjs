import {FAQ,REVIEWED,AI_AVAILABLE,classifyLocal} from './assistant-knowledge.mjs?v=1';
const states={school:{messages:[],draft:''},learner:{messages:[],draft:''}};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function mountAssistant(root,audience){
  const school=audience==='school',state=states[school?'school':'learner'];
  const contact=school?'#kontakt':'/?zielgruppe=learner#kontakt';
  root.replaceChildren();root.className='ls-assistant';
  const intro=el('section',undefined,'ls-assistant-intro');intro.append(el('p','FAQ-Assistent · geprüfte Informationen','eyebrow'),el('h1','Fragen zu LANE SWITCH?'),el('p',school?'Antworten zu Kooperation, Kosten und Partnerzugang. Für individuelle Anliegen ist Steven persönlich da.':'Antworten zu Lernangeboten und LANE SWITCH. Für persönliche Fragen ist Steven da.'));root.append(intro);
  const prompts=el('div',undefined,'ls-assistant-prompts');prompts.setAttribute('aria-label','Häufige Fragen');
  const log=el('div',undefined,'ls-assistant-log');log.setAttribute('role','log');log.setAttribute('aria-label','Fragen und Antworten');log.setAttribute('aria-live','polite');log.setAttribute('aria-relevant','additions');
  const form=el('form',undefined,'ls-assistant-form'),label=el('label',school?'Ihre Frage':'Deine Frage');label.htmlFor='assistant-question';
  const input=el('input');input.id='assistant-question';input.name='question';input.maxLength=300;input.required=true;input.autocomplete='off';input.value=state.draft;input.placeholder='Zum Beispiel: Was kostet die Kooperation?';input.setAttribute('aria-describedby','assistant-privacy');
  const row=el('div',undefined,'ls-assistant-inputrow'),send=el('button','Frage stellen','primary');send.type='submit';row.append(input,send);form.append(label,row);
  const note=el('p',school?'Bitte keine persönlichen, Gesundheits-, Vertrags- oder Zugangsdaten eingeben. Fragen bleiben in dieser geöffneten Seite und werden beim Neuladen gelöscht.':'Bitte keine persönlichen, Gesundheits-, Vertrags- oder Zugangsdaten eingeben. Fragen bleiben in dieser geöffneten Seite und werden beim Neuladen gelöscht.','ls-assistant-note');note.id='assistant-privacy';
  const privacy=el('a','Datenschutz');privacy.href='/konzept/datenschutz/#assistent';note.append(' ',privacy);
  const reset=el('button','Verlauf löschen','ls-assistant-reset');reset.type='button';
  const status=el('p','', 'ls-assistant-note');status.setAttribute('role','status');
  let consent;
  if(AI_AVAILABLE){const l=el('label',undefined,'ls-assistant-optin');consent=el('input');consent.type='checkbox';l.append(consent,document.createTextNode('Optional: Zur Themensuche diese Frage an Cloudflare Workers AI übermitteln. Keine Speicherung des Chatverlaufs durch LANE SWITCH. Widerruf durch Abwählen; FAQ bleiben verfügbar.'));form.append(l);}
  function button(id){const b=el('button',FAQ[id].title,'ls-assistant-topic');b.type='button';b.onclick=()=>ask(FAQ[id].title,id);return b;}
  (school?['kosten','kooperation','partner','navigator']:['lernwelt','navigator','versicherung','kontakt']).forEach(id=>prompts.append(button(id)));
  function draw(m){
    const article=el('article',undefined,'ls-assistant-exchange');article.append(el('p',m.question,'ls-assistant-question'));
    const answer=el('div',undefined,'ls-assistant-answer');
    if(m.result.kind==='answer'){
      const f=FAQ[m.result.id];answer.append(el('h2',f.title),el('p',f.text));
      const a=el('a',f.label,'ls-assistant-action');a.href=m.result.id==='kontakt'||m.result.id==='versicherung'?contact:f.href;answer.append(a,el('p','Grundlage: '+f.source+' · geprüft am '+REVIEWED,'ls-assistant-note'));
    }else{
      const type=m.result.kind;
      const text=type==='clarify'?'Worauf bezieht sich die Kostenfrage? Die kostenfreie Kooperation und kostenpflichtige Versicherungen sind unterschiedliche Angebote.':type==='suggest'?'Dazu gibt es folgende geprüfte Informationen. Welches Thema ist gemeint?':type==='private'?'Bitte keine persönlichen oder vertraulichen Angaben in den Assistenten eingeben. Für dieses Anliegen bitte direkt mit Steven Kontakt aufnehmen.':'Dazu liegt keine ausreichend gesicherte Standardantwort vor. Diese konkrete Frage klärt Steven persönlich.';
      answer.append(el('p',text));if(m.result.ids){const choices=el('div',undefined,'ls-assistant-prompts');m.result.ids.filter(id=>FAQ[id]).forEach(id=>choices.append(button(id)));answer.append(choices);}
    }
    const c=el('a','Zum Kontaktformular','ls-assistant-contact');c.href=contact;answer.append(c);article.append(answer);log.append(article);
  }
  async function ask(question,id){
    let result=id?{kind:'answer',id}:classifyLocal(question);if(result.kind==='empty')return;
    // No arbitrary model output is rendered; AI may only suggest known FAQ IDs.
    if(AI_AVAILABLE&&consent?.checked&&!id&&result.kind==='contact'){
      send.disabled=true;status.textContent='Passende Themen werden gesucht …';
      try{const response=await fetch('/api/assistent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question}),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)});if(response.ok){const data=await response.json();const ids=Array.isArray(data.ids)?data.ids.filter(id=>Object.hasOwn(FAQ,id)).slice(0,3):[];if(ids.length)result={kind:'suggest',ids};}}catch{/* Safe contact fallback on quota, timeout, or network error. */}finally{send.disabled=false;status.textContent='';}
    }
    const safeQuestion=result.kind==='private'?'[Vertrauliche Eingabe nicht im Verlauf übernommen]':question;
    const m={question:safeQuestion,result};state.messages.push(m);if(state.messages.length>12)state.messages.shift();log.replaceChildren();state.messages.forEach(draw);state.draft='';input.value='';input.focus({preventScroll:true});
  }
  input.addEventListener('input',()=>state.draft=input.value);
  form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(q)ask(q);});
  reset.onclick=()=>{state.messages=[];state.draft='';input.value='';log.replaceChildren();status.textContent='Verlauf gelöscht.';input.focus();};
  root.append(prompts,log,form,note,reset,status);state.messages.forEach(draw);
}
