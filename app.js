/* SpeedType — client-side multiplayer via Supabase Realtime.
   Configure SUPABASE_URL and SUPABASE_ANON_KEY below before publishing. */
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const $ = id => document.getElementById(id);
const views = ["homeView","lobbyView","raceView","resultsView"];
const texts = {
 easy: [
  "Small steps every day can lead to big changes. Keep your focus, trust your pace, and enjoy the progress you make.",
  "A good idea becomes great when you give it time, patience, and a little bit of courage."
 ],
 medium: [
  "The future belongs to curious minds. Learn something new, challenge your limits, and turn every small victory into momentum.",
  "Speed is useful, but precision makes the difference. Stay calm, find your rhythm, and let your fingers do the talking.",
  "Great things are built one keystroke at a time. Focus on the next word, keep your confidence high, and never stop improving."
 ],
 hard: [
  "Quantum computers, autonomous systems, and real-time networks are reshaping technology; adaptability is the ultimate competitive advantage.",
  "Precision under pressure requires deliberate practice, consistent feedback, and the discipline to correct mistakes before they become habits."
 ]
};
let client=null, channel=null, roomCode=null, playerId=null, playerName="", isHost=false;
let players={}, raceText="", raceStartAt=0, raceStarted=false, raceFinished=false, localFinishedAt=null, startTimer=null, ticker=null, soundOn=true;
const configured = !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_") && window.supabase;

function showView(id){views.forEach(v=>$(v).classList.toggle("hidden",v!==id));window.scrollTo({top:0,behavior:"smooth"});}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2800);}
function makeId(){return (crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2))+"";}
function makeCode(){return Math.random().toString(36).slice(2,8).toUpperCase();}
function cleanName(s){return s.trim().replace(/[<>]/g,"").slice(0,18);}
function setConnection(ok){$("connectionLabel").textContent=ok?"Live verbunden":"Verbindung getrennt";}
function updatePlayers(){const list=Object.values(players).sort((a,b)=>a.joinedAt-b.joinedAt);$("playerCount").textContent=`${list.length} / 10`;$("lobbyPlayerStat").innerHTML=`${list.length}<span>/10</span>`;$("playersList").innerHTML=list.map((p,i)=>`<div class="player-chip"><span class="avatar">${escapeHtml(p.name[0]?.toUpperCase()||"?")}</span><b>${escapeHtml(p.name)}${p.id===playerId?" (Du)":""}</b><small>${p.id===hostId?"HOST":"● ONLINE"}</small></div>`).join("");$("startRaceBtn").disabled=!isHost||list.length<1;}
let hostId=null;
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function playerSnapshot(){return {id:playerId,name:playerName,joinedAt:Date.now(),progress:0,wpm:0,accuracy:100,finished:false};}
async function connectRoom(code, name, host=false){
 if(!configured){toast("Bitte zuerst Supabase in app.js konfigurieren. Siehe README.");return;}
 if(!name){toast("Bitte gib einen Spielernamen ein.");return;}
 if(channel){await client.removeChannel(channel);channel=null;}
 client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
 roomCode=code;playerName=cleanName(name);playerId=makeId();isHost=host;hostId=host?playerId:null;players={};raceStarted=false;raceFinished=false;localFinishedAt=null;
 $("displayRoomCode").textContent=code;$("raceRoomCode").textContent=code;$("hostControls").classList.toggle("hidden",!host);
 $("inviteUrl").textContent=location.href.split("?")[0]+"?room="+code;
 showView("lobbyView");
 channel=client.channel("speedtype:"+code,{config:{presence:{key:playerId},broadcast:{self:false}}});
 channel.on("presence",{event:"sync"},()=>{const state=channel.presenceState();const next={};Object.values(state).flat().forEach(p=>{if(p?.id)next[p.id]=p;});players=next;if(!hostId){const first=Object.values(players).sort((a,b)=>a.joinedAt-b.joinedAt)[0];if(first)hostId=first.id;}updatePlayers();});
 channel.on("broadcast",{event:"race-start"},({payload})=>{if(payload?.room===roomCode)beginRace(payload.text,payload.startAt,false);});
 channel.on("broadcast",{event:"progress"},({payload})=>{if(payload?.room===roomCode&&payload.player){players[payload.player.id]={...(players[payload.player.id]||{}),...payload.player};if(raceStarted)renderRaceBoard();}});
 channel.on("broadcast",{event:"race-finish"},({payload})=>{if(payload?.room===roomCode&&payload.player){players[payload.player.id]={...(players[payload.player.id]||{}),...payload.player,finished:true};renderRaceBoard();maybeShowResults();}});
 channel.on("broadcast",{event:"race-reset"},({payload})=>{if(payload?.room===roomCode){raceStarted=false;raceFinished=false;localFinishedAt=null;players={};showView("lobbyView");toast("Neue Runde! Alle sind wieder in der Lobby.");}});
 const status=await channel.subscribe(async status=>{if(status==="SUBSCRIBED"){setConnection(true);await channel.track(playerSnapshot());toast(host?"Lobby erstellt! Teile den Code mit deinen Freunden.":"Du bist der Lobby beigetreten!");}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){setConnection(false);toast("Verbindung fehlgeschlagen. Prüfe Supabase und den Raumcode.");}});
}
async function send(event,payload){if(channel)await channel.send({type:"broadcast",event,payload:{room:roomCode,...payload}});}
function chooseText(level){const arr=texts[level]||texts.medium;return arr[Math.floor(Math.random()*arr.length)];}
async function startRace(){if(!isHost)return;const text=chooseText($("difficulty").value);const startAt=Date.now()+4000;await send("race-start",{text,startAt});beginRace(text,startAt,true);}
function beginRace(text,startAt,hostTriggered){raceText=text;raceStartAt=startAt;raceStarted=true;raceFinished=false;localFinishedAt=null;players=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p,progress:0,wpm:0,accuracy:100,finished:false}]));$("typingInput").value="";$("typingInput").disabled=true;$("typingInput").placeholder="Bereit machen …";$("typingText").innerHTML=[...text].map((c,i)=>`<span class="pending" data-i="${i}">${escapeHtml(c)}</span>`).join("");$("countdown").classList.remove("hidden");showView("raceView");renderRaceBoard();let n=Math.max(1,Math.ceil((startAt-Date.now())/1000));$("countdown").textContent=n;clearInterval(startTimer);startTimer=setInterval(()=>{n=Math.ceil((startAt-Date.now())/1000);if(n<=0){clearInterval(startTimer);$("countdown").classList.add("hidden");$("typingInput").disabled=false;$("typingInput").placeholder="Los geht's — tippe den Text ab!";$("typingInput").focus({preventScroll:true});$("typingInput").scrollIntoView({block:"center",behavior:"smooth"});if(!ticker)ticker=setInterval(updateTimer,250);updateTimer();}else $("countdown").textContent=n;},100);}
function updateTimer(){if(!raceStarted||raceFinished)return;const sec=Math.max(0,(Date.now()-raceStartAt)/1000);$("raceTimer").textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(Math.floor(sec%60)).padStart(2,"0")}`;}
function calculate(value){let correct=0;for(let i=0;i<Math.min(value.length,raceText.length);i++)if(value[i]===raceText[i])correct++;const elapsed=Math.max(1,(Date.now()-raceStartAt)/60000);const wpm=Math.round((correct/5)/elapsed);const accuracy=value.length?Math.round(correct/value.length*100):100;return {correct,wpm,accuracy,progress:Math.min(100,Math.round(correct/raceText.length*100))};}
let broadcastThrottle=0;
$("typingInput").addEventListener("input",async e=>{if(!raceStarted||raceFinished)return;const value=e.target.value.slice(0,raceText.length);if(value!==e.target.value)e.target.value=value;const s=calculate(value);$("liveWpm").textContent=s.wpm;$("liveAccuracy").textContent=s.accuracy+"%";$("liveChars").textContent=value.length;$("myProgressLabel").textContent=s.progress+"%";$("myProgressBar").style.width=s.progress+"%";[...$("typingText").querySelectorAll("span")].forEach((span,i)=>{span.className=i<value.length?(value[i]===raceText[i]?"correct":"incorrect"):(i===value.length?"current":"pending");});const me={...(players[playerId]||playerSnapshot()),progress:s.progress,wpm:s.wpm,accuracy:s.accuracy,finished:false};players[playerId]=me;renderRaceBoard();if(Date.now()-broadcastThrottle>180){broadcastThrottle=Date.now();send("progress",{player:me});}if(value.length>=raceText.length){finishRace(me);}});
async function finishRace(me){if(localFinishedAt)return;localFinishedAt=Date.now();raceFinished=true;const final={...me,finished:true,finishTime:localFinishedAt,progress:100};players[playerId]=final;$("typingInput").disabled=true;await send("race-finish",{player:final});renderRaceBoard();maybeShowResults();}
function renderRaceBoard(){const list=Object.values(players).sort((a,b)=>(b.progress||0)-(a.progress||0)||(b.wpm||0)-(a.wpm||0));$("raceLeaderboard").innerHTML=list.map((p,i)=>`<div class="rank-row"><span class="rank-num">${i+1}</span><span class="rank-name">${escapeHtml(p.name||"Spieler")}${p.id===playerId?" (Du)":""}</span><span class="rank-detail">${p.finished?"FINISH":(p.wpm||0)+" WPM"}<small>${p.progress||0}%</small></span></div>`).join("")||'<p class="muted">Warte auf Spieler …</p>';}
function maybeShowResults(){const list=Object.values(players);if(list.length&&list.every(p=>p.finished)){clearInterval(ticker);ticker=null;const sorted=list.sort((a,b)=>(a.finishTime||Infinity)-(b.finishTime||Infinity));const winner=sorted[0];$("winnerName").textContent=winner.name;$("winnerWpm").innerHTML=`${winner.wpm||0} <small>WPM</small>`;$("finalLeaderboard").innerHTML=sorted.map((p,i)=>`<div class="rank-row"><span class="rank-num">${["🥇","🥈","🥉"][i]||i+1}</span><span class="rank-name">${escapeHtml(p.name)}</span><span class="rank-detail">${p.wpm||0} WPM<small>${p.accuracy||0}% Genauigkeit</small></span></div>`).join("");showView("resultsView");}}
async function leave(){clearInterval(startTimer);clearInterval(ticker);ticker=null;if(channel){await client.removeChannel(channel);channel=null;}roomCode=null;showView("homeView");setConnection(false);}
$("createRoomBtn").addEventListener("click",()=>{const name=cleanName($("hostName").value);connectRoom(makeCode(),name,true);});
$("joinRoomBtn").addEventListener("click",()=>{const name=cleanName($("guestName").value);const code=$("roomCode").value.trim().toUpperCase();if(code.length!==6){toast("Der Raumcode muss 6 Zeichen haben.");return;}connectRoom(code,name,false);});
$("roomCode").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));
$("startRaceBtn").addEventListener("click",startRace);
$("leaveLobbyBtn").addEventListener("click",leave);
$("copyCodeBtn").addEventListener("click",()=>navigator.clipboard?.writeText(roomCode).then(()=>toast("Raumcode kopiert!")).catch(()=>toast("Code: "+roomCode)));
$("copyInviteBtn").addEventListener("click",()=>{const url=$("inviteUrl").textContent;navigator.clipboard?.writeText(url).then(()=>toast("Einladungslink kopiert!")).catch(()=>toast("Teile den Raumcode: "+roomCode));});
$("raceAgainBtn").addEventListener("click",async()=>{if(isHost){await send("race-reset",{});raceStarted=false;raceFinished=false;localFinishedAt=null;players={};showView("lobbyView");}else toast("Bitte den Host um eine neue Runde.");});
$("backHomeBtn").addEventListener("click",leave);
$("soundToggle").addEventListener("click",()=>{soundOn=!soundOn;$("soundToggle").style.opacity=soundOn?"1":".4";toast(soundOn?"Sound-Hinweis aktiviert":"Sound-Hinweis deaktiviert");});
window.addEventListener("load",()=>{if(!configured){$("setupHint").textContent="Setup: Supabase-Projekt anlegen und URL + anon key in app.js eintragen (Anleitung in README).";}const code=new URLSearchParams(location.search).get("room");if(code){$("roomCode").value=code.toUpperCase();$("guestName").focus();}});
window.addEventListener("beforeunload",()=>{if(channel)client.removeChannel(channel);});
