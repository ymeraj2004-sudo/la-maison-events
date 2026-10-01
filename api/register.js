
const AIRTABLE_API="https://api.airtable.com/v0";
function sendJson(res,status,body){res.status(status);res.setHeader("Content-Type","application/json; charset=utf-8");return res.end(JSON.stringify(body))}
function cleanPhone(v=""){return String(v).replace(/[^\d+]/g,"").trim()}
function cleanInstagram(v=""){return String(v).trim().replace(/^@+/,"")}
async function airtableRequest(path,options={}){
  const token=process.env.AIRTABLE_TOKEN;if(!token)throw new Error("AIRTABLE_TOKEN missing");
  const response=await fetch(`${AIRTABLE_API}/${path}`,{...options,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(options.headers||{})}});
  const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{}
  if(!response.ok)throw new Error(data?.error?.message||`Airtable error ${response.status}`);return data
}
export default async function handler(req,res){
  if(req.method!=="POST")return sendJson(res,405,{ok:false,error:"Metodo non consentito."});
  try{
    const baseId=process.env.AIRTABLE_BASE_ID,tableId=process.env.AIRTABLE_TABLE_ID;
    if(!baseId||!tableId)return sendJson(res,500,{ok:false,error:"Configurazione server incompleta."});
    const closeAt=new Date("2026-10-25T00:00:00+02:00");
    if(new Date()>=closeAt)return sendJson(res,403,{ok:false,code:"CLOSED",error:"Le iscrizioni sono chiuse."});

    const b=req.body||{};
    const nome=String(b.nome||"").trim(),cognome=String(b.cognome||"").trim(),telefono=cleanPhone(b.telefono||""),
      email=String(b.email||"").trim().toLowerCase(),instagram=cleanInstagram(b.instagram||""),
      tipo=String(b.tipo_iscrizione||"").trim(),gruppo=String(b.componenti_gruppo||"").trim(),
      gruppoOk=b.conferma_gruppo_donne===true||b.conferma_gruppo_donne==="on"||b.conferma_gruppo_donne==="true",
      maggiorenne=String(b.maggiorenne||"").trim(),accompagnatore=String(b.accompagnatore_maggiorenne||"").trim(),
      minoreOk=b.conferma_minore===true||b.conferma_minore==="on"||b.conferma_minore==="true",
      privacy=b.privacy===true||b.privacy==="on"||b.privacy==="true";

    if(!nome||!cognome||!telefono||!email||!instagram||!tipo||!maggiorenne||!privacy)
      return sendJson(res,400,{ok:false,error:"Compila tutti i campi obbligatori."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return sendJson(res,400,{ok:false,error:"Inserisci un indirizzo email valido."});
    if(!["Singola","Gruppo donne"].includes(tipo))
      return sendJson(res,400,{ok:false,error:"Tipo di iscrizione non valido."});
    if(tipo==="Gruppo donne"&&(!gruppo||!gruppoOk))
      return sendJson(res,400,{ok:false,error:"Per il gruppo donne inserisci i nominativi e conferma che il gruppo è composto da donne."});
    if(!["Sì","No"].includes(maggiorenne))
      return sendJson(res,400,{ok:false,error:"Seleziona correttamente la fascia di età."});
    if(maggiorenne==="No"&&(!accompagnatore||!minoreOk))
      return sendJson(res,400,{ok:false,error:"Per un minorenne è necessario indicare un accompagnatore maggiorenne."});

    const safeEmail=email.replace(/'/g,"\\'"),safePhone=telefono.replace(/'/g,"\\'");
    const duplicateFormula=encodeURIComponent(`OR(LOWER({Email})='${safeEmail}', {Telefono}='${safePhone}')`);
    const duplicates=await airtableRequest(`${baseId}/${tableId}?maxRecords=1&filterByFormula=${duplicateFormula}`);
    if((duplicates.records||[]).length>0)
      return sendJson(res,409,{ok:false,code:"DUPLICATE",error:"Risulta già una richiesta associata a questa email o a questo numero."});

    const payload={records:[{fields:{
      "Nome completo":`${nome} ${cognome}`,"Nome":nome,"Cognome":cognome,"Telefono":telefono,"Email":email,
      "Instagram":`@${instagram}`,"Tipo iscrizione":tipo,"Componenti gruppo":tipo==="Gruppo donne"?gruppo:"",
      "Maggiorenne":maggiorenne,"Accompagnatore maggiorenne":maggiorenne==="No"?accompagnatore:"",
      "Stato":"In attesa","18+ confermato":maggiorenne==="Sì","Privacy accettata":true,
      "Note":maggiorenne==="No"?"Richiesta minorenne: accesso richiesto con accompagnatore maggiorenne.":"Richiesta ricevuta dal sito LA MAISON"
    }}]};
    const created=await airtableRequest(`${baseId}/${tableId}`,{method:"POST",body:JSON.stringify(payload)});
    return sendJson(res,200,{ok:true,recordId:created?.records?.[0]?.id||null,status:"In attesa",message:"Richiesta ricevuta correttamente."});
  }catch(err){console.error(err);return sendJson(res,500,{ok:false,error:"Errore temporaneo. Riprova tra poco."})}
}
