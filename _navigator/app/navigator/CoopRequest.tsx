'use client';
import {useState} from 'react';

// Kooperationsanfrage für Fahrschulen, die noch keinen Partnerzugang haben.
// Es entsteht kein Konto: LANE SWITCH meldet sich und verschickt bei Interesse einen Einladungslink.
export default function CoopRequest({onLogin}:{onLogin:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');const f=new FormData(e.currentTarget);
  if(!f.get('consent')){setError('Bitte bestätige die Datenschutzhinweise.');return}
  setBusy(true);
  try{
   const r=await fetch('/api/navigator',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'requestCooperation',school:f.get('school'),contact:f.get('contact'),email:f.get('email'),phone:f.get('phone'),city:f.get('city'),message:f.get('message'),website:f.get('website'),consent:true})});
   const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.');
   setSent(true);
  }catch(err){setError(err instanceof Error?err.message:'Verbindung fehlgeschlagen.')}finally{setBusy(false)}
 }
 if(sent)return <div className="nv-card nv-request-done" role="status"><h2>Danke für deine Anfrage!</h2><p>Deine Anfrage ist bei LANE SWITCH angekommen. Steven meldet sich persönlich bei dir, in der Regel innerhalb weniger Werktage.</p><p>Passt die Kooperation, bekommst du einen persönlichen Einladungslink. Damit legst du Benutzername und Passwort selbst fest und richtest direkt deinen Navigator ein.</p><button type="button" className="nv-secondary" onClick={onLogin}>Zur Anmeldung</button></div>;
 return <form className="nv-card nv-request" onSubmit={submit} noValidate={false}>
  <h2>Kooperation anfragen</h2>
  <p>Deine Fahrschule ist noch kein Partner? Erzähl uns kurz, wer ihr seid. Wir melden uns persönlich und schicken dir bei Interesse einen Einladungslink für deinen Zugang.</p>
  <label className="nv-field">Name der Fahrschule<input name="school" autoComplete="organization" minLength={3} maxLength={120} required/></label>
  <label className="nv-field">Ansprechperson<input name="contact" autoComplete="name" minLength={2} maxLength={120} required/></label>
  <label className="nv-field">E-Mail<input name="email" type="email" autoComplete="email" maxLength={160} required/></label>
  <label className="nv-field">Telefon <span className="nv-optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} pattern="[+0-9 ()/\-]{5,40}"/></label>
  <label className="nv-field">Ort <span className="nv-optional">(optional)</span><input name="city" autoComplete="address-level2" maxLength={80}/></label>
  <label className="nv-field">Nachricht <span className="nv-optional">(optional)</span><textarea name="message" rows={3} maxLength={1500} placeholder="z. B. Standorte, Führerscheinklassen oder was dich an LANE SWITCH interessiert"/></label>
  {/* Unsichtbare Falle für automatisierte Einsendungen. */}
  <label className="nv-hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  <label className="nv-check"><input type="checkbox" name="consent" required/><span>Ich habe die <a href="https://laneswitch.de/datenschutz/#kooperationsanfrage" target="_blank" rel="noopener noreferrer">Datenschutzhinweise</a> gelesen. LANE SWITCH speichert meine Angaben, um die Anfrage zu bearbeiten und mich zu kontaktieren.</span></label>
  <button disabled={busy} type="submit">{busy?'Wird gesendet …':'Anfrage senden →'}</button>
  <p className="nv-muted">Unverbindlich. Mit der Anfrage entsteht noch kein Zugang und keine Verpflichtung.</p>
  {error&&<p role="alert" className="nv-alert nv-alert-warn">{error}</p>}
 </form>;
}
