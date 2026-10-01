
(function(){
  const deadline = new Date('2026-10-25T00:00:00+02:00').getTime();
  const ids = ['d','h','m','s'];
  function tick(){
    const left=Math.max(0,deadline-Date.now());
    const vals=[Math.floor(left/86400000),Math.floor((left%86400000)/3600000),Math.floor((left%3600000)/60000),Math.floor((left%60000)/1000)];
    ids.forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=String(vals[i]).padStart(2,'0')});
  }
  tick();setInterval(tick,1000);

  const canvas=document.getElementById('particles');
  if(canvas){
    const ctx=canvas.getContext('2d');let pts=[];
    function resize(){canvas.width=innerWidth;canvas.height=innerHeight;pts=Array.from({length:55},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.8+.3,v:Math.random()*.25+.08,a:Math.random()*.45+.08}))}
    function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);pts.forEach(p=>{p.y-=p.v;if(p.y<-5){p.y=canvas.height+5;p.x=Math.random()*canvas.width}ctx.beginPath();ctx.fillStyle=`rgba(255,95,63,${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(draw)}
    addEventListener('resize',resize);resize();draw();
  }

  const typeSelect=document.getElementById('tipo_iscrizione');
  const groupFields=document.getElementById('groupFields');
  const ageSelect=document.getElementById('maggiorenne');
  const minorFields=document.getElementById('minorFields');

  function syncConditionalFields(){
    if(typeSelect&&groupFields) groupFields.hidden=typeSelect.value!=='Gruppo donne';
    if(ageSelect&&minorFields) minorFields.hidden=ageSelect.value!=='No';
  }
  if(typeSelect)typeSelect.addEventListener('change',syncConditionalFields);
  if(ageSelect)ageSelect.addEventListener('change',syncConditionalFields);
  syncConditionalFields();

  const form=document.getElementById('inviteForm');
  if(form){
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const btn=document.getElementById('submitBtn');
      const msg=document.getElementById('formMessage');
      const fd=new FormData(form);
      const payload={
        nome:fd.get('nome'),cognome:fd.get('cognome'),telefono:fd.get('telefono'),
        email:fd.get('email'),instagram:fd.get('instagram'),
        tipo_iscrizione:fd.get('tipo_iscrizione'),
        componenti_gruppo:fd.get('componenti_gruppo')||'',
        conferma_gruppo_donne:fd.get('conferma_gruppo_donne')==='on',
        maggiorenne:fd.get('maggiorenne'),
        accompagnatore_maggiorenne:fd.get('accompagnatore_maggiorenne')||'',
        conferma_minore:fd.get('conferma_minore')==='on',
        privacy:fd.get('privacy')==='on'
      };

      btn.disabled=true;btn.textContent='INVIO IN CORSO...';msg.className='form-message';msg.textContent='';
      try{
        const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const data=await r.json();
        if(!r.ok)throw new Error(data.error||'Invio non riuscito.');
        window.location.href='conferma.html';
      }catch(err){
        msg.className='form-message error';msg.textContent=err.message||'Invio non riuscito. Riprova tra poco.';
        btn.disabled=false;btn.textContent='INVIA RICHIESTA';
      }
    });
  }

  const enterScreen=document.getElementById('enterScreen');
  const enterBtn=document.getElementById('enterBtn');
  const spotifyClose=document.getElementById('spotifyClose');
  const spotifyOpen=document.getElementById('spotifyOpen');

  function showSpotify(){
    const spotifyDock=document.getElementById('spotifyDock');
    const spotifyOpenBtn=document.getElementById('spotifyOpen');
    if(spotifyDock) spotifyDock.classList.remove('is-hidden');
    if(spotifyOpenBtn) spotifyOpenBtn.classList.add('is-hidden');
  }

  function hideSpotify(){
    const spotifyDock=document.getElementById('spotifyDock');
    const spotifyOpenBtn=document.getElementById('spotifyOpen');
    if(spotifyDock) spotifyDock.classList.add('is-hidden');
    if(spotifyOpenBtn) spotifyOpenBtn.classList.remove('is-hidden');
  }

  if(enterBtn){
    enterBtn.addEventListener('click',()=>{
      if(enterScreen) enterScreen.classList.add('is-hidden');
      showSpotify();
    });
  }

  if(spotifyClose) spotifyClose.addEventListener('click',hideSpotify);
  if(spotifyOpen) spotifyOpen.addEventListener('click',showSpotify);

})();
