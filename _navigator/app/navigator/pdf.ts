import {normal,bold} from './pdf-font';
import type {NavData} from './Navigator';
const groups=[['registration','Deine Anmeldung'],['training','Deine Ausbildung'],['exam','Vor deiner Prüfung'],['after','Nach deiner Prüfung']] as const;
function lines(s:string){return s.split('\n').map(x=>x.trim()).filter(Boolean)}
export async function buildPDF(data:NavData,school:string,published:boolean,qr:string,origin:string){
const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'mm',format:'a4'});doc.addFileToVFS('Navigator.ttf',normal);doc.addFont('Navigator.ttf','Navigator','normal');doc.addFileToVFS('Navigator-Bold.ttf',bold);doc.addFont('Navigator-Bold.ttf','Navigator','bold');doc.setFont('Navigator','normal');const W=210,margin=22,wide=166;let y=30;
 const text=(s:string,size=10,color='#153a53')=>{doc.setFontSize(size);doc.setTextColor(color);const l=doc.splitTextToSize(s,wide);for(const line of l){if(y>264){doc.addPage();y=28}doc.text(line,margin,y);y+=size*.48}y+=3};
 const heading=(s:string)=>{if(y>240){doc.addPage();y=28}y+=7;doc.setDrawColor('#00b6c6');doc.setLineWidth(.7);doc.line(margin,y,margin+12,y);y+=10;doc.setFont('Navigator','bold');text(s,17);doc.setFont('Navigator','normal')};
 doc.setFillColor('#eff6f7');doc.rect(0,0,W,297,'F');doc.setFillColor('#00b6c6');doc.rect(margin,27,14,2,'F');
 if(data.logo){try{const info=doc.getImageProperties(data.logo);const scale=Math.min(35/info.width,16/info.height);const logoW=info.width*scale,logoH=info.height*scale;doc.setFillColor('#ffffff');doc.setDrawColor('#d7e5e8');doc.setLineWidth(.2);doc.roundedRect(145,21,43,24,1.5,1.5,'FD');doc.addImage(data.logo,'PNG',145+(43-logoW)/2,21+(24-logoH)/2,logoW,logoH,undefined,'FAST')}catch{}}
 if(!published){doc.setFontSize(9);doc.setTextColor('#60798a');doc.text('ENTWURF · NICHT ALS ONLINE-AUSGABE FREIGEGEBEN',margin,48)}y=65;doc.setFont('Navigator','bold');text('DEIN FAHRSCHUL-',25);text('NAVIGATOR',25);y+=9;text(data.name||'Deine Fahrschule',19);doc.setFont('Navigator','normal');text(data.tagline,12,'#60798a');y+=12;text('Alles Wichtige für deinen Weg zum Führerschein.',12);if(data.classes)text('Führerscheinklassen: '+data.classes,11);y=178;text(data.address);text([data.phone,data.email].filter(Boolean).join(' | '));if(data.website)text(data.website);if(published&&qr){doc.addImage(qr,'PNG',margin,222,32,32);doc.setFontSize(9);doc.text('Aktuelle Online-Ausgabe',62,234);doc.text(origin+'/navigator/'+school,62,240,{maxWidth:122})}doc.setFontSize(9);doc.text('In Kooperation mit LANE SWITCH',margin,272);
 doc.addPage();y=28;heading('Dein direkter Kontakt');text(data.name||'Deine Fahrschule',13);if(data.address)text(data.address);if(data.hours)text('Erreichbarkeit: '+data.hours);if(data.phone)text('Telefon: '+data.phone);if(data.email)text('E-Mail: '+data.email);
 for(const [key,title] of groups){if(!data[key])continue;heading(title);for(const line of lines(data[key])){if(y>260){doc.addPage();y=28}doc.setDrawColor('#a6bfc6');doc.rect(margin,y-3,2.5,2.5);const ll=doc.splitTextToSize(line,wide-7);doc.setFontSize(10);doc.setTextColor('#153a53');for(let i=0;i<ll.length;i++){if(y>264){doc.addPage();y=28}doc.text(ll[i],margin+7,y);y+=5}y+=3}}
 if(data.prices.length){heading('Deine Kosten im Überblick');if(data.priceDate)text('Preisstand: '+data.priceDate,9,'#60798a');for(const p of data.prices){doc.setFontSize(10);const label=doc.splitTextToSize(p.label,90),value=doc.splitTextToSize(p.amount+(p.unit?' / '+p.unit:''),55);const height=Math.max(label.length,value.length)*5+8;if(y+height>264){doc.addPage();y=28}doc.setFillColor('#eff6f7');doc.rect(margin,y-5,wide,height,'F');doc.text(label,margin+4,y);doc.text(value,W-margin-4,y,{align:'right'});y+=height+4}text('Der individuelle Gesamtpreis hängt vom Ausbildungsumfang ab. Maßgeblich sind die Vereinbarungen mit deiner Fahrschule.',9,'#60798a')}
 if(data.documents.length){heading('Deine Unterlagen');for(const f of data.documents){text(f.name);if(published){doc.setTextColor('#0a5d84');doc.textWithLink('Unterlage online öffnen',margin,y,{url:origin+'/api/navigator?action=file&id='+encodeURIComponent(f.id)+'&school='+school});y+=9}}}
 if(data.notice){heading('Gut zu wissen');text(data.notice)}
 for(let p=1;p<=doc.getNumberOfPages();p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor('#60798a');doc.text('LANE SWITCH · '+(data.name||'Fahrschul-Navigator'),margin,286);doc.text(p+' / '+doc.getNumberOfPages(),188,286,{align:'right'})}
return doc;
}

// Demo-Ausgabe: auf jeder Seite ein deutliches Wasserzeichen und ein Hinweis, dass es sich um ein Muster handelt.
export function watermark(doc:any){
 const pages=doc.getNumberOfPages();
 for(let p=1;p<=pages;p++){
  doc.setPage(p);
  let faded=false;try{doc.saveGraphicsState();doc.setGState(new doc.GState({opacity:0.13}));faded=true;}catch{}
  doc.setFont('Navigator','bold');doc.setTextColor(faded?'#06496f':'#dbe7eb');
  doc.setFontSize(96);doc.text('MUSTER',38,215,{angle:35});
  doc.setFontSize(20);doc.text('LANE SWITCH Demo · nur zur Ansicht',62,236,{angle:35});
  if(faded){try{doc.restoreGraphicsState();}catch{}}
  doc.setFont('Navigator','bold');doc.setFontSize(8);doc.setTextColor('#b4233c');
  doc.text('MUSTER aus der Demo – nicht zur Weitergabe. Die eigene PDF-Ausgabe gibt es mit dem Partnerzugang.',105,293,{align:'center'});
 }
 return doc;
}
