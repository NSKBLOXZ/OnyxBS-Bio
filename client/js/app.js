const API_URL = "http://localhost:3000";

const tracks = [
  { name: "SWIM", artist: "Chase Atlantic", file: "assets/music/swim.mp3" },
  { name: "FRIENDS", artist: "Chase Atlantic", file: "assets/music/friends.mp3" },
  { name: "Meio a Meio II", artist: "TheGusT MC's", file: "assets/music/meio-a-meio-2.mp3" },
  { name: "Atemporal", artist: "Neow FT. Nanda", file: "assets/music/atemporal.mp3" },
  { name: "Outside", artist: "Calvin Harris ft. Ellie Goulding", file: "assets/music/outside.mp3" }
];

const audio = document.getElementById("audioPlayer");
const enterScreen = document.getElementById("enterScreen");
const enterBtn = document.getElementById("enterBtn");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const volumeSlider = document.getElementById("volumeSlider");
const seekBar = document.getElementById("seekBar");
const progressBar = document.getElementById("progressBar");
const trackName = document.getElementById("trackName");
const trackArtist = document.getElementById("trackArtist");
const currentTime = document.getElementById("currentTime");
const durationTime = document.getElementById("durationTime");
const playlist = document.getElementById("playlist");
const bg = document.getElementById("bg");
const bgVideo = document.getElementById("bgVideo");
const now = document.querySelector(".now");
const heroListening = document.getElementById("heroListening");
const clock = document.getElementById("clock");
const dynamicLight = document.querySelector(".dynamic-light");
const cursor = document.getElementById("customCursor");

let currentTrack = Number(localStorage.getItem("onyxbs_track") || 0);
if (!tracks[currentTrack]) currentTrack = 0;
let shuffle = localStorage.getItem("onyxbs_shuffle") === "true";
let repeat = localStorage.getItem("onyxbs_repeat") === "true";
const savedVolume = localStorage.getItem("onyxbs_volume");
if (savedVolume !== null) volumeSlider.value = savedVolume;

function updateClock(){
  clock.textContent = new Date().toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit"});
}
setInterval(updateClock,1000); updateClock();

function initVideoBg(){
  bgVideo.addEventListener("loadeddata",()=>bgVideo.classList.add("ready"));
  bgVideo.addEventListener("error",()=>bgVideo.classList.remove("ready"));
}
function formatTime(seconds){ if(!seconds||Number.isNaN(seconds)) return "0:00"; const m=Math.floor(seconds/60); const s=Math.floor(seconds%60).toString().padStart(2,"0"); return `${m}:${s}`; }
function updateHeroListening(track){ heroListening.style.opacity=".3"; setTimeout(()=>{ heroListening.textContent=`${track.name} — ${track.artist}`; heroListening.style.opacity="1"; },140); }
function setActiveButtons(){ shuffleBtn.classList.toggle("active",shuffle); repeatBtn.classList.toggle("active",repeat); }

function loadTrack(index, autoplay=false){
  currentTrack = index;
  localStorage.setItem("onyxbs_track", String(index));
  const track = tracks[index];
  now.classList.add("fade");
  setTimeout(()=>{
    audio.src = track.file;
    audio.volume = Number(volumeSlider.value);
    trackName.textContent = track.name;
    trackArtist.textContent = track.artist;
    updateHeroListening(track);
    document.querySelectorAll(".playlist button").forEach((btn,i)=>{
      btn.classList.toggle("active", i === currentTrack);
      btn.querySelector(".song-icon").textContent = i === currentTrack ? "▶" : "♪";
    });
    now.classList.remove("fade");
    if(autoplay) audio.play().catch(()=>{});
  },160);
}

function togglePlay(){ audio.paused ? audio.play() : audio.pause(); }
function getRandomTrack(){ if(tracks.length <= 1) return currentTrack; let next=currentTrack; while(next===currentTrack) next=Math.floor(Math.random()*tracks.length); return next; }
function nextTrack(){ shuffle ? loadTrack(getRandomTrack(),true) : loadTrack((currentTrack+1)%tracks.length,true); }
function prevTrack(){ loadTrack((currentTrack-1+tracks.length)%tracks.length,true); }

function renderPlaylist(){
  playlist.innerHTML = tracks.map((track,index)=>`
    <button data-index="${index}">
      <span class="song-icon">${index===currentTrack?"▶":"♪"}</span>
      <strong>${track.name}</strong>
      <small>${track.artist}</small>
    </button>
  `).join("");
  playlist.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>loadTrack(Number(button.dataset.index),true)));
}

enterBtn.addEventListener("click",()=>{ enterScreen.classList.add("hide"); loadTrack(currentTrack,true); });
playBtn.addEventListener("click",togglePlay);
nextBtn.addEventListener("click",nextTrack);
prevBtn.addEventListener("click",prevTrack);
shuffleBtn.addEventListener("click",()=>{ shuffle=!shuffle; localStorage.setItem("onyxbs_shuffle",String(shuffle)); setActiveButtons(); });
repeatBtn.addEventListener("click",()=>{ repeat=!repeat; localStorage.setItem("onyxbs_repeat",String(repeat)); setActiveButtons(); });
volumeSlider.addEventListener("input",()=>{ audio.volume=Number(volumeSlider.value); localStorage.setItem("onyxbs_volume",volumeSlider.value); });
audio.addEventListener("play",()=>{ playBtn.textContent="⏸"; document.body.classList.add("playing"); });
audio.addEventListener("pause",()=>{ playBtn.textContent="▶"; document.body.classList.remove("playing"); });
audio.addEventListener("timeupdate",()=>{ const percent=audio.duration?(audio.currentTime/audio.duration)*100:0; progressBar.style.width=`${percent}%`; currentTime.textContent=formatTime(audio.currentTime); durationTime.textContent=formatTime(audio.duration); });
audio.addEventListener("ended",()=>{ repeat ? loadTrack(currentTrack,true) : nextTrack(); });
seekBar.addEventListener("click",e=>{ if(!audio.duration)return; const rect=seekBar.getBoundingClientRect(); audio.currentTime=((e.clientX-rect.left)/rect.width)*audio.duration; });

async function loadProfile(){
  try{
    const res = await fetch(`${API_URL}/api/profile`);
    const profile = await res.json();
    if(profile.avatar) document.getElementById("profileAvatar").src = profile.avatar;
    if(profile.globalName) document.getElementById("profileName").textContent = profile.globalName;
    if(profile.profile) document.getElementById("profileLink").href = profile.profile;
  }catch{}
}
async function loadFriends(){
  const box=document.getElementById("friendsList");
  try{
    const res=await fetch(`${API_URL}/api/friends`);
    const friends=await res.json();
    box.innerHTML=friends.map(friend=>{
      const name=friend.globalName||friend.username||"Amigo";
      return `<a class="friend" data-tooltip="${name}" href="${friend.profile}" target="_blank" title="${name}"><img loading="lazy" src="${friend.avatar}" alt="${name}"><span>${name}</span></a>`;
    }).join("");
  }catch{ box.innerHTML=`<span class="loading">API offline. Ligue o backend em localhost:3000.</span>`; }
}

let raf=null;
document.addEventListener("mousemove",e=>{
  if(raf) cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{
    const glow=document.getElementById("cursorGlow");
    glow.style.left=e.clientX+"px"; glow.style.top=e.clientY+"px";
    cursor.style.left=e.clientX+"px"; cursor.style.top=e.clientY+"px";
    dynamicLight.style.setProperty("--lx",`${(e.clientX/window.innerWidth)*100}%`);
    dynamicLight.style.setProperty("--ly",`${(e.clientY/window.innerHeight)*100}%`);
    const x=(e.clientX/window.innerWidth-.5)*12, y=(e.clientY/window.innerHeight-.5)*12;
    if(bgVideo.classList.contains("ready")) bgVideo.style.transform=`scale(1.055) translate(${x}px, ${y}px)`;
    else bg.style.transform=`scale(1.047) translate(${x}px, ${y}px)`;
    document.querySelectorAll(".card").forEach(card=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty("--mx",`${((e.clientX-r.left)/r.width)*100}%`);
      card.style.setProperty("--my",`${((e.clientY-r.top)/r.height)*100}%`);
    });
  });
});
document.addEventListener("mouseover",e=>{ if(e.target.closest("a,button,input,.progress-wrap")) document.body.classList.add("cursor-hover"); });
document.addEventListener("mouseout",e=>{ if(e.target.closest("a,button,input,.progress-wrap")) document.body.classList.remove("cursor-hover"); });

initVideoBg(); renderPlaylist(); setActiveButtons(); loadTrack(currentTrack,false); loadProfile(); loadFriends();
