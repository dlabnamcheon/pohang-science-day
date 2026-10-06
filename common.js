import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, setPersistence, browserSessionPersistence, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const EMAIL_DOMAIN = "dlab-booth.example.com";
export const ADMIN_EMAIL = "admin@" + EMAIL_DOMAIN;
export const MAX_BYTES = 900 * 1024;

export const configured = !String(firebaseConfig.apiKey || "").includes("여기에");

export const app = initializeApp(configured ? firebaseConfig : { apiKey: "x", projectId: "demo-x", appId: "x" });
export const db = getFirestore(app);
export const auth = getAuth(app);

// 개발용: 주소 끝에 ?emu 를 붙이면 로컬 에뮬레이터에 연결
if (new URLSearchParams(location.search).has("emu")) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

// 부스 컴퓨터를 여러 아이가 쓰므로, 창을 닫으면 로그아웃되게 함
export const ready = setPersistence(auth, browserSessionPersistence).catch(() => {});

// 아이디(한글 가능)를 Firebase 로그인용 주소로 바꿈
export function idToEmail(id) {
  const bytes = new TextEncoder().encode(id.trim().toLowerCase());
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return "u" + hex + "@" + EMAIL_DOMAIN;
}

export function validId(id) {
  const s = id.trim();
  return s.length >= 2 && s.length <= 10 && !/\s/.test(s);
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 게임마다 고정된 색과 무늬 번호를 만듦
export function hashOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function timeAgo(ms) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  return Math.floor(h / 24) + "일 전";
}

// 게임이 저장 기능(localStorage)을 써도 멈추지 않도록 임시 저장소를 넣어 줌
const SHIM = "<script>(function(){function mk(){var d={};return{getItem:function(k){return k in d?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}" +
  "['localStorage','sessionStorage'].forEach(function(n){try{window[n].getItem('_')}catch(e){try{Object.defineProperty(window,n,{value:mk(),configurable:true})}catch(_){}}})})();<\/script>";

export function withShim(html) {
  const m = html.match(/<head[^>]*>/i) || html.match(/<html[^>]*>/i) || html.match(/<!doctype[^>]*>/i);
  if (!m) return SHIM + html;
  const at = m.index + m[0].length;
  return html.slice(0, at) + SHIM + html.slice(at);
}

// 올린 게임은 사이트와 분리된 틀 안에서만 실행됨 (계정 정보, 다른 게임에 접근 불가)
export function mountGame(frame, html) {
  frame.setAttribute("sandbox", "allow-scripts allow-pointer-lock allow-modals");
  frame.setAttribute("allow", "fullscreen; autoplay; gamepad");
  frame.srcdoc = withShim(html);
}

export function authMessage(e) {
  const c = (e && e.code) || "";
  if (c.includes("email-already-in-use")) return "이미 있는 아이디예요. 다른 아이디를 써 보세요.";
  if (c.includes("weak-password")) return "비밀번호는 6글자 이상이어야 해요.";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found"))
    return "아이디나 비밀번호가 맞지 않아요.";
  if (c.includes("too-many-requests")) return "시도가 너무 많아요. 잠시 뒤에 다시 해 보세요.";
  if (c.includes("network")) return "인터넷 연결을 확인해 주세요.";
  if (c.includes("permission-denied")) return "권한이 없어요.";
  return "문제가 생겼어요. 선생님께 알려 주세요. (" + (c || (e && e.message) || "알 수 없음") + ")";
}

// 그림 아이콘
const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
export const ICON = {
  pad: svg('<path d="M7.5 7h9a4.5 4.5 0 0 1 4.4 3.6l.9 4.6a2.6 2.6 0 0 1-4.5 2.2L15.5 15.5h-7L6.7 17.4a2.6 2.6 0 0 1-4.5-2.2l.9-4.6A4.5 4.5 0 0 1 7.5 7Z"/><path d="M8 10v3M6.5 11.5h3"/><circle cx="15.2" cy="12.4" r=".5" fill="currentColor"/><circle cx="17.3" cy="10.6" r=".5" fill="currentColor"/>'),
  play: svg('<path d="M7 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/>'),
  refresh: svg('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>'),
  upload: svg('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/><path d="m10 13-2 2 2 2M14 13l2 2-2 2"/>')
};
// 화면에 data-icon="이름" 으로 표시한 자리에 아이콘을 넣음
export function paintIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ""; });
}
