"use strict";
/* ============ Hustle Empire ============ */
const SAVE_KEY = "hustleEmpire.v1";
const OFFLINE_CAP = 4 * 3600;

/* ---------- Number formatting ---------- */
const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
function fmt(n) {
  if (!isFinite(n)) return "∞";
  const neg = n < 0; n = Math.abs(n);
  if (n < 1000) return (neg ? "-" : "") + (n < 10 && n % 1 ? n.toFixed(2) : n < 100 && n % 1 ? n.toFixed(1) : Math.floor(n));
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIX.length) return (neg ? "-" : "") + n.toExponential(2).replace("+", "");
  const v = n / Math.pow(1000, tier);
  return (neg ? "-" : "") + v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0) + SUFFIX[tier];
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => "$" + fmt(n);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Static data ---------- */
const BUSINESSES = [
  { name: "Falafel Stand",            cost: 15,      inc: 1 },
  { name: "Shuk Stall",               cost: 100,     inc: 8 },
  { name: "Sherut App",               cost: 1100,    inc: 47 },
  { name: "AgriTech Farm",            cost: 12000,   inc: 260 },
  { name: "Diamond Exchange",         cost: 130000,  inc: 1400 },
  { name: "Fintech App",              cost: 1.4e6,   inc: 7800 },
  { name: "Cybersecurity Firm",       cost: 2e7,     inc: 44000 },
  { name: "Haifa Port Terminal",      cost: 3.3e8,   inc: 260000 },
  { name: "International Trading Centre", cost: 5.1e9, inc: 1.6e6 },
  { name: "Semiconductor Fab",        cost: 7.5e10,  inc: 1e7 },
  { name: "Space Tech Company",       cost: 1e12,    inc: 6.5e7 },
];
const GROWTH = 1.15;

const VENTURE_UPGRADES = [
  "Secret Spice Blend", "Prime Corner Spot", "Surge Pricing", "Drip Irrigation Patent", "Certified Grading Lab",
  "Series B Funding", "Zero-Day Bug Bounty", "Automated Cranes", "Free Trade Agreements", "EUV Lithography", "Reusable Boosters",
].map((name, i) => ({ id: "v" + i, name, biz: i, mult: 2, cost: BUSINESSES[i].cost * 50, reqOwn: 5,
  desc: `${BUSINESSES[i].name} ×2` }));
const GLOBAL_UPGRADES = [
  { id: "g0", name: "Founders' Circle", mult: 1.25, cost: 5e4,  reqRun: 2e4,  desc: "All ventures +25%" },
  { id: "g1", name: "Angel Round",      mult: 1.25, cost: 5e6,  reqRun: 2e6,  desc: "All ventures +25%" },
  { id: "g2", name: "Unicorn Status",   mult: 1.5,  cost: 5e9,  reqRun: 2e9,  desc: "All ventures +50%" },
];
const UPGRADES = [...VENTURE_UPGRADES, ...GLOBAL_UPGRADES];

const EXPANSIONS = [
  { id: "home", name: "Home Market", mult: 1, cost: 0 },
  { id: "eu",   name: "European Market",        mult: 1.15, cost: 5e4 },
  { id: "na",   name: "North American Market",  mult: 1.15, cost: 2e6 },
  { id: "apac", name: "Asia-Pacific Market",    mult: 1.18, cost: 1e8 },
  { id: "latam",name: "Latin American Market",  mult: 1.18, cost: 5e9 },
  { id: "af",   name: "African Market",         mult: 1.20, cost: 2e11 },
];

const SECURITY = [
  { name: "Private Security Firm",       cost: 5e3,  desc: "Fewer raids, more response time, fewer clicks" },
  { name: "Corporate Intelligence Unit", cost: 2e5,  desc: "Further fewer raids, more time, fewer clicks" },
  { name: "Diplomatic Immunity Deal",    cost: 1e7,  desc: "Further fewer raids, more time, fewer clicks" },
];
const INSURANCE = [
  { name: "Basic Insurance Policy",     cost: 1e4, cut: 0.25 },
  { name: "Comprehensive Coverage",     cost: 5e5, cut: 0.50 },
  { name: "Sovereign Wealth Backstop",  cost: 2e7, cut: 0.75 },
];

const WORKER = { name: "Hustle Assistant", cost: 500, desc: "Clicks HUSTLE for you once per second, with all your click bonuses" };
const SHOP = [
  { id: "golden", name: "Golden Touch",       cost: 1, desc: "2× hustle clicks" },
  { id: "warm",   name: "Warm Welcome",       cost: 1, desc: "Start future companies with $10K" },
  { id: "eff",    name: "Efficient Markets",  cost: 2, desc: "Cheaper venture cost scaling" },
  { id: "inv",    name: "Investor Confidence",cost: 3, desc: "+25% revenue" },
  { id: "fast",   name: "Faster Milestones",  cost: 3, desc: "Milestone every 20 instead of 25" },
  { id: "serial", name: "Serial Founder",     cost: 4, desc: "Earn IPO shares faster" },
  { id: "empire", name: "Global Empire",      cost: 8, desc: "+50% revenue" },
];

const STOCKS = [
  { sym: "NGV", name: "Negev Pharma",      base: 40,  vol: 0.05 },
  { sym: "BWS", name: "BlueWall Security", base: 120, vol: 0.035 },
  { sym: "CTX", name: "CitrusTech",        base: 75,  vol: 0.07 },
  { sym: "LVT", name: "Levant Logistics",  base: 200, vol: 0.025 },
];

/* Countries: c=continent, perk types: rev, biz(index), rep, raid, deal */
const COUNTRIES = {
  IL: { n: "Israel", f: "🇮🇱", c: "Asia", street: "Rothschild Boulevard", market: "the shuk", region: "the Negev, Ramat Gan", exch: "TASE",
        perk: { name: "Startup Nation", txt: "Cybersecurity income +25%", biz: 6, m: 1.25 } },
  SG: { n: "Singapore", f: "🇸🇬", c: "Asia", street: "Orchard Road", market: "hawker markets", region: "the port district", exch: "Singapore Exchange",
        perk: { name: "Straits Trade Network", txt: "Trade-deal payouts +15%", deal: 1.15 } },
  GB: { n: "United Kingdom", f: "🇬🇧", c: "Europe", street: "Oxford Street", market: "Borough Market", region: "the Midlands", exch: "LSE",
        perk: { name: "The City's Reach", txt: "All revenue +10%", rev: 1.10 } },
  US: { n: "United States", f: "🇺🇸", c: "North America", street: "Main Street", market: "the farmers market", region: "the Midwest", exch: "NYSE",
        perk: { name: "Deep Capital Markets", txt: "All revenue +10%", rev: 1.10 } },
  CH: { n: "Switzerland", f: "🇨🇭", c: "Europe", street: "Bahnhofstrasse", market: "the Zurich market", region: "the Alps", exch: "SIX",
        perk: { name: "Vault of Nations", txt: "Reputation gains +20%", rep: 1.2 } },
  JP: { n: "Japan", f: "🇯🇵", c: "Asia", street: "Ginza", market: "Tsukiji stalls", region: "Kansai", exch: "JPX",
        perk: { name: "Precision Manufacturing", txt: "Semiconductor income +25%", biz: 9, m: 1.25 } },
  AE: { n: "UAE", f: "🇦🇪", c: "Asia", street: "Sheikh Zayed Road", market: "the souk", region: "Jebel Ali", exch: "ADX",
        perk: { name: "Gulf Logistics Hub", txt: "Port income +25%", biz: 7, m: 1.25 } },
  IN: { n: "India", f: "🇮🇳", c: "Asia", street: "MG Road", market: "the bazaar", region: "Bengaluru", exch: "NSE",
        perk: { name: "IT Services Corridor", txt: "Fintech income +25%", biz: 5, m: 1.25 } },
  CN: { n: "China", f: "🇨🇳", c: "Asia", street: "Nanjing Road", market: "the night market", region: "the Pearl River Delta", exch: "SSE",
        perk: { name: "Manufacturing Scale", txt: "Semiconductor income +20%", biz: 9, m: 1.20 } },
  SA: { n: "Saudi Arabia", f: "🇸🇦", c: "Asia", street: "Tahlia Street", market: "the souq", region: "the Eastern Province", exch: "Tadawul",
        perk: { name: "Sovereign Reserves", txt: "Raider threats −20%", raid: 0.8 } },
  BR: { n: "Brazil", f: "🇧🇷", c: "South America", street: "Avenida Paulista", market: "the feira", region: "Mato Grosso", exch: "B3",
        perk: { name: "Agribusiness Scale", txt: "AgriTech income +25%", biz: 3, m: 1.25 } },
  DE: { n: "Germany", f: "🇩🇪", c: "Europe", street: "Königsallee", market: "the Wochenmarkt", region: "Bavaria", exch: "Deutsche Börse", perk: null },
  FR: { n: "France", f: "🇫🇷", c: "Europe", street: "Champs-Élysées", market: "the marché", region: "Provence", exch: "Euronext Paris", perk: null },
  CA: { n: "Canada", f: "🇨🇦", c: "North America", street: "Yonge Street", market: "the farmers market", region: "Alberta", exch: "TSX", perk: null },
  MX: { n: "Mexico", f: "🇲🇽", c: "North America", street: "Paseo de la Reforma", market: "el mercado", region: "Jalisco", exch: "BMV", perk: null },
  AR: { n: "Argentina", f: "🇦🇷", c: "South America", street: "Avenida 9 de Julio", market: "la feria", region: "the Pampas", exch: "BCBA", perk: null },
  CL: { n: "Chile", f: "🇨🇱", c: "South America", street: "Alameda", market: "la vega", region: "Atacama", exch: "Santiago Exchange", perk: null },
  NG: { n: "Nigeria", f: "🇳🇬", c: "Africa", street: "Broad Street", market: "the Balogun market", region: "Lagos", exch: "NGX", perk: null },
  ZA: { n: "South Africa", f: "🇿🇦", c: "Africa", street: "Sandton Drive", market: "the Neighbourgoods market", region: "Gauteng", exch: "JSE", perk: null },
  KE: { n: "Kenya", f: "🇰🇪", c: "Africa", street: "Kenyatta Avenue", market: "Gikomba market", region: "Nairobi", exch: "NSE Kenya", perk: null },
  EG: { n: "Egypt", f: "🇪🇬", c: "Africa", street: "Tahrir Square", market: "Khan el-Khalili", region: "the Delta", exch: "EGX", perk: null },
  AU: { n: "Australia", f: "🇦🇺", c: "Oceania", street: "George Street", market: "Queen Victoria Market", region: "Queensland", exch: "ASX", perk: null },
  NZ: { n: "New Zealand", f: "🇳🇿", c: "Oceania", street: "Queen Street", market: "the Auckland market", region: "Canterbury", exch: "NZX", perk: null },
  KR: { n: "South Korea", f: "🇰🇷", c: "Asia", street: "Gangnam-daero", market: "Namdaemun", region: "Gyeonggi", exch: "KRX", perk: null },
  ID: { n: "Indonesia", f: "🇮🇩", c: "Asia", street: "Jalan Sudirman", market: "the pasar", region: "Java", exch: "IDX", perk: null },
};
const CONTINENTS = ["North America", "South America", "Europe", "Africa", "Asia", "Oceania"];

/* All remaining sovereign states (193 UN members + Vatican City + Palestine). Flags come from ISO codes. */
const flagOf = code => String.fromCodePoint(...[...code].map(ch => 127397 + ch.charCodeAt(0)));
const MORE = {
  Africa: "DZ Algeria;AO Angola;BJ Benin;BW Botswana;BF Burkina Faso;BI Burundi;CV Cabo Verde;CM Cameroon;CF Central African Republic;TD Chad;KM Comoros;CG Republic of the Congo;CD DR Congo;CI Côte d'Ivoire;DJ Djibouti;GQ Equatorial Guinea;ER Eritrea;SZ Eswatini;ET Ethiopia;GA Gabon;GM Gambia;GH Ghana;GN Guinea;GW Guinea-Bissau;LS Lesotho;LR Liberia;LY Libya;MG Madagascar;MW Malawi;ML Mali;MR Mauritania;MU Mauritius;MA Morocco;MZ Mozambique;NA Namibia;NE Niger;RW Rwanda;ST São Tomé and Príncipe;SN Senegal;SC Seychelles;SL Sierra Leone;SO Somalia;SS South Sudan;SD Sudan;TZ Tanzania;TG Togo;TN Tunisia;UG Uganda;ZM Zambia;ZW Zimbabwe",
  Asia: "AF Afghanistan;AM Armenia;AZ Azerbaijan;BH Bahrain;BD Bangladesh;BT Bhutan;BN Brunei;KH Cambodia;GE Georgia;IR Iran;IQ Iraq;JO Jordan;KZ Kazakhstan;KW Kuwait;KG Kyrgyzstan;LA Laos;LB Lebanon;MY Malaysia;MV Maldives;MN Mongolia;MM Myanmar;NP Nepal;KP North Korea;OM Oman;PK Pakistan;PS Palestine;PH Philippines;QA Qatar;LK Sri Lanka;SY Syria;TJ Tajikistan;TH Thailand;TL Timor-Leste;TR Türkiye;TM Turkmenistan;UZ Uzbekistan;VN Vietnam;YE Yemen",
  Europe: "AL Albania;AD Andorra;AT Austria;BY Belarus;BE Belgium;BA Bosnia and Herzegovina;BG Bulgaria;HR Croatia;CY Cyprus;CZ Czechia;DK Denmark;EE Estonia;FI Finland;GR Greece;HU Hungary;IS Iceland;IE Ireland;IT Italy;LV Latvia;LI Liechtenstein;LT Lithuania;LU Luxembourg;MT Malta;MD Moldova;MC Monaco;ME Montenegro;NL Netherlands;MK North Macedonia;NO Norway;PL Poland;PT Portugal;RO Romania;RU Russia;SM San Marino;RS Serbia;SK Slovakia;SI Slovenia;ES Spain;SE Sweden;UA Ukraine;VA Vatican City",
  "North America": "AG Antigua and Barbuda;BS Bahamas;BB Barbados;BZ Belize;CR Costa Rica;CU Cuba;DM Dominica;DO Dominican Republic;SV El Salvador;GD Grenada;GT Guatemala;HT Haiti;HN Honduras;JM Jamaica;NI Nicaragua;PA Panama;KN Saint Kitts and Nevis;LC Saint Lucia;VC Saint Vincent and the Grenadines;TT Trinidad and Tobago",
  "South America": "BO Bolivia;CO Colombia;EC Ecuador;GY Guyana;PY Paraguay;PE Peru;SR Suriname;UY Uruguay;VE Venezuela",
  Oceania: "FJ Fiji;KI Kiribati;MH Marshall Islands;FM Micronesia;NR Nauru;PW Palau;PG Papua New Guinea;WS Samoa;SB Solomon Islands;TO Tonga;TV Tuvalu;VU Vanuatu",
};
Object.entries(MORE).forEach(([cont, str]) => str.split(";").forEach(item => {
  const code = item.slice(0, 2), n = item.slice(3);
  if (!COUNTRIES[code]) COUNTRIES[code] = { n, c: cont, perk: null };
}));
Object.entries(COUNTRIES).forEach(([code, c]) => {
  c.f = c.f || flagOf(code);
  c.street = c.street || "Main Street"; c.market = c.market || "the local market";
  c.region = c.region || "the countryside"; c.exch = c.exch || "the national exchange";
});
const UNIVERSE = Object.keys(COUNTRIES).sort((a, b) => COUNTRIES[a].n.localeCompare(COUNTRIES[b].n));

/* ---------- State ---------- */
const DEFAULT_SETTINGS = { theme: "default", motion: false, tickerAnim: true, tickerShow: true, sound: false,
  compact: false, confRebirth: true, confReset: true };

function freshState() {
  const st = {};
  STOCKS.forEach(s => st[s.sym] = { p: s.base, own: 0 });
  return { cash: 0, run: 0, shares: 0, rebirths: 0, cp: 0,
    biz: BUSINESSES.map(() => 0), upg: {}, worker: 0, shop: {}, sec: 0, ins: 0, exp: 0,
    stocks: st, country: null, company: "My Company", rel: {},
    settings: { ...DEFAULT_SETTINGS }, last: Date.now() };
}
let S = freshState();
let events = [];      // transient active events
let temp = [];        // temporary revenue modifiers {label, mult, until}
let bulk = 1, stockBulk = 1, outreachContinent = null;
let nextEventId = 1, raidTimer = 0, worldTimer = 0, contactTimer = 0;
let nextWorld = rnd(50, 90), nextContact = rnd(70, 120);

/* ---------- Save / load ---------- */
function save() { S.last = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw), f = freshState();
    S = { ...f, ...d, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
      stocks: { ...f.stocks, ...(d.stocks || {}) }, biz: BUSINESSES.map((_, i) => (d.biz && d.biz[i]) || 0) };
    return true;
  } catch (e) { return false; }
}

/* ---------- Economy ---------- */
const perk = () => (S.country && COUNTRIES[S.country].perk) || {};
const mileStep = () => (S.shop.fast ? 20 : 25);
const growth = () => (S.shop.eff ? 1.13 : GROWTH);
const milestoneMult = n => Math.pow(2, Math.floor(n / mileStep()));

function tempMult() { const now = Date.now(); temp = temp.filter(t => t.until > now); return temp.reduce((m, t) => m * t.mult, 1); }
function globalMult() {
  let m = 1;
  GLOBAL_UPGRADES.forEach(u => { if (S.upg[u.id]) m *= u.mult; });
  for (let i = 1; i <= S.exp; i++) m *= EXPANSIONS[i].mult;
  m *= 1 + 0.02 * S.shares;
  m *= 1 + 0.10 * S.cp;
  if (S.shop.inv) m *= 1.25;
  if (S.shop.empire) m *= 1.5;
  if (perk().rev) m *= perk().rev;
  return m * tempMult();
}
function bizIncome(i) {
  let v = BUSINESSES[i].inc * S.biz[i] * milestoneMult(S.biz[i]);
  if (S.upg["v" + i]) v *= 2;
  if (perk().biz === i) v *= perk().m;
  return v;
}
function income() { let t = 0; for (let i = 0; i < BUSINESSES.length; i++) t += bizIncome(i); return t * globalMult(); }
function clickValue() { return (1 + income() * 0.05) * (S.shop.golden ? 2 : 1); }
function bizCost(i, qty) {
  const g = growth(), b = BUSINESSES[i].cost * Math.pow(g, S.biz[i]);
  return b * (Math.pow(g, qty) - 1) / (g - 1);
}
function earn(x) { S.cash += x; S.run += Math.max(0, x); }

/* ---------- Audio ---------- */
let actx;
function beep(f = 520, d = 0.06) {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = f; g.gain.value = 0.04; o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + d);
  } catch (e) {}
}
function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  $("#toasts").appendChild(t); setTimeout(() => t.remove(), 3800);
}

/* ---------- Diplomacy state ---------- */
function relOf(code) {
  if (!S.rel[code]) {
    const others = UNIVERSE.filter(c => c !== code && c !== S.country).sort(() => Math.random() - 0.5);
    S.rel[code] = { rep: 50, wealth: Math.round(rnd(30, 95)), peace: Math.round(rnd(35, 90)), contacts: 0,
      last: null, outcome: "No contact yet", allies: others.slice(0, 2), rivals: others.slice(2, 4) };
  }
  return S.rel[code];
}
function changeRep(code, delta, ripple = true) {
  const r = relOf(code);
  if (delta > 0 && perk().rep) delta *= perk().rep;
  r.rep = clamp(Math.round(r.rep + delta), 0, 100);
  if (ripple) {
    r.allies.forEach(a => changeRep(a, delta * 0.3, false));
    r.rivals.forEach(a => changeRep(a, -delta * 0.3, false));
  }
}
const repFactor = code => 1 + relOf(code).rep / 100;

/* ---------- Events ---------- */
function addEvent(ev) {
  ev.id = nextEventId++; ev.start = Date.now(); ev.until = ev.start + ev.secs * 1000;
  events.push(ev); beep(700, 0.12); renderEvents();
}
function removeEvent(id) { events = events.filter(e => e.id !== id); renderEvents(); }
const findEv = id => events.find(e => e.id === id);

function raidParams() {
  const sec = S.sec, rp = perk().raid || 1;
  return {
    every: 30 + sec * 15,
    chance: 0.4 * rp * (1 - sec * 0.2),
    secs: 18 + sec * 6,
    clicks: Math.max(6, 16 - sec * 3),
  };
}
function spawnRaid() {
  const p = raidParams();
  const pct = rnd(0.12, 0.3);
  addEvent({ kind: "raid", secs: p.secs, pct, atRisk: S.cash * pct, clicks: p.clicks, done: 0 });
}
function lossAfterInsurance(x) { return S.ins ? x * (1 - INSURANCE[S.ins - 1].cut) : x; }

function spawnWorldEvent() {
  const kinds = ["deal", "treaty", "breach", "conflict"];
  const kind = pick(kinds);
  const code = pick(UNIVERSE.filter(c => c !== S.country));
  const r = relOf(code); r.contacts++; r.last = Date.now();
  const ips = Math.max(income(), 1);
  if (kind === "deal") {
    const amt = ips * rnd(40, 80) * repFactor(code) * (perk().deal || 1) + 100;
    r.outcome = "Offered a trade deal";
    addEvent({ kind, code, secs: 30, amt });
  } else if (kind === "treaty") {
    r.outcome = "Proposed a trade treaty";
    addEvent({ kind, code, secs: 30 });
  } else if (kind === "breach") {
    const fee = Math.max(200, S.cash * 0.08);
    addEvent({ kind, code, secs: 25, clicks: 12, done: 0, fee, loss: Math.max(100, S.cash * 0.15) });
  } else {
    const fee = Math.max(150, S.cash * 0.06);
    addEvent({ kind, code, secs: 30, fee, pen: 0.85, progress: 0, need: 3 });
  }
}
function spawnContact() {
  const code = pick(UNIVERSE.filter(c => c !== S.country));
  const r = relOf(code); r.contacts++; r.last = Date.now();
  const roll = Math.random();
  const ips = Math.max(income(), 1);
  if (roll < 0.35) {
    r.outcome = "Offered a trade deal";
    addEvent({ kind: "deal", code, secs: 35, amt: ips * rnd(50, 100) * repFactor(code) * (perk().deal || 1) + 150 });
  } else if (roll < 0.65) {
    r.outcome = "Proposed a trade treaty";
    addEvent({ kind: "treaty", code, secs: 35 });
  } else {
    // bolder threats at higher reputation
    const demand = Math.max(200, S.cash * (0.05 + r.rep / 800));
    r.outcome = "Issued a diplomatic threat";
    addEvent({ kind: "threat", code, secs: 35, demand });
  }
}

function eventAction(id, act) {
  const e = findEv(id); if (!e) return;
  const r = e.code ? relOf(e.code) : null;
  const nm = e.code ? COUNTRIES[e.code].n : "";
  switch (e.kind + ":" + act) {
    case "raid:fend":
      e.done++; beep(400, 0.03);
      if (e.done >= e.clicks) {
        const reward = e.atRisk * 0.15 + 50; earn(reward);
        toast(`Raiders repelled! +${money(reward)}`); removeEvent(id);
      } else updateEventTimers();
      return;
    case "raid:pay": {
      const cost = lossAfterInsurance(e.atRisk * 0.6);
      if (S.cash < cost) return toast("Not enough cash to pay them off");
      S.cash -= cost; toast(`Paid raiders ${money(cost)}`); removeEvent(id); return; }
    case "deal:accept":
      earn(e.amt); changeRep(e.code, 4); r.outcome = `Accepted deal (+${money(e.amt)})`;
      toast(`Trade deal with ${nm}: +${money(e.amt)}`); removeEvent(id); return;
    case "deal:decline":
      changeRep(e.code, -2); r.outcome = "Declined a trade deal"; removeEvent(id); return;
    case "treaty:accept":
      temp.push({ label: `${nm} treaty`, mult: 1.2, until: Date.now() + 45000 });
      changeRep(e.code, 5); r.outcome = "Signed treaty (+20% for 45s)"; toast(`Treaty signed with ${nm}: +20% revenue for 45s`);
      removeEvent(id); return;
    case "treaty:decline":
      changeRep(e.code, -2); r.outcome = "Declined a treaty"; removeEvent(id); return;
    case "breach:patch":
      e.done++; if (e.done >= e.clicks) { toast("Systems patched"); r.outcome = "Breach patched"; removeEvent(id); } else updateEventTimers();
      return;
    case "breach:pay":
      if (S.cash < e.fee) return toast("Not enough cash");
      S.cash -= e.fee; r.outcome = "Paid breach response fee"; toast(`Emergency response: -${money(e.fee)}`); removeEvent(id); return;
    case "conflict:negotiate":
      e.progress++; if (Math.random() < 0.5 || e.progress >= e.need) { changeRep(e.code, 2); r.outcome = "Negotiated tariffs down"; toast("Tariffs negotiated down"); removeEvent(id); } else { toast("Talks continue…"); updateEventTimers(); }
      return;
    case "conflict:pay":
      if (S.cash < e.fee) return toast("Not enough cash");
      S.cash -= e.fee; r.outcome = "Paid tariff settlement"; toast(`Settlement: -${money(e.fee)}`); removeEvent(id); return;
    case "threat:give":
      if (S.cash < e.demand) return toast("Not enough cash");
      S.cash -= e.demand; changeRep(e.code, 5); r.outcome = "Gave in to a threat"; toast(`Paid ${nm} ${money(e.demand)}`); removeEvent(id); return;
    case "threat:ignore":
      changeRep(e.code, -4); r.peace = clamp(r.peace - 8, 0, 100); r.outcome = "Ignored a threat";
      temp.push({ label: "Sanctions", mult: 0.9, until: Date.now() + 30000 }); removeEvent(id); return;
    case "threat:firm":
      if (Math.random() < 0.55) { changeRep(e.code, 8); r.outcome = "Stood firm and won respect"; toast(`${nm} backed down`); }
      else { const l = lossAfterInsurance(e.demand * 1.5); S.cash = Math.max(0, S.cash - l); changeRep(e.code, -8); r.peace = clamp(r.peace - 10, 0, 100); r.outcome = "Stood firm and lost"; toast(`${nm} retaliated: -${money(l)}`); }
      removeEvent(id); return;
  }
}
function expireEvent(e) {
  const r = e.code ? relOf(e.code) : null;
  if (e.kind === "raid") { const l = lossAfterInsurance(e.atRisk); S.cash = Math.max(0, S.cash - l); toast(`Raiders took ${money(l)}`); }
  else if (e.kind === "breach") { const l = lossAfterInsurance(e.loss); S.cash = Math.max(0, S.cash - l); r.outcome = "Breach cost us"; toast(`Breach cost ${money(l)}`); }
  else if (e.kind === "conflict") { temp.push({ label: "Tariffs", mult: e.pen, until: Date.now() + 40000 }); changeRep(e.code, -3); r.outcome = "Tariffs imposed"; toast("Tariffs cut revenue for 40s"); }
  else if (e.kind === "threat") { eventAction(e.id, "ignore"); return; }
  else if (e.kind === "deal" || e.kind === "treaty") { r.outcome = "Offer expired"; }
  events = events.filter(x => x.id !== e.id);
}

/* ---------- Rendering helpers ---------- */
const sigCache = {};
function renderIf(id, sig, html) {
  if (sigCache[id] === sig) return;
  sigCache[id] = sig; $(id).innerHTML = html();
}
const aff = (cost) => (S.cash >= cost ? 1 : 0);

function renderEvents() {
  const el = $("#events");
  el.innerHTML = events.map(e => {
    const nm = e.code ? `${COUNTRIES[e.code].f} ${COUNTRIES[e.code].n}` : "";
    const bar = `<div class="bar timer"><i data-dl="${e.id}"></i></div>`;
    let body = "";
    switch (e.kind) {
      case "raid": body = `<b>⚔️ Market Raiders!</b> ${money(e.atRisk)} at risk.${bar}
        <div class="row"><button class="btn" data-ev="${e.id}" data-act="fend">Fend Off (<span data-prog="${e.id}">${e.done}/${e.clicks}</span>)</button>
        <button class="btn ghost" data-ev="${e.id}" data-act="pay">Pay Them Off (${money(lossAfterInsurance(e.atRisk * 0.6))})</button></div>`; break;
      case "deal": body = `<b>🤝 Trade Deal</b> from ${nm}: one-time payout ${money(e.amt)}.${bar}
        <div class="row"><button class="btn" data-ev="${e.id}" data-act="accept">Accept</button><button class="btn ghost" data-ev="${e.id}" data-act="decline">Decline</button></div>`; break;
      case "treaty": body = `<b>📜 Trade Treaty</b> with ${nm}: +20% revenue for 45s.${bar}
        <div class="row"><button class="btn" data-ev="${e.id}" data-act="accept">Sign</button><button class="btn ghost" data-ev="${e.id}" data-act="decline">Decline</button></div>`; break;
      case "breach": body = `<b>🔓 Security Breach</b> (${nm}). Patch or lose ${money(lossAfterInsurance(e.loss))}.${bar}
        <div class="row"><button class="btn" data-ev="${e.id}" data-act="patch">Patch (<span data-prog="${e.id}">${e.done}/${e.clicks}</span>)</button>
        <button class="btn ghost" data-ev="${e.id}" data-act="pay">Emergency fee ${money(e.fee)}</button></div>`; break;
      case "conflict": body = `<b>🚢 Trade Conflict</b>: ${nm} imposes tariffs (−15% revenue).${bar}
        <div class="bar"><i style="width:${(e.progress / e.need) * 100}%"></i></div>
        <div class="row"><button class="btn" data-ev="${e.id}" data-act="negotiate">Negotiate</button>
        <button class="btn ghost" data-ev="${e.id}" data-act="pay">Settle ${money(e.fee)}</button></div>`; break;
      case "threat": body = `<b>⚠️ Diplomatic Threat</b> from ${nm}: demands ${money(e.demand)}.${bar}
        <div class="row"><button class="btn ghost" data-ev="${e.id}" data-act="give">Give in</button>
        <button class="btn ghost" data-ev="${e.id}" data-act="ignore">Ignore</button>
        <button class="btn" data-ev="${e.id}" data-act="firm">Stand firm</button></div>`; break;
    }
    const cls = e.kind === "raid" || e.kind === "threat" || e.kind === "breach" || e.kind === "conflict" ? "threat" : "calm";
    return `<div class="event ${cls}">${body}</div>`;
  }).join("");
  updateEventTimers();
}
function updateEventTimers() {
  const now = Date.now();
  events.forEach(e => {
    const bar = $(`[data-dl="${e.id}"]`);
    if (bar) bar.style.width = clamp(((e.until - now) / (e.secs * 1000)) * 100, 0, 100) + "%";
    const pr = $(`[data-prog="${e.id}"]`);
    if (pr) pr.textContent = `${e.done}/${e.clicks}`;
  });
}

function renderAll(force) {
  if (force) Object.keys(sigCache).forEach(k => delete sigCache[k]);
  const ips = income();
  $("#cash").textContent = money(S.cash);
  $("#ips").textContent = `${money(ips)} / sec` + (temp.length ? "  ⚡" : "");
  $("#clickVal").textContent = "+" + money(clickValue());
  const c = COUNTRIES[S.country];
  if (c) $("#flag").textContent = c.f;
  $("#rebirthInfo").textContent = `Company #${S.rebirths + 1} · ${fmt(S.shares)} shares · ${fmt(S.cp)} Tokens`;

  /* Businesses */
  $("#bizBulk").innerHTML = [1, 10, 50].map(n => `<button data-bulk="${n}" class="${bulk === n ? "on" : ""}">×${n}</button>`).join("");
  renderIf("#bizList", "b" + bulk + S.biz.join() + BUSINESSES.map((_, i) => aff(bizCost(i, bulk))).join() + S.shop.eff + S.shop.fast + S.country + income().toExponential(1), () =>
    BUSINESSES.map((b, i) => {
      const cost = bizCost(i, bulk), n = S.biz[i], step = mileStep();
      const next = step - (n % step);
      const local = i === 0 && c ? ` <span class="muted small">on ${c.street}</span>` : i === 1 && c ? ` <span class="muted small">at ${c.market}</span>` : i === 7 && c ? ` <span class="muted small">near ${c.region}</span>` : "";
      const pk = perk().biz === i ? ` <span class="chip">${perk().name}</span>` : "";
      return `<div class="card"><div class="info"><b>${b.name}</b>${local}${pk}<br>
        <span class="muted small">Owned ${n} · ${money(bizIncome(i) * globalMult())}/s · milestone ×2 in ${next}</span></div>
        <button class="btn" data-buy="${i}" ${S.cash < cost ? "disabled" : ""}>Buy ×${bulk} · ${money(cost)}</button></div>`;
    }).join(""));

  /* Upgrades */
  renderIf("#upgList", "w" + S.worker + aff(WORKER.cost) + Math.round(clickValue()) + "u" + Object.keys(S.upg).join() + UPGRADES.map(u => aff(u.cost) + (upgAvail(u) ? "a" : "l")).join() + Math.floor(Math.log10(S.run + 1)), () =>
    (S.worker ? `<div class="card"><div class="info"><b>${WORKER.name}</b><br><span class="muted small">Hired · auto-clicks ${money(clickValue())}/sec</span></div><span class="chip">Hired</span></div>` :
    `<div class="card"><div class="info"><b>${WORKER.name}</b><br><span class="muted small">${WORKER.desc}</span></div>
      <button class="btn" data-worker="1" ${S.cash >= WORKER.cost ? "" : "disabled"}>${money(WORKER.cost)}</button></div>`) +
    UPGRADES.filter(u => !S.upg[u.id]).map(u => {
      const ok = upgAvail(u);
      const req = u.biz !== undefined ? `Own ${u.reqOwn} ${BUSINESSES[u.biz].name}` : `Earn ${money(u.reqRun)} this run`;
      return `<div class="card ${ok ? "" : "locked"}"><div class="info"><b>${u.name}</b><br><span class="muted small">${u.desc}${ok ? "" : " · Requires: " + req}</span></div>
        <button class="btn" data-upg="${u.id}" ${ok && S.cash >= u.cost ? "" : "disabled"}>${money(u.cost)}</button></div>`;
    }).join("") || `<p class="muted">Every upgrade is bought. Nice.</p>`);

  /* Expansion */
  renderIf("#expList", "e" + S.exp + aff((EXPANSIONS[S.exp + 1] || { cost: Infinity }).cost), () =>
    EXPANSIONS.map((x, i) => {
      const owned = i <= S.exp, next = i === S.exp + 1;
      return `<div class="card ${owned || next ? "" : "locked"}"><div class="info"><b>${x.name}</b><br><span class="muted small">${i === 0 ? "Free, permanent" : "+" + Math.round((x.mult - 1) * 100) + "% revenue"}</span></div>
        ${owned ? `<span class="chip">Owned</span>` : `<button class="btn" data-exp="${i}" ${next && S.cash >= x.cost ? "" : "disabled"}>${money(x.cost)}</button>`}</div>`;
    }).join(""));
  renderIf("#secList", "s" + S.sec + aff((SECURITY[S.sec] || { cost: Infinity }).cost), () =>
    SECURITY.map((x, i) => `<div class="card"><div class="info"><b>${x.name}</b><br><span class="muted small">${x.desc}</span></div>
      ${i < S.sec ? `<span class="chip">Owned</span>` : `<button class="btn" data-sec="${i}" ${i === S.sec && S.cash >= x.cost ? "" : "disabled"}>${money(x.cost)}</button>`}</div>`).join(""));
  renderIf("#insList", "i" + S.ins + aff((INSURANCE[S.ins] || { cost: Infinity }).cost), () =>
    INSURANCE.map((x, i) => `<div class="card"><div class="info"><b>${x.name}</b><br><span class="muted small">Cuts event losses by ${x.cut * 100}%</span></div>
      ${i < S.ins ? `<span class="chip">Owned</span>` : `<button class="btn" data-ins="${i}" ${i === S.ins && S.cash >= x.cost ? "" : "disabled"}>${money(x.cost)}</button>`}</div>`).join(""));

  /* Stocks */
  $("#stockBulk").innerHTML = [1, 10, 50].map(n => `<button data-sbulk="${n}" class="${stockBulk === n ? "on" : ""}">×${n}</button>`).join("");
  $("#stockList").innerHTML = STOCKS.map(s => {
    const st = S.stocks[s.sym], chg = ((st.p - s.base) / s.base) * 100;
    return `<div class="card stock"><div><b>${s.sym}</b> · ${s.name}${c ? "" : ""}<br>
      <span class="${chg >= 0 ? "good" : "bad"}">${money(st.p)} (${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%)</span>
      <span class="muted small"> · own ${st.own} = ${money(st.own * st.p)}</span></div>
      <div class="ctl"><button class="btn" data-sbuy="${s.sym}" ${S.cash < st.p * stockBulk ? "disabled" : ""}>Buy ×${stockBulk}</button>
      <button class="btn ghost" data-ssell="${s.sym}" ${st.own < 1 ? "disabled" : ""}>Sell ×${stockBulk}</button></div></div>`;
  }).join("") + (c ? `<p class="muted small">Prices also referenced on the ${c.exch}.</p>` : "");

  /* Prestige */
  const pend = pendingShares();
  $("#ipoText").textContent = S.run >= 1e9 ? `You'd issue ${fmt(pend)} shares (+${fmt(pend * 2)}% revenue). Resets ventures, upgrades, cash.` :
    `Earn ${money(1e9)} this run to IPO (now ${money(S.run)}). Each share adds +2% revenue.`;
  $("#ipoBtn").disabled = S.run < 1e9 || pend < 1;
  const cpGain = Math.floor(S.shares / 10);
  $("#rebirthText").textContent = S.shares >= 10 ? `Convert ${fmt(S.shares)} shares into ${cpGain} Tokens (+${cpGain * 10}% revenue forever).` :
    `Reach 10 shares to convert them into Tokens. You have ${fmt(S.shares)}.`;
  $("#rebirthBtn").disabled = cpGain < 1;
  $("#cpBal").textContent = fmt(S.cp) + " Tokens";
  renderIf("#shop", "sh" + S.cp + Object.keys(S.shop).join(), () =>
    SHOP.map(x => `<div class="card"><div class="info"><b>${x.name}</b><br><span class="muted small">${x.desc}</span></div>
      ${S.shop[x.id] ? `<span class="chip">Owned</span>` : `<button class="btn" data-shop="${x.id}" ${S.cp >= x.cost ? "" : "disabled"}>${x.cost} Tokens</button>`}</div>`).join(""));

  renderAffairs();
}

function upgAvail(u) {
  if (u.biz !== undefined) return S.biz[u.biz] >= u.reqOwn;
  return S.run >= u.reqRun;
}
function pendingShares() { return Math.floor(Math.sqrt(S.run / 1e9) * (S.shop.serial ? 1.5 : 1)); }

function renderAffairs() {
  $("#continents").innerHTML = CONTINENTS.map(x => `<button data-cont="${x}" class="${outreachContinent === x ? "on" : ""}">${x}</button>`).join("");
  const sel = $("#countrySel"), list = UNIVERSE.filter(k => k !== S.country && (!outreachContinent || COUNTRIES[k].c === outreachContinent));
  const key = list.join();
  if (sel.dataset.key !== key) {
    const cur = sel.value;
    sel.innerHTML = list.map(k => `<option value="${k}">${COUNTRIES[k].f} ${COUNTRIES[k].n}</option>`).join("");
    if (list.includes(cur)) sel.value = cur; sel.dataset.key = key;
  }
  const contacted = Object.keys(S.rel).filter(k => S.rel[k].contacts > 0);
  const sig = "d" + contacted.map(k => { const r = S.rel[k]; return [k, r.rep, r.contacts, r.outcome].join(); }).join("|");
  renderIf("#dash", sig, () => contacted.length ? contacted.map(k => {
    const r = S.rel[k], c = COUNTRIES[k], nm = a => a.map(x => COUNTRIES[x].f + " " + COUNTRIES[x].n).join(", ");
    return `<div class="dash-card"><div class="head"><b>${c.f} ${c.n}</b><span class="chip">${r.contacts} contact${r.contacts > 1 ? "s" : ""}</span></div>
      <div class="small">Reputation ${r.rep}</div><div class="bar rep"><i style="width:${r.rep}%"></i></div>
      <div class="small">Wealth ${r.wealth}</div><div class="bar"><i style="width:${r.wealth}%"></i></div>
      <div class="small">Peace ${r.peace}</div><div class="bar peace"><i style="width:${r.peace}%"></i></div>
      <div class="small muted">Allies: ${nm(r.allies)}<br>Rivals: ${nm(r.rivals)}<br>Latest: ${r.outcome}</div></div>`;
  }).join("") : `<p class="muted">No contacts yet. Countries will reach out, or use Reach Out above.</p>`);
}

/* ---------- Negotiation minigame ---------- */
let neg = null;
function startNegotiation(code) {
  const r = relOf(code), ips = Math.max(income(), 1);
  const offer = ips * 90 * (0.6 + r.wealth / 100) * repFactor(code) + 200;
  neg = { code, offer, cost: offer * 0.25, attempts: 0, risk: 0.08, log: [`Talks open with ${COUNTRIES[code].n}.`] };
  r.contacts++; r.last = Date.now(); r.outcome = "Negotiation opened";
  renderNeg();
}
function renderNeg() {
  const c = COUNTRIES[neg.code], left = 4 - neg.attempts, m = $("#modal"), body = $("#modalBody");
  m.classList.remove("hidden");
  body.innerHTML = `<h3>${c.f} Negotiation with ${c.n}</h3>
    <p>They pay <b class="good">${money(neg.offer)}</b> · It costs you <b class="bad">${money(neg.cost)}</b> · Net <b>${money(neg.offer - neg.cost)}</b></p>
    <p>Risk they walk away: <b>${Math.round(neg.risk * 100)}%</b> · Attempts left: ${left}</p>
    <div class="bar timer"><i style="width:${neg.risk * 100}%"></i></div>
    <div class="log" id="negLog">${neg.log.map(l => `<div>${l}</div>`).join("")}</div>
    <div class="row">
      <button class="btn" data-neg="price" ${left < 1 ? "disabled" : ""}>Ask for a lower price</button>
      <button class="btn" data-neg="upside" ${left < 1 ? "disabled" : ""}>Ask for more upside</button>
      <button class="btn" data-neg="rel" ${left < 1 ? "disabled" : ""}>Appeal to the relationship</button></div>
    <div class="row"><button class="btn" data-neg="accept">Accept deal</button><button class="btn ghost" data-neg="walk">Walk away</button></div>`;
  const lg = $("#negLog"); lg.scrollTop = lg.scrollHeight;
}
function negAction(a) {
  const r = relOf(neg.code), nm = COUNTRIES[neg.code].n;
  if (a === "accept") {
    if (S.cash < neg.cost) { neg.log.push("You can't afford the cost yet."); return renderNeg(); }
    S.cash -= neg.cost; earn(neg.offer); changeRep(neg.code, 5); r.outcome = `Closed deal (+${money(neg.offer - neg.cost)} net)`;
    toast(`Deal closed with ${nm}: +${money(neg.offer - neg.cost)}`); return closeModal();
  }
  if (a === "walk") { r.outcome = "You walked away"; return closeModal(); }
  neg.attempts++;
  const chance = { price: 0.55, upside: 0.45, rel: 0.4 + r.rep / 250 }[a];
  if (Math.random() < chance) {
    if (a === "price") { neg.cost *= 0.8; neg.log.push(`${nm} lowered your cost by 20%.`); }
    if (a === "upside") { neg.offer *= 1.25; neg.log.push(`${nm} increased the payout by 25%.`); }
    if (a === "rel") { neg.offer *= 1.1; neg.cost *= 0.9; changeRep(neg.code, 2); neg.log.push(`${nm} values the relationship: better terms all round.`); }
  } else { changeRep(neg.code, -3); neg.log.push(`${nm} rejected that request. Reputation dips.`); }
  neg.risk = clamp(neg.risk + 0.12, 0, 0.9);
  if (Math.random() < neg.risk && neg.attempts > 0 && a) {
    if (Math.random() < neg.risk * 0.8) {
      r.outcome = "They walked away from talks"; changeRep(neg.code, -4);
      toast(`${nm} walked away from the table`); return closeModal();
    }
  }
  renderNeg();
}
function closeModal() { neg = null; $("#modal").classList.add("hidden"); renderAll(true); }

/* ---------- Country selection ---------- */
function countryCards(q) {
  q = (q || "").trim().toLowerCase();
  return UNIVERSE.filter(k => COUNTRIES[k].n.toLowerCase().includes(q)).map(k => `<div class="card"><div class="info"><b>${COUNTRIES[k].f} ${COUNTRIES[k].n}</b><br>
      <span class="muted small">${COUNTRIES[k].perk ? COUNTRIES[k].perk.name + ": " + COUNTRIES[k].perk.txt : "No special perk"}</span></div>
      <button class="btn" data-country="${k}">Choose</button></div>`).join("") || `<p class="muted">No country matches that search.</p>`;
}
function showCountryPicker() {
  $("#modal").classList.remove("hidden");
  $("#modalBody").innerHTML = `<h3>Pick your home country</h3>
    <p class="muted">Your country sets local flavor and may give a gameplay perk. ${UNIVERSE.length} to choose from.</p>
    <input id="cSearch" type="search" placeholder="Search countries" aria-label="Search countries" style="width:100%;padding:.6rem;border-radius:10px;border:1px solid var(--line);background:var(--bg2);color:var(--text)">
    <div id="cpick">${countryCards("")}</div>`;
  $("#cSearch").addEventListener("input", e => { $("#cpick").innerHTML = countryCards(e.target.value); });
}

/* ---------- Actions ---------- */
function buyBiz(i) { const c = bizCost(i, bulk); if (S.cash < c) return; S.cash -= c; S.biz[i] += bulk; beep(620); renderAll(); }
function hustle(ev) {
  const v = clickValue(); earn(v); beep(500, 0.03);
  if (!S.settings.motion) {
    const f = document.createElement("div"); f.className = "float"; f.textContent = "+" + money(v);
    const b = $("#hustle").getBoundingClientRect();
    f.style.left = (ev && ev.clientX ? ev.clientX : b.left + b.width / 2) - 20 + "px";
    f.style.top = (ev && ev.clientY ? ev.clientY : b.top) - 20 + "px";
    document.body.appendChild(f); setTimeout(() => f.remove(), 900);
  }
  $("#cash").textContent = money(S.cash);
}
function doIPO() {
  const p = pendingShares(); if (p < 1) return;
  S.shares += p; S.cash = S.shop.warm ? 1e4 : 0; S.run = 0; S.biz = BUSINESSES.map(() => 0); S.upg = {}; S.worker = 0;
  toast(`IPO complete: +${p} shares`); renderAll(true); save();
}
function doRebirth() {
  const gain = Math.floor(S.shares / 10); if (gain < 1) return;
  if (S.settings.confRebirth && !confirm(`Start your next company? You will convert ${fmt(S.shares)} shares into ${gain} Tokens and reset the rest.`)) return;
  S.cp += gain; S.rebirths++; S.shares = 0; S.cash = S.shop.warm ? 1e4 : 0; S.run = 0; S.biz = BUSINESSES.map(() => 0);
  S.upg = {}; S.worker = 0; S.exp = 0; S.sec = 0; S.ins = 0; S.stocks = freshState().stocks; events = []; temp = [];
  toast(`Company #${S.rebirths + 1} founded. +${gain} Tokens`); renderAll(true); save();
}

/* ---------- Ticker ---------- */
function tickerLine() {
  const c = COUNTRIES[S.country];
  const lines = [
    `${S.company} holds ${money(S.cash)} in cash`, `Income running at ${money(income())}/sec`,
    `${S.biz.reduce((a, b) => a + b, 0)} ventures owned across the portfolio`,
    `Markets open in ${S.exp + 1} of 6 regions`, `${fmt(S.shares)} shares issued`,
    `${Object.values(S.rel).filter(r => r.contacts).length} countries in contact with ${S.company}`,
    c ? `${c.exch} traders watch ${c.street}` : "", c ? `Crowds fill ${c.market}` : "",
  ].filter(Boolean);
  return lines.join("   •   ");
}

/* ---------- Settings ---------- */
function applySettings() {
  const s = S.settings;
  document.body.dataset.theme = s.theme;
  document.body.classList.toggle("reduce", s.motion);
  document.body.classList.toggle("compact", s.compact);
  const t = $("#ticker"); t.classList.toggle("off", !s.tickerShow); t.classList.toggle("static", !s.tickerAnim || s.motion);
  $("#optTheme").value = s.theme; $("#optMotion").checked = s.motion; $("#optTicker").checked = s.tickerAnim;
  $("#optTickerShow").checked = s.tickerShow; $("#optSound").checked = s.sound; $("#optCompact").checked = s.compact;
  $("#optConfRebirth").checked = s.confRebirth; $("#optConfReset").checked = s.confReset;
}

/* ---------- Event wiring ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  const d = t.dataset;
  if (d.bulk) { bulk = +d.bulk; renderAll(true); }
  else if (d.sbulk) { stockBulk = +d.sbulk; renderAll(); }
  else if (d.buy !== undefined) buyBiz(+d.buy);
  else if (d.worker) { if (!S.worker && S.cash >= WORKER.cost) { S.cash -= WORKER.cost; S.worker = 1; toast("Hustle Assistant hired"); renderAll(true); } }
  else if (d.upg) { const u = UPGRADES.find(x => x.id === d.upg); if (u && upgAvail(u) && S.cash >= u.cost) { S.cash -= u.cost; S.upg[u.id] = 1; renderAll(); } }
  else if (d.exp) { const i = +d.exp, x = EXPANSIONS[i]; if (i === S.exp + 1 && S.cash >= x.cost) { S.cash -= x.cost; S.exp++; toast(`${x.name} opened`); renderAll(); } }
  else if (d.sec) { const i = +d.sec, x = SECURITY[i]; if (i === S.sec && S.cash >= x.cost) { S.cash -= x.cost; S.sec++; renderAll(); } }
  else if (d.ins) { const i = +d.ins, x = INSURANCE[i]; if (i === S.ins && S.cash >= x.cost) { S.cash -= x.cost; S.ins++; renderAll(); } }
  else if (d.shop) { const x = SHOP.find(s => s.id === d.shop); if (x && S.cp >= x.cost && !S.shop[x.id]) { S.cp -= x.cost; S.shop[x.id] = 1; renderAll(true); } }
  else if (d.sbuy) { const st = S.stocks[d.sbuy], c = st.p * stockBulk; if (S.cash >= c) { S.cash -= c; st.own += stockBulk; renderAll(); } }
  else if (d.ssell) { const st = S.stocks[d.ssell], q = Math.min(stockBulk, st.own); if (q) { st.own -= q; S.cash += st.p * q; renderAll(); } }
  else if (d.ev) eventAction(+d.ev, d.act);
  else if (d.cont) { outreachContinent = outreachContinent === d.cont ? null : d.cont; renderAffairs(); }
  else if (d.neg) negAction(d.neg);
  else if (d.country) {
    S.country = d.country; $("#modal").classList.add("hidden"); S.rel = {}; renderAll(true); save();
  }
});
$("#hustle").addEventListener("pointerdown", e => { e.preventDefault(); hustle(e); });
$("#hustle").addEventListener("click", e => { if (e.detail === 0) hustle(e); }); // keyboard activation only
["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, e => e.preventDefault()));
document.addEventListener("dblclick", e => e.preventDefault());
$("#ipoBtn").addEventListener("click", doIPO);
$("#rebirthBtn").addEventListener("click", doRebirth);
$("#reachOut").addEventListener("click", () => { const v = $("#countrySel").value; if (v) startNegotiation(v); });
$("#companyName").addEventListener("input", e => { S.company = e.target.value.slice(0, 28); });
$("#saveNow").addEventListener("click", () => { save(); toast("Saved"); });
$("#hardReset").addEventListener("click", () => {
  if (S.settings.confReset && !confirm("Erase ALL progress, including Tokens?")) return;
  const keep = S.settings; localStorage.removeItem(SAVE_KEY); S = freshState(); S.settings = keep; events = []; temp = [];
  applySettings(); $("#companyName").value = S.company; showCountryPicker(); renderAll(true);
});
$("#optDefaults").addEventListener("click", () => { S.settings = { ...DEFAULT_SETTINGS }; applySettings(); });
[["optTheme", "theme", "v"], ["optMotion", "motion"], ["optTicker", "tickerAnim"], ["optTickerShow", "tickerShow"],
 ["optSound", "sound"], ["optCompact", "compact"], ["optConfRebirth", "confRebirth"], ["optConfReset", "confReset"]]
  .forEach(([id, key, kind]) => $("#" + id).addEventListener("change", e => { S.settings[key] = kind ? e.target.value : e.target.checked; applySettings(); }));
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
window.addEventListener("pagehide", save);

/* ---------- Main loop ---------- */
let lastTick = performance.now(), stockClock = 0, tickerClock = 99, drawClock = 0;
function loop(now) {
  const dt = Math.min((now - lastTick) / 1000, 1); lastTick = now;
  if (S.country) {
    earn(income() * dt);
    if (S.worker) earn(clickValue() * dt);
    // raids
    raidTimer += dt;
    const rp = raidParams();
    if (raidTimer >= rp.every) { raidTimer = 0; if (S.cash >= 200 && Math.random() < rp.chance && !events.some(e => e.kind === "raid")) spawnRaid(); }
    worldTimer += dt; if (worldTimer >= nextWorld) { worldTimer = 0; nextWorld = rnd(60, 110); if (S.run > 500 && events.length < 3) spawnWorldEvent(); }
    contactTimer += dt; if (contactTimer >= nextContact) { contactTimer = 0; nextContact = rnd(80, 140); if (S.run > 500 && events.length < 3) spawnContact(); }
    // stocks
    stockClock += dt;
    if (stockClock >= 2) {
      stockClock = 0;
      STOCKS.forEach(s => { const st = S.stocks[s.sym];
        st.p = Math.max(1, st.p * (1 + (Math.random() - 0.5) * 2 * s.vol + 0.05 * (s.base - st.p) / s.base)); });
    }
    // expiry
    const nowMs = Date.now();
    events.filter(e => e.until <= nowMs).forEach(expireEvent);
    if (events.some(e => e.until <= nowMs) === false) { /* no-op */ }
    if (events.length !== $$("#events .event").length) renderEvents();
    updateEventTimers();
    // ticker
    tickerClock += dt; if (tickerClock > 8) { tickerClock = 0; $("#tickerText").textContent = tickerLine(); }
  }
  drawClock += dt;
  if (drawClock > 0.25) { drawClock = 0; renderAll(); }
  requestAnimationFrame(loop);
}

/* ---------- Boot ---------- */
function boot() {
  const had = load();
  applySettings();
  $("#companyName").value = S.company;
  if (had && S.country) {
    const away = clamp((Date.now() - S.last) / 1000, 0, OFFLINE_CAP);
    if (away > 30) {
      const gain = income() * away; earn(gain);
      toast(`Welcome back! You earned ${money(gain)} while away (${Math.floor(away / 60)} min).`);
    }
  }
  if (!S.country) showCountryPicker();
  $("#tickerText").textContent = tickerLine();
  renderAll(true); renderEvents();
  setInterval(save, 10000);
  requestAnimationFrame(loop);
}
boot();
