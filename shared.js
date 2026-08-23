// ============ TN Viral Media — shared.js ============
// Firebase project: Nilavasal (shared with the real-estate app, separate collection)
const firebaseConfig = {
  apiKey: "AIzaSyB6AZr-UvUeWA7N8Ak50VF7Dijhlo7wX9c",
  authDomain: "nilavasal.firebaseapp.com",
  projectId: "nilavasal",
  storageBucket: "nilavasal.firebasestorage.app",
  messagingSenderId: "903719164179",
  appId: "1:903719164179:web:f9ecc5f7c19695f08962e6",
  measurementId: "G-7EMT0FN0J4"
};

if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const NEWS_COLLECTION = "tnvNews";
const PLAYLIST_ID = "PLTVAtm990ero";
const RSS_URL = "https://www.youtube.com/feeds/videos.xml?playlist_id=" + PLAYLIST_ID;
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

// Races a promise against a timeout so a slow/hanging network call
// (e.g. the CORS proxy) can never freeze the page forever.
function withTimeout(promise, ms, fallback){
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function tagColor(category){
  const map = {
    "தமிழ்நாடு":"#1F3A5F", "வானிலை":"#1F3A5F", "வணிகம்":"#5F3A1F",
    "சினிமா":"#3A1F5F", "விளையாட்டு":"#1F5F3A", "அரசியல்":"#5F1F1F",
    "வீடியோ":"#1F5F5F", "திண்டிவனம்":"#4A3A1F", "கடலூர்":"#4A3A1F",
    "விழுப்புரம்":"#4A3A1F", "பாண்டிச்சேரி":"#4A3A1F"
  };
  return map[category] || "#28324A";
}

function relTime(date){
  if(!date) return '';
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if(min < 1) return 'சற்றுமுன்';
  if(min < 60) return min + ' நிமிடங்களுக்கு முன்';
  const hr = Math.floor(min / 60);
  if(hr < 24) return hr + ' மணி நேரத்திற்கு முன்';
  const day = Math.floor(hr / 24);
  if(day < 7) return day + ' நாட்களுக்கு முன்';
  return date.toLocaleDateString('ta-IN', {day:'numeric', month:'short'});
}

// Reads the tnvNews Firestore collection once (used for initial render on
// static pages). Returns a normalised array: {id,title,category,link,imageUrl,breaking,featured,date}
async function fetchFirestoreNews(){
  try{
    const snap = await db.collection(NEWS_COLLECTION).orderBy('createdAt','desc').limit(50).get();
    return snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || '',
        category: d.category || '',
       link: d.link || '',
        imageUrl: d.imageUrl || '',
        content: d.content || '',
        breaking: !!d.breaking,
        featured: !!d.featured,
        date: d.createdAt ? d.createdAt.toDate() : new Date(),
        source: 'firestore'
      };
    });
  }catch(err){
    console.error('Firestore read failed:', err);
    return [];
  }
}

// Fetches the YouTube playlist RSS feed through a public CORS proxy and
// converts each <entry> into the same normalised news-item shape.
async function fetchPlaylistVideos(){
  try{
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL), {signal: controller.signal});
    clearTimeout(timeoutId);
    if(!res.ok) throw new Error('RSS fetch failed: ' + res.status);
    const xmlText = await res.text();
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    const entries = Array.from(xml.getElementsByTagName('entry'));
    return entries.map(entry => {
      const videoId = (entry.getElementsByTagName('yt:videoId')[0] || {}).textContent || '';
      const title = (entry.getElementsByTagName('title')[0] || {}).textContent || 'தலைப்பு இல்லை';
      const published = (entry.getElementsByTagName('published')[0] || {}).textContent;
      return {
        id: 'yt-' + videoId,
        title: title,
        category: 'வீடியோ',
        link: 'https://www.youtube.com/watch?v=' + videoId,
        imageUrl: videoId ? ('https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg') : '',
        breaking: false,
        featured: false,
        date: published ? new Date(published) : new Date(),
        source: 'youtube'
      };
    });
  }catch(err){
    console.error('YouTube RSS fetch failed:', err);
    return [];
  }
}
