import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

function normalize(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

// Levenshtein distance — fast version for fuzzy matching (allow 1 error)
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2; // fast-reject
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// Full Levenshtein — used for suggestion similarity (no fast-reject)
function fullEditDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// All normalized keys for fuzzy search
const LOOKUP_KEYS = []; // filled after LOOKUP is built

const ALL_COUNTRIES = [
  { id: "4",   name: "Afghanistan",                    aliases: [] },
  { id: "8",   name: "Albania",                         aliases: [] },
  { id: "12",  name: "Algeria",                         aliases: [] },
  { id: "20",  name: "Andorra",                         aliases: [] },
  { id: "24",  name: "Angola",                          aliases: [] },
  { id: "28",  name: "Antigua and Barbuda",             aliases: ["antigua", "barbuda", "antigua barbuda"] },
  { id: "32",  name: "Argentina",                       aliases: [] },
  { id: "51",  name: "Armenia",                         aliases: [] },
  { id: "36",  name: "Australia",                       aliases: ["aus", "aussie"] },
  { id: "40",  name: "Austria",                         aliases: [] },
  { id: "31",  name: "Azerbaijan",                      aliases: [] },
  { id: "44",  name: "Bahamas",                         aliases: ["the bahamas"] },
  { id: "48",  name: "Bahrain",                         aliases: [] },
  { id: "50",  name: "Bangladesh",                      aliases: [] },
  { id: "52",  name: "Barbados",                        aliases: [] },
  { id: "112", name: "Belarus",                         aliases: ["byelorussia", "belorussia"] },
  { id: "56",  name: "Belgium",                         aliases: [] },
  { id: "84",  name: "Belize",                          aliases: [] },
  { id: "204", name: "Benin",                           aliases: [] },
  { id: "64",  name: "Bhutan",                          aliases: [] },
  { id: "68",  name: "Bolivia",                         aliases: [] },
  { id: "70",  name: "Bosnia and Herzegovina",          aliases: ["bosnia", "bosnia herzegovina", "bih"] },
  { id: "72",  name: "Botswana",                        aliases: [] },
  { id: "76",  name: "Brazil",                          aliases: ["brasil"] },
  { id: "96",  name: "Brunei",                          aliases: ["brunei darussalam"] },
  { id: "100", name: "Bulgaria",                        aliases: [] },
  { id: "854", name: "Burkina Faso",                    aliases: ["burkina"] },
  { id: "108", name: "Burundi",                         aliases: [] },
  { id: "116", name: "Cambodia",                        aliases: ["kampuchea"] },
  { id: "120", name: "Cameroon",                        aliases: [] },
  { id: "124", name: "Canada",                          aliases: [] },
  { id: "132", name: "Cape Verde",                      aliases: ["cabo verde"] },
  { id: "140", name: "Central African Republic",        aliases: ["car", "central africa"] },
  { id: "148", name: "Chad",                            aliases: [] },
  { id: "152", name: "Chile",                           aliases: [] },
  { id: "156", name: "China",                           aliases: ["prc", "peoples republic of china", "zhongguo"] },
  { id: "170", name: "Colombia",                        aliases: [] },
  { id: "174", name: "Comoros",                         aliases: ["the comoros", "comoro islands"] },
  { id: "178", name: "Republic of the Congo",           aliases: ["congo", "congo republic", "congo brazzaville", "republic of congo"] },
  { id: "180", name: "DR Congo",                        aliases: ["drc", "democratic republic of the congo", "democratic republic of congo", "congo kinshasa", "zaire"] },
  { id: "188", name: "Costa Rica",                      aliases: [] },
  { id: "191", name: "Croatia",                         aliases: ["hrvatska"] },
  { id: "192", name: "Cuba",                            aliases: [] },
  { id: "196", name: "Cyprus",                          aliases: [] },
  { id: "203", name: "Czech Republic",                  aliases: ["czechia", "czech"] },
  { id: "208", name: "Denmark",                         aliases: [] },
  { id: "262", name: "Djibouti",                        aliases: [] },
  { id: "212", name: "Dominica",                        aliases: [] },
  { id: "214", name: "Dominican Republic",              aliases: ["dom rep"] },
  { id: "218", name: "Ecuador",                         aliases: [] },
  { id: "818", name: "Egypt",                           aliases: [] },
  { id: "222", name: "El Salvador",                     aliases: ["salvador"] },
  { id: "226", name: "Equatorial Guinea",               aliases: [] },
  { id: "232", name: "Eritrea",                         aliases: [] },
  { id: "233", name: "Estonia",                         aliases: [] },
  { id: "748", name: "Eswatini",                        aliases: ["swaziland"] },
  { id: "231", name: "Ethiopia",                        aliases: ["abyssinia"] },
  { id: "242", name: "Fiji",                            aliases: [] },
  { id: "246", name: "Finland",                         aliases: ["suomi"] },
  { id: "250", name: "France",                          aliases: [] },
  { id: "266", name: "Gabon",                           aliases: [] },
  { id: "270", name: "Gambia",                          aliases: ["the gambia"] },
  { id: "268", name: "Georgia",                         aliases: [] },
  { id: "276", name: "Germany",                         aliases: ["deutschland"] },
  { id: "288", name: "Ghana",                           aliases: [] },
  { id: "300", name: "Greece",                          aliases: ["hellas"] },
  { id: "308", name: "Grenada",                         aliases: [] },
  { id: "320", name: "Guatemala",                       aliases: [] },
  { id: "324", name: "Guinea",                          aliases: [] },
  { id: "624", name: "Guinea-Bissau",                   aliases: ["guinea bissau"] },
  { id: "328", name: "Guyana",                          aliases: [] },
  { id: "332", name: "Haiti",                           aliases: [] },
  { id: "340", name: "Honduras",                        aliases: [] },
  { id: "348", name: "Hungary",                         aliases: [] },
  { id: "352", name: "Iceland",                         aliases: [] },
  { id: "356", name: "India",                           aliases: ["bharat", "hindustan"] },
  { id: "360", name: "Indonesia",                       aliases: [] },
  { id: "364", name: "Iran",                            aliases: ["persia"] },
  { id: "368", name: "Iraq",                            aliases: [] },
  { id: "372", name: "Ireland",                         aliases: ["eire", "republic of ireland"] },
  { id: "376", name: "Israel",                          aliases: [] },
  { id: "380", name: "Italy",                           aliases: ["italia"] },
  { id: "384", name: "Ivory Coast",                     aliases: ["cote divoire", "cote d ivoire", "cote d'ivoire"] },
  { id: "388", name: "Jamaica",                         aliases: [] },
  { id: "392", name: "Japan",                           aliases: ["nippon", "nihon"] },
  { id: "400", name: "Jordan",                          aliases: [] },
  { id: "398", name: "Kazakhstan",                      aliases: [] },
  { id: "404", name: "Kenya",                           aliases: [] },
  { id: "296", name: "Kiribati",                        aliases: [] },
  { id: "383", name: "Kosovo",                          aliases: [] },
  { id: "414", name: "Kuwait",                          aliases: [] },
  { id: "417", name: "Kyrgyzstan",                      aliases: ["kyrgyz republic", "kirghizia"] },
  { id: "418", name: "Laos",                            aliases: ["lao", "lao pdr"] },
  { id: "428", name: "Latvia",                          aliases: [] },
  { id: "422", name: "Lebanon",                         aliases: [] },
  { id: "426", name: "Lesotho",                         aliases: [] },
  { id: "430", name: "Liberia",                         aliases: [] },
  { id: "434", name: "Libya",                           aliases: [] },
  { id: "438", name: "Liechtenstein",                   aliases: [] },
  { id: "440", name: "Lithuania",                       aliases: [] },
  { id: "442", name: "Luxembourg",                      aliases: [] },
  { id: "450", name: "Madagascar",                      aliases: [] },
  { id: "454", name: "Malawi",                          aliases: ["nyasaland"] },
  { id: "458", name: "Malaysia",                        aliases: [] },
  { id: "462", name: "Maldives",                        aliases: [] },
  { id: "466", name: "Mali",                            aliases: [] },
  { id: "470", name: "Malta",                           aliases: [] },
  { id: "584", name: "Marshall Islands",                aliases: ["marshall"] },
  { id: "478", name: "Mauritania",                      aliases: [] },
  { id: "480", name: "Mauritius",                       aliases: [] },
  { id: "484", name: "Mexico",                          aliases: [] },
  { id: "583", name: "Micronesia",                      aliases: ["federated states of micronesia", "fsm"] },
  { id: "498", name: "Moldova",                         aliases: ["republic of moldova"] },
  { id: "492", name: "Monaco",                          aliases: [] },
  { id: "496", name: "Mongolia",                        aliases: [] },
  { id: "499", name: "Montenegro",                      aliases: [] },
  { id: "504", name: "Morocco",                         aliases: [] },
  { id: "508", name: "Mozambique",                      aliases: [] },
  { id: "104", name: "Myanmar",                         aliases: ["burma"] },
  { id: "516", name: "Namibia",                         aliases: [] },
  { id: "520", name: "Nauru",                           aliases: [] },
  { id: "524", name: "Nepal",                           aliases: [] },
  { id: "528", name: "Netherlands",                     aliases: ["holland", "nederland"] },
  { id: "554", name: "New Zealand",                     aliases: ["nz", "aotearoa"] },
  { id: "558", name: "Nicaragua",                       aliases: [] },
  { id: "562", name: "Niger",                           aliases: [] },
  { id: "566", name: "Nigeria",                         aliases: [] },
  { id: "408", name: "North Korea",                     aliases: ["dprk", "democratic peoples republic of korea"] },
  { id: "807", name: "North Macedonia",                 aliases: ["macedonia", "fyrom", "former yugoslav republic of macedonia"] },
  { id: "578", name: "Norway",                          aliases: ["norge"] },
  { id: "512", name: "Oman",                            aliases: [] },
  { id: "586", name: "Pakistan",                        aliases: [] },
  { id: "585", name: "Palau",                           aliases: [] },
  { id: "275", name: "Palestine",                       aliases: ["palestinian territories", "west bank"] },
  { id: "591", name: "Panama",                          aliases: [] },
  { id: "598", name: "Papua New Guinea",                aliases: ["png", "papua"] },
  { id: "600", name: "Paraguay",                        aliases: [] },
  { id: "604", name: "Peru",                            aliases: [] },
  { id: "608", name: "Philippines",                     aliases: ["pilipinas"] },
  { id: "616", name: "Poland",                          aliases: ["polska"] },
  { id: "620", name: "Portugal",                        aliases: [] },
  { id: "634", name: "Qatar",                           aliases: [] },
  { id: "642", name: "Romania",                         aliases: ["rumania"] },
  { id: "643", name: "Russia",                          aliases: ["russian federation"] },
  { id: "646", name: "Rwanda",                          aliases: [] },
  { id: "659", name: "Saint Kitts and Nevis",           aliases: ["st kitts", "st kitts and nevis", "saint kitts"] },
  { id: "662", name: "Saint Lucia",                     aliases: ["st lucia"] },
  { id: "670", name: "Saint Vincent and the Grenadines",aliases: ["st vincent", "saint vincent", "st vincent and the grenadines"] },
  { id: "882", name: "Samoa",                           aliases: ["western samoa"] },
  { id: "674", name: "San Marino",                      aliases: [] },
  { id: "678", name: "Sao Tome and Principe",           aliases: ["sao tome"] },
  { id: "682", name: "Saudi Arabia",                    aliases: ["ksa"] },
  { id: "686", name: "Senegal",                         aliases: [] },
  { id: "688", name: "Serbia",                          aliases: [] },
  { id: "690", name: "Seychelles",                      aliases: [] },
  { id: "694", name: "Sierra Leone",                    aliases: [] },
  { id: "702", name: "Singapore",                       aliases: [] },
  { id: "703", name: "Slovakia",                        aliases: ["slovak republic"] },
  { id: "705", name: "Slovenia",                        aliases: [] },
  { id: "90",  name: "Solomon Islands",                 aliases: ["solomons"] },
  { id: "706", name: "Somalia",                         aliases: [] },
  { id: "710", name: "South Africa",                    aliases: ["rsa"] },
  { id: "410", name: "South Korea",                     aliases: ["korea", "republic of korea", "rok"] },
  { id: "728", name: "South Sudan",                     aliases: [] },
  { id: "724", name: "Spain",                           aliases: ["espana"] },
  { id: "144", name: "Sri Lanka",                       aliases: ["ceylon"] },
  { id: "729", name: "Sudan",                           aliases: [] },
  { id: "740", name: "Suriname",                        aliases: [] },
  { id: "752", name: "Sweden",                          aliases: ["sverige"] },
  { id: "756", name: "Switzerland",                     aliases: ["swiss", "suisse"] },
  { id: "760", name: "Syria",                           aliases: [] },
  { id: "158", name: "Taiwan",                          aliases: ["roc", "formosa", "republic of china"] },
  { id: "762", name: "Tajikistan",                      aliases: [] },
  { id: "834", name: "Tanzania",                        aliases: [] },
  { id: "764", name: "Thailand",                        aliases: ["siam"] },
  { id: "626", name: "Timor-Leste",                     aliases: ["east timor", "timor leste"] },
  { id: "768", name: "Togo",                            aliases: [] },
  { id: "776", name: "Tonga",                           aliases: [] },
  { id: "780", name: "Trinidad and Tobago",             aliases: ["trinidad", "tobago"] },
  { id: "788", name: "Tunisia",                         aliases: [] },
  { id: "792", name: "Turkey",                          aliases: ["turkiye"] },
  { id: "795", name: "Turkmenistan",                    aliases: [] },
  { id: "798", name: "Tuvalu",                          aliases: [] },
  { id: "800", name: "Uganda",                          aliases: [] },
  { id: "804", name: "Ukraine",                         aliases: [] },
  { id: "784", name: "United Arab Emirates",            aliases: ["uae", "emirates"] },
  { id: "826", name: "United Kingdom",                  aliases: ["uk", "great britain", "britain", "england", "gb"] },
  { id: "840", name: "United States",                   aliases: ["usa", "us", "america", "united states of america"] },
  { id: "858", name: "Uruguay",                         aliases: [] },
  { id: "860", name: "Uzbekistan",                      aliases: [] },
  { id: "548", name: "Vanuatu",                         aliases: [] },
  { id: "336", name: "Vatican City",                    aliases: ["holy see", "vatican"] },
  { id: "862", name: "Venezuela",                       aliases: [] },
  { id: "704", name: "Vietnam",                         aliases: ["viet nam"] },
  { id: "887", name: "Yemen",                           aliases: [] },
  { id: "894", name: "Zambia",                          aliases: [] },
  { id: "716", name: "Zimbabwe",                        aliases: [] },
];

// Build lookup once at module level
const LOOKUP = {};
for (const c of ALL_COUNTRIES) {
  LOOKUP[normalize(c.name)] = c;
  for (const a of c.aliases) {
    const key = normalize(a);
    if (!LOOKUP[key]) LOOKUP[key] = c;
  }
}
for (const k of Object.keys(LOOKUP)) LOOKUP_KEYS.push(k);

function fuzzyLookup(input) {
  const norm = normalize(input);
  if (LOOKUP[norm]) return LOOKUP[norm]; // exact match first
  // Only attempt fuzzy on Enter (caller checks length), min 3 chars to avoid noise
  if (norm.length < 3) return null;
  for (const key of LOOKUP_KEYS) {
    if (editDistance(norm, key) === 1) return LOOKUP[key];
  }
  return null;
}

const TOTAL = ALL_COUNTRIES.length;

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const PREVIEW_MODE = false;

// ── Leaderboard (localStorage) ───────────────────────────────────────────────
const SUPABASE_URL = "https://trxxtjilifjuqqunuzrl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeHh0amlsaWZqdXFxdW51enJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2OTI2NjAsImV4cCI6MjA5ODI2ODY2MH0.FreDn50gPRwZ9ULk9lGQtf2D3lG_a7hd_dDgz_wAma0";
const SB_HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

async function loadLeaderboard() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/COTE?select=*&order=score.desc&limit=10`, { headers: SB_HEADERS });
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

async function addLeaderboardEntry(name, countries, seconds) {
  // Writes go through the submit-score Edge Function: it computes the score
  // server-side (so it can't be forged), validates, and does the keep-best
  // upsert. Direct table writes are blocked by Row Level Security; only reads
  // are public. The function returns the fresh top-10 to render.
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-score`, {
      method: "POST",
      headers: SB_HEADERS,
      body: JSON.stringify({ game: "cote", name, countries, seconds }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.leaderboard)) return data.leaderboard;
    }
  } catch {}
  return loadLeaderboard();
}

// ── Topographical country colours (matte but vibrant) ────────────────────────
// 9 biome categories:
// tropicalForest=#2e7a40  temperate=#4e9040    mediterranean=#7aaa38
// savanna=#98b828         steppe=#c4b018       desert=#cc9820
// mountain=#9a6a30        tundra=#5a8888       island=#309858
const TOPO_COLOR = {
  // Africa
  "12":"#cc9820", // Algeria — Sahara desert
  "24":"#98b828", // Angola — savanna
  "204":"#98b828",// Benin — savanna
  "72":"#cc9820", // Botswana — Kalahari desert
  "854":"#98b828",// Burkina Faso — savanna
  "108":"#98b828",// Burundi — savanna highland
  "120":"#2e7a40",// Cameroon — tropical
  "132":"#309858",// Cape Verde — island
  "140":"#2e7a40",// CAR — tropical
  "148":"#cc9820",// Chad — desert/sahel
  "174":"#309858",// Comoros — island
  "178":"#2e7a40",// Congo Republic — tropical
  "180":"#2e7a40",// DR Congo — tropical
  "262":"#cc9820",// Djibouti — arid desert
  "818":"#cc9820",// Egypt — Sahara desert
  "226":"#2e7a40",// Equatorial Guinea — tropical
  "232":"#98b828",// Eritrea — savanna/arid
  "748":"#9a6a30",// Eswatini — highland
  "231":"#98b828",// Ethiopia — savanna highland
  "266":"#2e7a40",// Gabon — tropical
  "270":"#98b828",// Gambia — savanna
  "288":"#2e7a40",// Ghana — tropical
  "324":"#2e7a40",// Guinea — tropical
  "624":"#98b828",// Guinea-Bissau — savanna
  "384":"#2e7a40",// Ivory Coast — tropical
  "404":"#98b828",// Kenya — savanna
  "426":"#9a6a30",// Lesotho — highland mountain
  "430":"#2e7a40",// Liberia — tropical
  "434":"#cc9820",// Libya — Sahara desert
  "450":"#309858",// Madagascar — island
  "454":"#98b828",// Malawi — savanna
  "466":"#cc9820",// Mali — desert/sahel
  "478":"#cc9820",// Mauritania — desert
  "480":"#309858",// Mauritius — island
  "504":"#7aaa38",// Morocco — mediterranean
  "508":"#98b828",// Mozambique — savanna
  "516":"#cc9820",// Namibia — desert
  "562":"#cc9820",// Niger — Sahara desert
  "566":"#2e7a40",// Nigeria — tropical
  "646":"#98b828",// Rwanda — savanna highland
  "678":"#309858",// Sao Tome — island
  "686":"#98b828",// Senegal — savanna
  "690":"#309858",// Seychelles — island
  "694":"#2e7a40",// Sierra Leone — tropical
  "706":"#cc9820",// Somalia — desert/arid
  "710":"#7aaa38",// South Africa — mediterranean/mixed
  "728":"#98b828",// South Sudan — savanna
  "729":"#cc9820",// Sudan — desert
  "834":"#98b828",// Tanzania — savanna
  "768":"#98b828",// Togo — savanna
  "788":"#7aaa38",// Tunisia — mediterranean
  "800":"#98b828",// Uganda — savanna
  "894":"#98b828",// Zambia — savanna
  "716":"#98b828",// Zimbabwe — savanna
  // Asia
  "4":"#9a6a30",  // Afghanistan — mountain
  "48":"#309858", // Bahrain — island/coastal
  "50":"#2e7a40", // Bangladesh — tropical delta
  "64":"#9a6a30", // Bhutan — mountain
  "96":"#2e7a40", // Brunei — tropical
  "116":"#2e7a40",// Cambodia — tropical
  "156":"#4e9040",// China — temperate
  "356":"#98b828",// India — savanna/tropical mix
  "360":"#2e7a40",// Indonesia — tropical
  "364":"#9a6a30",// Iran — mountain/plateau
  "368":"#cc9820",// Iraq — desert
  "376":"#7aaa38",// Israel — mediterranean
  "392":"#309858",// Japan — island/temperate
  "400":"#cc9820",// Jordan — desert
  "398":"#c4b018",// Kazakhstan — steppe
  "414":"#cc9820",// Kuwait — desert
  "417":"#9a6a30",// Kyrgyzstan — mountain
  "418":"#2e7a40",// Laos — tropical
  "422":"#7aaa38",// Lebanon — mediterranean
  "458":"#2e7a40",// Malaysia — tropical
  "462":"#309858",// Maldives — island
  "496":"#c4b018",// Mongolia — steppe
  "104":"#2e7a40",// Myanmar — tropical
  "524":"#9a6a30",// Nepal — mountain
  "408":"#4e9040",// North Korea — temperate
  "512":"#cc9820",// Oman — desert
  "586":"#cc9820",// Pakistan — desert/mountain
  "275":"#7aaa38",// Palestine — mediterranean
  "608":"#309858",// Philippines — island/tropical
  "634":"#cc9820",// Qatar — desert
  "682":"#cc9820",// Saudi Arabia — desert
  "702":"#309858",// Singapore — island
  "410":"#4e9040",// South Korea — temperate
  "144":"#309858",// Sri Lanka — island/tropical
  "760":"#cc9820",// Syria — desert/semi-arid
  "158":"#309858",// Taiwan — island
  "762":"#9a6a30",// Tajikistan — mountain
  "764":"#2e7a40",// Thailand — tropical
  "626":"#309858",// Timor-Leste — island
  "792":"#7aaa38",// Turkey — mediterranean
  "795":"#cc9820",// Turkmenistan — desert
  "784":"#cc9820",// UAE — desert
  "860":"#c4b018",// Uzbekistan — steppe
  "704":"#2e7a40",// Vietnam — tropical
  "887":"#cc9820",// Yemen — desert
  // Europe
  "8":"#7aaa38",  // Albania — mediterranean
  "20":"#9a6a30", // Andorra — mountain
  "51":"#9a6a30", // Armenia — mountain
  "40":"#9a6a30", // Austria — mountain/alpine
  "31":"#9a6a30", // Azerbaijan — mountain
  "112":"#4e9040",// Belarus — temperate
  "56":"#4e9040", // Belgium — temperate
  "70":"#9a6a30", // Bosnia — mountain
  "100":"#4e9040",// Bulgaria — temperate
  "191":"#7aaa38",// Croatia — mediterranean
  "196":"#309858",// Cyprus — island/mediterranean
  "203":"#4e9040",// Czech Republic — temperate
  "208":"#4e9040",// Denmark — temperate
  "233":"#5a8888",// Estonia — tundra/boreal
  "246":"#5a8888",// Finland — tundra/boreal
  "250":"#4e9040",// France — temperate
  "268":"#9a6a30",// Georgia — mountain
  "276":"#4e9040",// Germany — temperate
  "300":"#7aaa38",// Greece — mediterranean
  "348":"#4e9040",// Hungary — temperate
  "352":"#5a8888",// Iceland — tundra/volcanic
  "372":"#309858",// Ireland — island/atlantic
  "380":"#7aaa38",// Italy — mediterranean
  "383":"#9a6a30",// Kosovo — mountain
  "428":"#5a8888",// Latvia — boreal
  "438":"#9a6a30",// Liechtenstein — mountain
  "440":"#4e9040",// Lithuania — temperate
  "442":"#4e9040",// Luxembourg — temperate
  "470":"#309858",// Malta — island/mediterranean
  "498":"#4e9040",// Moldova — temperate
  "492":"#7aaa38",// Monaco — mediterranean
  "499":"#9a6a30",// Montenegro — mountain
  "528":"#4e9040",// Netherlands — temperate
  "807":"#9a6a30",// North Macedonia — mountain
  "578":"#5a8888",// Norway — tundra/fjord
  "616":"#4e9040",// Poland — temperate
  "620":"#7aaa38",// Portugal — mediterranean
  "642":"#4e9040",// Romania — temperate
  "643":"#5a8888",// Russia — tundra/boreal
  "674":"#7aaa38",// San Marino — mediterranean
  "688":"#4e9040",// Serbia — temperate
  "703":"#9a6a30",// Slovakia — mountain
  "705":"#9a6a30",// Slovenia — mountain
  "724":"#7aaa38",// Spain — mediterranean
  "752":"#5a8888",// Sweden — tundra/boreal
  "756":"#9a6a30",// Switzerland — alpine
  "804":"#4e9040",// Ukraine — temperate
  "826":"#309858",// UK — island/atlantic
  "336":"#7aaa38",// Vatican — mediterranean
  // North America
  "28":"#309858", // Antigua — island
  "44":"#309858", // Bahamas — island
  "52":"#309858", // Barbados — island
  "84":"#2e7a40", // Belize — tropical
  "124":"#5a8888",// Canada — tundra/boreal
  "188":"#2e7a40",// Costa Rica — tropical
  "192":"#309858",// Cuba — island/tropical
  "212":"#309858",// Dominica — island
  "214":"#309858",// Dominican Republic — island
  "222":"#2e7a40",// El Salvador — tropical
  "308":"#309858",// Grenada — island
  "320":"#2e7a40",// Guatemala — tropical
  "332":"#309858",// Haiti — island
  "340":"#2e7a40",// Honduras — tropical
  "388":"#309858",// Jamaica — island/tropical
  "484":"#c4b018",// Mexico — steppe/highland mix
  "558":"#2e7a40",// Nicaragua — tropical
  "591":"#2e7a40",// Panama — tropical
  "659":"#309858",// Saint Kitts — island
  "662":"#309858",// Saint Lucia — island
  "670":"#309858",// Saint Vincent — island
  "780":"#309858",// Trinidad — island
  "840":"#4e9040",// USA — temperate
  // South America
  "32":"#c4b018", // Argentina — steppe/pampas
  "68":"#9a6a30", // Bolivia — mountain/altiplano
  "76":"#2e7a40", // Brazil — tropical
  "152":"#9a6a30",// Chile — mountain/Andes
  "170":"#2e7a40",// Colombia — tropical
  "218":"#2e7a40",// Ecuador — tropical
  "328":"#2e7a40",// Guyana — tropical
  "600":"#98b828",// Paraguay — savanna
  "604":"#9a6a30",// Peru — mountain/Andes
  "740":"#2e7a40",// Suriname — tropical
  "858":"#4e9040",// Uruguay — temperate
  "862":"#2e7a40",// Venezuela — tropical
  // Oceania
  "36":"#cc9820", // Australia — desert/outback
  "242":"#309858",// Fiji — island
  "296":"#309858",// Kiribati — island
  "584":"#309858",// Marshall Islands — island
  "583":"#309858",// Micronesia — island
  "520":"#309858",// Nauru — island
  "554":"#309858",// New Zealand — island/temperate
  "585":"#309858",// Palau — island
  "598":"#2e7a40",// Papua New Guinea — tropical
  "882":"#309858",// Samoa — island
  "90":"#2e7a40", // Solomon Islands — tropical
  "776":"#309858",// Tonga — island
  "798":"#309858",// Tuvalu — island
  "548":"#309858",// Vanuatu — island
};

// ── Continent assignments ────────────────────────────────────────────────────
const CONTINENT_OF = {
  // Africa
  "12":"africa","24":"africa","204":"africa","72":"africa","854":"africa",
  "108":"africa","120":"africa","132":"africa","140":"africa","148":"africa",
  "174":"africa","178":"africa","180":"africa","262":"africa","818":"africa",
  "226":"africa","232":"africa","748":"africa","231":"africa","266":"africa",
  "270":"africa","288":"africa","324":"africa","624":"africa","384":"africa",
  "404":"africa","426":"africa","430":"africa","434":"africa","450":"africa",
  "454":"africa","466":"africa","478":"africa","480":"africa","504":"africa",
  "508":"africa","516":"africa","562":"africa","566":"africa","646":"africa",
  "678":"africa","686":"africa","690":"africa","694":"africa","706":"africa",
  "710":"africa","728":"africa","729":"africa","834":"africa","768":"africa",
  "788":"africa","800":"africa","894":"africa","716":"africa",
  // Asia
  "4":"asia","48":"asia","50":"asia","64":"asia","96":"asia","116":"asia",
  "156":"asia","356":"asia","360":"asia","364":"asia","368":"asia","376":"asia",
  "392":"asia","400":"asia","398":"asia","414":"asia","417":"asia","418":"asia",
  "422":"asia","458":"asia","462":"asia","496":"asia","104":"asia","524":"asia",
  "408":"asia","512":"asia","586":"asia","275":"asia","608":"asia","634":"asia",
  "682":"asia","702":"asia","410":"asia","144":"asia","760":"asia","158":"asia",
  "762":"asia","764":"asia","626":"asia","792":"asia","795":"asia","784":"asia",
  "860":"asia","704":"asia","887":"asia",
  // Europe
  "8":"europe","20":"europe","51":"europe","40":"europe","31":"europe",
  "112":"europe","56":"europe","70":"europe","100":"europe","191":"europe",
  "196":"europe","203":"europe","208":"europe","233":"europe","246":"europe",
  "250":"europe","268":"europe","276":"europe","300":"europe","348":"europe",
  "352":"europe","372":"europe","380":"europe","383":"europe","428":"europe",
  "438":"europe","440":"europe","442":"europe","470":"europe","498":"europe",
  "492":"europe","499":"europe","528":"europe","807":"europe","578":"europe",
  "616":"europe","620":"europe","642":"europe","643":"europe","674":"europe",
  "688":"europe","703":"europe","705":"europe","724":"europe","752":"europe",
  "756":"europe","804":"europe","826":"europe","336":"europe",
  // North America
  "28":"north_america","44":"north_america","52":"north_america","84":"north_america",
  "124":"north_america","188":"north_america","192":"north_america","212":"north_america",
  "214":"north_america","222":"north_america","308":"north_america","320":"north_america",
  "332":"north_america","340":"north_america","388":"north_america","484":"north_america",
  "558":"north_america","591":"north_america","659":"north_america","662":"north_america",
  "670":"north_america","780":"north_america","840":"north_america",
  // South America
  "32":"south_america","68":"south_america","76":"south_america","152":"south_america",
  "170":"south_america","218":"south_america","328":"south_america","600":"south_america",
  "604":"south_america","740":"south_america","858":"south_america","862":"south_america",
  // Oceania
  "36":"oceania","242":"oceania","296":"oceania","584":"oceania","583":"oceania",
  "520":"oceania","554":"oceania","585":"oceania","598":"oceania","882":"oceania",
  "90":"oceania","776":"oceania","798":"oceania","548":"oceania",
};

const CONTINENTS = [
  { key: "north_america", label: "N. America" },
  { key: "south_america", label: "S. America" },
  { key: "europe",        label: "Europe"     },
  { key: "asia",          label: "Asia"       },
  { key: "africa",        label: "Africa"     },
  { key: "oceania",       label: "Oceania"    },
];

const BY_CONTINENT = Object.fromEntries(
  CONTINENTS.map(({ key }) => [
    key,
    ALL_COUNTRIES
      .filter(c => CONTINENT_OF[c.id] === key)
      .sort((a, b) => a.name.localeCompare(b.name)),
  ])
);

// ── Timer modes ──────────────────────────────────────────────────────────────
const TIMER_MODES = [
  { label: "10 min", total: 600  },
  { label: "20 min", total: 1200 },
  { label: "30 min", total: 1800 },
  { label: "∞",      total: null },
];

// ── Design tokens — deep space palette ───────────────────────────────────────
const C = {
  bg:          "#080808",
  surface:     "#080808",
  surfaceAlt:  "#0e0e0e",

  border:      "rgba(255,255,255,0.06)",
  borderBold:  "rgba(255,255,255,0.10)",

  white:       "#ffffff",
  text:        "#ffffff",
  textCream:   "#ffffff",
  textMuted:   "#888888",
  textDim:     "#333333",

  accent:      "#ffffff",
  accentLight: "#ffffff",
  accentGlow:  "rgba(255,255,255,0.12)",
  accentDim:   "rgba(255,255,255,0.07)",

  gold:        "#f59e0b",

  landDark:    "#4a5568",
  landBorder:  "#374151",

  foundBg:     "#0a1f14",
  foundBorder: "#16a34a",
  foundText:   "#86efac",

  missBg:      "#1a0a0a",
  missBorder:  "#dc2626",
  missText:    "#fca5a5",

  timeWarn:    "#ef4444",
  taupe:       "#e2e8f0",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
  @keyframes cote-badge-in {
    from { opacity:0; transform:translateX(-50%) translateY(-8px) scale(0.95); }
    to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes cote-modal-in {
    from { opacity:0; transform:scale(0.96) translateY(8px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes cote-pulse-green {
    0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,0.5); }
    50%      { box-shadow:0 0 0 8px rgba(34,197,94,0); }
  }
  @keyframes cote-shake {
    0%,100% { transform:translateX(0); }
    20%     { transform:translateX(-5px); }
    40%     { transform:translateX(5px); }
    60%     { transform:translateX(-4px); }
    80%     { transform:translateX(4px); }
  }
  @keyframes cote-timer-warn {
    0%,100% { opacity:1; }
    50%     { opacity:0.5; }
  }
  .cote-input { transition: border-color .15s, box-shadow .15s; }
  .cote-input:focus {
    border-color: rgba(255,255,255,0.4) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.08) !important;
    outline: none;
  }
  .cote-input-shake { animation: cote-shake 0.35s cubic-bezier(.36,.07,.19,.97); border-color: rgba(220,38,38,0.7) !important; }
  .cote-btn { transition: background .15s, border-color .15s, transform .1s, opacity .15s; }
  .cote-btn:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.18) !important; }
  .cote-btn:active { transform: scale(0.97); }
  .cote-btn-primary:hover { opacity: 0.9 !important; }
  .cote-btn-primary:active { transform: scale(0.97); }
  .cote-tab { transition: color .15s, border-color .15s, background .15s; }
  .cote-tab:hover { color: #ffffff !important; }
  .cote-timer-pill { transition: background .15s, color .15s, border-color .15s; }
  .cote-timer-pill:hover:not(.cote-timer-active) { background: rgba(255,255,255,0.05) !important; color: #ffffff !important; }
  .cote-chip { transition: background .25s, color .25s, border-color .25s; }
  .cote-region-row { transition: background .15s; }
  .cote-region-row:hover { background: rgba(255,255,255,0.04) !important; }
  .cote-suggest-btn { transition: background .15s, border-color .15s, transform .1s; }
  .cote-suggest-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.3) !important; color: #ffffff !important; }
  .cote-suggest-btn:active { transform: scale(0.97); }
  .cote-timer-warn { animation: cote-timer-warn 1s ease-in-out infinite; }
  .cote-timer-critical { animation: cote-timer-warn 0.4s ease-in-out infinite; color: #ef4444 !important; }
`;

export default function WorldCountriesGame() {
  // inject global CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch(_){} };
  }, []);

  const svgRef         = useRef(null);
  const guessedRef     = useRef(new Set());
  const lastFoundTimer = useRef(null);
  const feedbackTimer  = useRef(null);

  const [worldGeo,   setWorldGeo]   = useState(null);
  const [guessedIds, setGuessedIds] = useState(new Set());
  const [input,      setInput]      = useState("");
  const [seconds,    setSeconds]    = useState(0);
  const [gameState,  setGameState]  = useState("idle");
  const [lastFound,  setLastFound]  = useState(null);
  const [timerIdx,        setTimerIdx]        = useState(3);
  const [activeTab,       setActiveTab]       = useState("north_america");
  const [showWelcome,      setShowWelcome]      = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCredits,      setShowCredits]      = useState(false);
  const [expandedRegion,   setExpandedRegion]   = useState(null);
  const [showLeaderboard,  setShowLeaderboard]  = useState(false);
  const [lbEntries,        setLbEntries]        = useState([]);
  const [lbLoading,        setLbLoading]        = useState(false);
  const [playerName,       setPlayerName]       = useState("");
  const [shareStatus,      setShareStatus]      = useState(null);
  const [suggestion,       setSuggestion]       = useState(null); // { name, country } | null
  const [feedback,         setFeedback]         = useState(null); // { msg, type: 'good'|'bad' }

  const timerMode    = TIMER_MODES[timerIdx];
  const isCountdown  = timerMode.total !== null;
  const displaySecs  = isCountdown ? Math.max(0, timerMode.total - seconds) : seconds;
  const timeWarning  = isCountdown && displaySecs <= 60 && gameState === "playing";
  const timeCritical = isCountdown && displaySecs <= 10 && gameState === "playing";

  // ── Load map data ──
  useEffect(() => {
    const el = document.createElement("script");
    el.src = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
    el.onload = () => {
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(r => r.json())
        .then(world => setWorldGeo(window.topojson.feature(world, world.objects.countries)));
    };
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch (_) {} };
  }, []);

  // ── Draw globe ──
  useEffect(() => {
    if (!worldGeo || !svgRef.current) return;
    const W = 960, H = 500;
    const BASE_R = 246;
    const CX = W / 2, CY = H / 2;
    const svgEl = svgRef.current;
    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${W} ${H}`);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Ocean — lit from upper-left
    const oceanGrad = defs.append("radialGradient")
      .attr("id", "oceanDepth").attr("cx", "36%").attr("cy", "30%").attr("r", "75%");
    oceanGrad.append("stop").attr("offset", "0%").attr("stop-color", "#2a6898");
    oceanGrad.append("stop").attr("offset", "45%").attr("stop-color", "#0e3860");
    oceanGrad.append("stop").attr("offset", "100%").attr("stop-color", "#040d20");

    // Atmosphere halo
    const atmosGrad = defs.append("radialGradient")
      .attr("id", "atmos").attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
    atmosGrad.append("stop").attr("offset", "88%").attr("stop-color", "transparent");
    atmosGrad.append("stop").attr("offset", "97%").attr("stop-color", "#ffffff").attr("stop-opacity", "0.04");
    atmosGrad.append("stop").attr("offset", "100%").attr("stop-color", "#000000").attr("stop-opacity", "0.5");

    // Terminator shadow — dark side (lower-right)
    const shadowGrad = defs.append("radialGradient")
      .attr("id", "terminator").attr("cx", "72%").attr("cy", "68%").attr("r", "68%");
    shadowGrad.append("stop").attr("offset", "0%").attr("stop-color", "#000000").attr("stop-opacity", "0.72");
    shadowGrad.append("stop").attr("offset", "55%").attr("stop-color", "#000000").attr("stop-opacity", "0.28");
    shadowGrad.append("stop").attr("offset", "100%").attr("stop-color", "transparent");

    // Specular highlight — bright spot on lit side (upper-left)
    const specGrad = defs.append("radialGradient")
      .attr("id", "specular").attr("cx", "33%").attr("cy", "27%").attr("r", "45%");
    specGrad.append("stop").attr("offset", "0%").attr("stop-color", "white").attr("stop-opacity", "0.14");
    specGrad.append("stop").attr("offset", "60%").attr("stop-color", "white").attr("stop-opacity", "0.03");
    specGrad.append("stop").attr("offset", "100%").attr("stop-color", "transparent");

    // Edge darkening — deepens the globe rim for depth
    const rimGrad = defs.append("radialGradient")
      .attr("id", "rim").attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
    rimGrad.append("stop").attr("offset", "65%").attr("stop-color", "transparent");
    rimGrad.append("stop").attr("offset", "100%").attr("stop-color", "#000000").attr("stop-opacity", "0.55");

    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#0c0c0c");

    const atmosCircle = svg.append("circle").attr("class", "atmos")
      .attr("cx", CX).attr("cy", CY).attr("r", BASE_R + 10).attr("fill", "url(#atmos)");
    const oceanCircle = svg.append("circle").attr("class", "ocean")
      .attr("cx", CX).attr("cy", CY).attr("r", BASE_R).attr("fill", "url(#oceanDepth)");

    const proj = d3.geoOrthographic()
      .scale(BASE_R).translate([CX, CY]).clipAngle(90).rotate([0, -20]);
    const path = d3.geoPath().projection(proj);

    svg.append("g").attr("class", "countries")
      .selectAll("path").data(worldGeo.features).join("path")
      .attr("d", path)
      .attr("fill", C.landDark)
      .attr("stroke", "#6a7a6a")
      .attr("stroke-width", "0.7");

    // Labels group — sits between countries and overlays so lighting affects them

    // Overlay layers (drawn on top of countries, scale with globe)
    const terminatorCircle = svg.append("circle").attr("class", "terminator")
      .attr("cx", CX).attr("cy", CY).attr("r", BASE_R).attr("fill", "url(#terminator)");
    const specularCircle = svg.append("circle").attr("class", "specular")
      .attr("cx", CX).attr("cy", CY).attr("r", BASE_R).attr("fill", "url(#specular)");
    const rimCircle = svg.append("circle").attr("class", "rim")
      .attr("cx", CX).attr("cy", CY).attr("r", BASE_R).attr("fill", "url(#rim)");

    // ── Interaction state ──
    let currentRotate = [0, -20];
    let autoRotate = true;
    let isZoomed = false;
    let zoomCentering = false; // true only during initial center-on-click animation
    let zoomTarget = [0, -20];
    let currentScale = BASE_R;
    let targetScale = BASE_R;
    let dragStart = null;

    svgEl.style.cursor = "grab";

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      dragStart = { x: e.clientX, y: e.clientY, rotate: [...currentRotate] };
      zoomCentering = false; // user grabbed — stop auto-centering so drag is free
      svgEl.style.cursor = "grabbing";
    };
    const onMouseMove = (e) => {
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const sens = isZoomed ? 0.175 : 0.35;
      currentRotate = [
        dragStart.rotate[0] + dx * sens,
        Math.max(-85, Math.min(85, dragStart.rotate[1] - dy * sens)),
      ];
    };
    const onMouseUp = () => {
      dragStart = null;
      svgEl.style.cursor = "grab";
    };
    const onDblClick = (e) => {
      e.preventDefault();
      if (!isZoomed) {
        const rect = svgEl.getBoundingClientRect();
        const svgX = (e.clientX - rect.left) * (W / rect.width);
        const svgY = (e.clientY - rect.top) * (H / rect.height);
        const coords = proj.invert([svgX, svgY]);
        if (coords && !isNaN(coords[0])) {
          zoomTarget = [-coords[0], -coords[1]];
          zoomCentering = true;
        }
        targetScale = BASE_R * 3.0;
        isZoomed = true;
        autoRotate = false;
      } else {
        targetScale = BASE_R;
        isZoomed = false;
        zoomCentering = false;
        autoRotate = true;
      }
    };

    svgEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    svgEl.addEventListener("dblclick", onDblClick);

    // ── Animation loop ──
    let animId;
    let lastR0 = null, lastR1 = null, lastScale = null;
    const spin = () => {
      if (!dragStart) {
        if (zoomCentering) {
          currentRotate[0] += (zoomTarget[0] - currentRotate[0]) * 0.06;
          currentRotate[1] += (zoomTarget[1] - currentRotate[1]) * 0.06;
          if (Math.abs(zoomTarget[0] - currentRotate[0]) < 0.1 &&
              Math.abs(zoomTarget[1] - currentRotate[1]) < 0.1) {
            zoomCentering = false;
          }
        } else if (autoRotate) {
          currentRotate[0] += 0.03;
        }
      }
      currentScale += (targetScale - currentScale) * 0.07;

      // Skip re-render if nothing changed (avoids costly path recalc every frame)
      const r0 = Math.round(currentRotate[0] * 100);
      const r1 = Math.round(currentRotate[1] * 100);
      const sc = Math.round(currentScale * 10);
      if (r0 !== lastR0 || r1 !== lastR1 || sc !== lastScale) {
        lastR0 = r0; lastR1 = r1; lastScale = sc;
        proj.scale(currentScale).rotate(currentRotate);
        oceanCircle.attr("r", currentScale);
        atmosCircle.attr("r", currentScale + 4);
        terminatorCircle.attr("r", currentScale);
        specularCircle.attr("r", currentScale);
        rimCircle.attr("r", currentScale);
        svg.select(".countries").selectAll("path").attr("d", path);
      }

      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);

    return () => {
      cancelAnimationFrame(animId);
      svgEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      svgEl.removeEventListener("dblclick", onDblClick);
    };
  }, [worldGeo]);

  // ── Escape key closes modals ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showLeaderboard) { setShowLeaderboard(false); return; }
      if (showCredits)     { setShowCredits(false);     return; }
      if (showInstructions && gameState !== "idle") { setShowInstructions(false); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLeaderboard, showCredits, showInstructions, gameState]);

  // ── Update map colours on guess ──
  useEffect(() => {
    if (!svgRef.current || !worldGeo) return;
    d3.select(svgRef.current).select(".countries").selectAll("path")
      .attr("fill", d => {
        const id = String(+d.id);
        if (PREVIEW_MODE || guessedIds.has(id)) return TOPO_COLOR[id] || "#6b8a5e";
        if (gameState === "finished") return "#4a1010";
        return C.landDark;
      })
      .attr("stroke", d => {
        const id = String(+d.id);
        if (gameState === "finished" && !guessedIds.has(id) && !PREVIEW_MODE) return "#7f1d1d";
        return "#4a5a4a";
      })
      .attr("stroke-width", "0.8");
  }, [guessedIds, worldGeo, gameState]);

  // ── Timer ──
  useEffect(() => {
    if (gameState !== "playing") return;
    const t = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        if (isCountdown && next >= timerMode.total) setGameState("finished");
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState, isCountdown, timerMode]);

  const showFeedback = (msg, type) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ msg, type });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2000);
  };

  const tryGuess = (val, showErrors = false) => {
    // On typing: exact match only (avoids premature triggers mid-word)
    // On Enter (showErrors=true): allow 1-character fuzzy match
    const country = showErrors ? fuzzyLookup(val) : LOOKUP[normalize(val)];
    if (country) {
      if (guessedRef.current.has(country.id)) {
        showFeedback("Already found!", "neutral");
        return false;
      }
      const next = new Set(guessedRef.current);
      next.add(country.id);
      guessedRef.current = next;
      setGuessedIds(next);
      setActiveTab(CONTINENT_OF[country.id]);
      if (lastFoundTimer.current) clearTimeout(lastFoundTimer.current);
      // Check for continent completion or score milestone
      const contKey = CONTINENT_OF[country.id];
      const contLabel = CONTINENTS.find(c => c.key === contKey)?.label || contKey;
      const contCountries = BY_CONTINENT[contKey];
      const contComplete = contCountries.every(c => next.has(c.id));
      const milestones = [25, 50, 100, 150, 175];
      const hitMilestone = milestones.includes(next.size);
      if (contComplete && contCountries.length > 1) {
        setLastFound(`${contLabel} complete!`);
      } else if (hitMilestone) {
        setLastFound(`${next.size} / ${TOTAL} found!`);
      } else {
        setLastFound(country.name);
      }
      lastFoundTimer.current = setTimeout(() => setLastFound(null), contComplete ? 3500 : 2500);
      setFeedback(null);
      if (next.size >= TOTAL) setGameState("finished");
      return true;
    }
    if (showErrors && normalize(val).length > 0) showFeedback("Invalid entry", "bad");
    return false;
  };

  const findSuggestion = (val) => {
    const norm = normalize(val);
    if (norm.length < 3) return null;
    let best = null, bestSim = 0;
    for (const country of ALL_COUNTRIES) {
      if (guessedRef.current.has(country.id)) continue;
      const key = normalize(country.name);
      const maxLen = Math.max(norm.length, key.length);
      const sim = 1 - fullEditDistance(norm, key) / maxLen;
      if (sim >= 0.75 && sim > bestSim && LOOKUP[normalize(val)] !== country) {
        bestSim = sim; best = country;
      }
    }
    return best;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (gameState === "idle" && val.trim()) setGameState("playing");
    if (tryGuess(val)) {
      setInput("");
      setSuggestion(null);
    } else {
      setInput(val);
      setSuggestion(val.trim().length >= 3 ? findSuggestion(val) : null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!tryGuess(input, true)) setInput("");
      else setInput("");
      setSuggestion(null);
    }
  };

  const giveUp = () => setGameState("finished");

  const reset = (force = false) => {
    const count = guessedRef.current.size;
    if (!force && gameState === "playing" && count > 0) {
      if (!window.confirm(`End current game? You've found ${count} countries so far.`)) return;
    }
    guessedRef.current = new Set();
    setGuessedIds(new Set());
    setInput("");
    setSeconds(0);
    setGameState("idle");
    setLastFound(null);
    setShowInstructions(false);
    setShowWelcome(false);
    setShowCredits(false);
  };

  const count   = guessedIds.size;
  const pct     = (count / TOTAL) * 100;
  const perfect = gameState === "finished" && count >= TOTAL;

  // ── shared reusable styles ──
  const overlay = {
    position: "absolute", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const modalCard = {
    background: C.surface,
    border: `1px solid ${C.borderBold}`,
    borderRadius: 14,
    boxShadow: "0 32px 96px rgba(0,0,0,0.8)",
    animation: "cote-modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
  };
  const btnPrimary = {
    width: "100%", padding: "12px 0",
    background: C.white, color: C.bg,
    border: "none", borderRadius: 8,
    fontWeight: 800, fontSize: 14, letterSpacing: "0.07em",
    textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
  };
  const btnGhost = {
    background: "transparent", border: `1px solid ${C.border}`,
    borderRadius: 7, padding: "10px 0",
    color: C.text, fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
  };
  const divider = { width: "100%", height: 1, background: C.border, margin: "16px 0" };

  return (
    <div style={{
      background: C.bg, color: C.text,
      fontFamily: "'Poppins', system-ui, sans-serif",
      height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden",
      position: "relative",
    }}>

      {/* ── Header ── */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 18px", height: 58,
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentDim, border: `1px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={C.accentLight} strokeWidth="1.6"/>
              <ellipse cx="12" cy="12" rx="4" ry="10" stroke={C.accentLight} strokeWidth="1.6"/>
              <line x1="2" y1="12" x2="22" y2="12" stroke={C.accentLight} strokeWidth="1.6"/>
            </svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: "0.1em", textTransform: "uppercase", color: C.white }}>
            COTE
          </span>
        </div>

        <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

        {/* Timer mode selector */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {TIMER_MODES.map((mode, i) => {
            const active = timerIdx === i;
            return (
              <button
                key={i}
                className={`cote-timer-pill${active ? " cote-timer-active" : ""}`}
                onClick={() => { if (gameState === "idle") setTimerIdx(i); }}
                style={{
                  padding: "3px 0", borderRadius: 5,
                  minWidth: 50, textAlign: "center",
                  background: active ? C.accentDim : "transparent",
                  border: `1px solid ${active ? C.accent + "55" : C.border}`,
                  color: active ? C.accentLight : C.textMuted,
                  fontWeight: active ? 700 : 400,
                  fontSize: mode.label === "∞" ? 20 : 11,
                  cursor: gameState !== "idle" && !active ? "default" : "pointer",
                  opacity: gameState !== "idle" && !active ? 0.35 : 1,
                  fontFamily: "inherit",
                }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

        {/* Time display */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>
            {isCountdown ? "Left" : "Time"}
          </div>
          <div
            className={timeCritical ? "cote-timer-critical" : timeWarning ? "cote-timer-warn" : ""}
            style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: timeWarning ? C.timeWarn : C.white, letterSpacing: "0.04em", lineHeight: 1 }}
          >
            {fmt(displaySecs)}
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

        {/* Score */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>Found</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            <span style={{ color: C.white }}>{count}</span>
            <span style={{ color: C.textDim, fontSize: 13 }}> / {TOTAL}</span>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

        <div style={{ flex: 1 }} />

        {/* Buttons */}
        {gameState === "playing" && (
          <button
            className="cote-btn"
            onClick={giveUp}
            style={{
              background: "transparent", border: `1px solid ${C.missBorder}55`,
              borderRadius: 6, padding: "5px 13px",
              color: C.missText, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Give Up
          </button>
        )}
        <button
          className="cote-btn"
          onClick={() => setShowInstructions(true)}
          style={{
            background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "5px 10px",
            color: C.textMuted, fontSize: 15, lineHeight: 1,
            cursor: "pointer", fontFamily: "inherit",
          }}
          title="How to play"
        >
          ⓘ
        </button>
        <button
          className="cote-btn"
          onClick={() => { setShowLeaderboard(true); setLbLoading(true); loadLeaderboard().then(e => { setLbEntries(e); setLbLoading(false); }); }}
          style={{
            background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "6px 10px", lineHeight: 1,
            cursor: "pointer",
          }}
          title="Leaderboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4"/>
            <path d="M17 3H7v8a5 5 0 0 0 10 0V3z"/>
            <path d="M7 5H4a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4"/>
            <path d="M17 5h3a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4"/>
          </svg>
        </button>
        <button
          className="cote-btn"
          onClick={reset}
          style={{
            background: C.surfaceAlt, border: `1px solid ${C.borderBold}`,
            borderRadius: 6, padding: "5px 13px",
            color: C.text, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          New Game
        </button>
      </header>

      {/* ── Progress bar ── */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{
          height: "100%",
          background: perfect
            ? "linear-gradient(90deg, #e2e8f0, #ffffff)"
            : "linear-gradient(90deg, #555555, #ffffff)",
          width: `${pct}%`,
          transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: pct > 0 ? `0 0 8px ${C.accent}55` : "none",
        }} />
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
        {!worldGeo && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.accentDim, border: `1px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke={C.accentLight} strokeWidth="1.5"/>
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke={C.accentLight} strokeWidth="1.5"/>
                <line x1="2" y1="12" x2="22" y2="12" stroke={C.accentLight} strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ color: C.textMuted, fontSize: 13, letterSpacing: "0.04em" }}>Loading map…</span>
          </div>
        )}
        <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid meet" />

        {/* Last-found badge */}
        {lastFound && (() => {
          const isMilestone = lastFound.includes("complete!") || lastFound.includes("/ 197");
          return (
            <div style={{
              position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
              background: isMilestone ? "rgba(20,20,20,0.97)" : "rgba(10,31,20,0.95)",
              border: isMilestone ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(34,197,94,0.5)",
              color: isMilestone ? "#ffffff" : "#86efac",
              padding: isMilestone ? "9px 24px" : "7px 20px",
              borderRadius: 999,
              fontWeight: 700, fontSize: isMilestone ? 14 : 13, letterSpacing: "0.03em",
              boxShadow: isMilestone ? "0 4px 32px rgba(255,255,255,0.15)" : "0 4px 24px rgba(34,197,94,0.2)",
              pointerEvents: "none", whiteSpace: "nowrap",
              animation: "cote-badge-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
              backdropFilter: "blur(8px)",
            }}>
              {isMilestone ? "🎉 " : "✓ "}{lastFound}
            </div>
          );
        })()}

        {/* Perfect banner */}
        {perfect && (
          <div style={{ position: "absolute", inset: 0, ...overlay }}>
            <div style={{ textAlign: "center", animation: "cote-modal-in 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🌍</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.white, letterSpacing: "-0.01em", marginBottom: 8 }}>
                All {TOTAL} countries!
              </div>
              <div style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>
                {isCountdown ? `With ${fmt(displaySecs)} to spare` : `Completed in ${fmt(seconds)}`}
              </div>
              <button
                className="cote-btn-primary"
                onClick={reset}
                style={{ ...btnPrimary, width: "auto", padding: "12px 32px" }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={{
        background: C.surface, borderTop: `1px solid ${C.border}`,
        padding: "12px 20px", flexShrink: 0,
        display: "flex", flexDirection: "column", gap: 7,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            className={`cote-input${feedback?.type === "bad" ? " cote-input-shake" : ""}`}
            type="text" value={input}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder={gameState === "finished" ? "Game over — start a new game!" : "Type a country name…"}
            disabled={gameState === "finished"}
            autoFocus
            style={{
              flex: 1, padding: "10px 16px",
              background: C.bg,
              border: `1px solid ${gameState === "playing" ? "rgba(255,255,255,0.2)" : C.border}`,
              borderRadius: 8, color: C.white, fontSize: 15,
              caretColor: C.accent, fontFamily: "inherit",
            }}
          />
          {!feedback && gameState === "idle" && (
            <span style={{ color: C.textMuted, fontSize: 12, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>Start typing to begin</span>
          )}
          {!feedback && gameState === "finished" && !perfect && (
            <span style={{ color: C.missText, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
              {count} / {TOTAL} found
            </span>
          )}
        </div>
        {(feedback || (suggestion && gameState === "playing")) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4, minHeight: 22 }}>
            {feedback && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: feedback.type === "good" ? "#4ade80" : feedback.type === "bad" ? "#f87171" : "#94a3b8",
                letterSpacing: "0.01em",
              }}>
                {feedback.msg}
              </span>
            )}
            {!feedback && suggestion && gameState === "playing" && (
              <>
                <span style={{ color: C.textMuted, fontSize: 12 }}>Did you mean</span>
                <button
                  className="cote-suggest-btn"
                  onClick={() => { tryGuess(suggestion.name); setInput(""); setSuggestion(null); }}
                  style={{
                    background: C.accentDim, border: `1px solid ${C.accent}44`,
                    borderRadius: 5, padding: "2px 11px",
                    color: C.accentLight, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {suggestion.name}
                </button>
                <span style={{ color: C.textMuted, fontSize: 11 }}>?</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Welcome overlay ── */}
      {showWelcome && (
        <div style={overlay}>
          <div style={{ ...modalCard, padding: "48px 44px", maxWidth: 440, width: "90%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accentDim, border: `1px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={C.accentLight} strokeWidth="1.4"/>
                  <ellipse cx="12" cy="12" rx="4" ry="10" stroke={C.accentLight} strokeWidth="1.4"/>
                  <line x1="2" y1="12" x2="22" y2="12" stroke={C.accentLight} strokeWidth="1.4"/>
                </svg>
              </div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 30, letterSpacing: "0.12em", textTransform: "uppercase", color: C.white, marginBottom: 6 }}>
              COTE
            </div>
            <div style={{ color: C.textMuted, fontSize: 13, letterSpacing: "0.04em", marginBottom: 0 }}>
              Countries of the Earth
            </div>
            <div style={divider} />
            <div style={{ color: C.text, fontSize: 16, fontWeight: 500, marginBottom: 10 }}>Welcome.</div>
            <div style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.75, marginBottom: 32 }}>
              Can you name every country in the world?<br />
              197 countries. One globe. Let's find out.
            </div>
            <button
              className="cote-btn-primary"
              onClick={() => { setShowWelcome(false); setShowInstructions(true); }}
              style={btnPrimary}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Instructions overlay ── */}
      {showInstructions && (
        <div style={overlay}>
          <div style={{ ...modalCard, padding: "36px 40px", maxWidth: 520, width: "90%" }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.05em", textTransform: "uppercase", color: C.white }}>
                How to Play
              </div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Six things to know</div>
            </div>
            <div style={divider} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Name all 197 countries", "Type any country name into the box at the bottom. The game auto-accepts correct answers instantly — no need to press Enter."],
                ["Spin the globe", "Drag anywhere on the globe to rotate it in any direction. Double-click a region to zoom in — double-click again to zoom back out."],
                ["Countries light up", "Each correctly guessed country reveals its topographical color: greens for forests, oranges for deserts, greys for mountains, and more."],
                ["Choose your timer", "Play with 10, 20, or 30 minutes on the clock, or choose ∞ for unlimited time."],
                ["Track by continent", "The panel at the bottom organizes all countries by continent. Guessed countries appear in alphabetical order within each region."],
                ["Give up", "Stuck? Click Give Up at any time to reveal the countries you missed."],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: C.accent, flexShrink: 0, marginTop: 6,
                  }} />
                  <div>
                    <div style={{ color: C.white, fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{title}</div>
                    <div style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.65 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="cote-btn-primary"
              onClick={() => setShowInstructions(false)}
              style={{ ...btnPrimary, marginTop: 28 }}
            >
              Play
            </button>
          </div>
        </div>
      )}

      {/* ── Results popup ── */}
      {gameState === "finished" && !perfect && (
        <div style={overlay}>
          <div style={{ ...modalCard, padding: "28px 32px", maxWidth: 480, width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.03em", color: C.white, marginBottom: 4 }}>
                Session Results
              </div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>Good try!</div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                ["Time Played", fmt(seconds)],
                ["Countries", `${count} / ${TOTAL}`],
                ["Completion", `${Math.round(pct)}%`],
              ].map(([label, value]) => (
                <div key={label} style={{
                  background: C.surfaceAlt, borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  padding: "11px 10px", textAlign: "center",
                }}>
                  <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 17, fontFamily: "monospace" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Continent breakdown */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Breakdown by Region
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {CONTINENTS.map(({ key, label }) => {
                  const countries = BY_CONTINENT[key];
                  const total = countries.length;
                  const guessed = countries.filter(c => guessedIds.has(c.id));
                  const missed  = countries.filter(c => !guessedIds.has(c.id));
                  const found = guessed.length;
                  const pctRegion = Math.round((found / total) * 100);
                  const isOpen = expandedRegion === key;
                  return (
                    <div key={key} style={{ borderRadius: 7, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <button
                        className="cote-region-row"
                        onClick={() => setExpandedRegion(isOpen ? null : key)}
                        style={{
                          width: "100%", background: C.surfaceAlt,
                          border: "none", cursor: "pointer",
                          padding: "9px 12px", display: "flex", alignItems: "center", gap: 10,
                          fontFamily: "inherit",
                        }}
                      >
                        <span style={{ color: C.text, fontSize: 12, fontWeight: 600, flex: 1, textAlign: "left" }}>{label}</span>
                        <span style={{ color: C.textMuted, fontSize: 11 }}>{found} / {total}</span>
                        <div style={{ width: 56, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, flexShrink: 0 }}>
                          <div style={{
                            height: "100%", borderRadius: 2,
                            background: pctRegion === 100 ? C.accent : "rgba(255,255,255,0.3)",
                            width: `${pctRegion}%`,
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                        <svg width="11" height="11" viewBox="0 0 12 12" style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                          <polyline points="2,4 6,8 10,4" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "10px 12px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                          {guessed.length > 0 && (
                            <div style={{ marginBottom: missed.length > 0 ? 10 : 0 }}>
                              <div style={{ color: "#4ade80", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                                Correct ({guessed.length})
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {guessed.map(c => (
                                  <span key={c.id} className="cote-chip" style={{
                                    background: C.foundBg, border: `1px solid ${C.foundBorder}55`,
                                    color: C.foundText, borderRadius: 4, padding: "2px 8px", fontSize: 11,
                                  }}>{c.name}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {missed.length > 0 && (
                            <div>
                              <div style={{ color: "#f87171", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                                Missed ({missed.length})
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {missed.map(c => (
                                  <span key={c.id} className="cote-chip" style={{
                                    background: C.missBg, border: `1px solid ${C.missBorder}55`,
                                    color: C.missText, borderRadius: 4, padding: "2px 8px", fontSize: 11,
                                  }}>{c.name}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Name entry */}
            <input
              className="cote-input"
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name for the leaderboard…"
              maxLength={24}
              style={{
                width: "100%", boxSizing: "border-box",
                background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "10px 14px",
                color: C.white, fontSize: 13,
                fontFamily: "inherit", marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="cote-btn"
                onClick={() => {
                  const modeLabel = TIMER_MODES[timerIdx].label;
                  const text = `COTE 🌍 ${count}/${TOTAL} countries in ${fmt(seconds)} (${modeLabel} mode)\nPlay at: cote.netlify.app`;
                  navigator.clipboard.writeText(text).then(() => {
                    setShareStatus("copied");
                    setTimeout(() => setShareStatus(null), 2500);
                  });
                }}
                style={{ ...btnGhost, flex: 1, fontSize: 12 }}
              >
                {shareStatus === "copied" ? "Copied ✓" : "Share"}
              </button>
              <button
                className="cote-btn-primary"
                onClick={async () => {
                  setShowCredits(true);
                  const updated = await addLeaderboardEntry(playerName.trim() || "Anonymous", count, seconds);
                  setLbEntries(updated);
                }}
                style={{ ...btnPrimary, flex: 2 }}
              >
                Submit Score →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credits page ── */}
      {showCredits && (
        <div style={overlay}>
          <div style={{ ...modalCard, padding: "36px 40px", maxWidth: 490, width: "90%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.accentDim, border: `1px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={C.accentLight} strokeWidth="1.5"/>
                  <ellipse cx="12" cy="12" rx="4" ry="10" stroke={C.accentLight} strokeWidth="1.5"/>
                  <line x1="2" y1="12" x2="22" y2="12" stroke={C.accentLight} strokeWidth="1.5"/>
                </svg>
              </div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: C.white, marginBottom: 6 }}>
              COTE
            </div>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 22 }}>
              Thank you for playing!
            </div>

            {/* About block */}
            <div style={{
              background: C.surfaceAlt, borderRadius: 10,
              border: `1px solid ${C.border}`,
              padding: "18px 22px", marginBottom: 22, textAlign: "left",
            }}>
              <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>About</div>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75, margin: "0 0 12px 0" }}>
                COTE — <em>Countries of the Earth</em> — was created by <strong>Ishaan Hattangady</strong> using <strong>Claude Code</strong> — Anthropic's AI coding tool — without writing a single line of code by hand.
              </p>
              <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.75, margin: 0 }}>
                Inspired by <strong style={{ color: C.text }}>Globle</strong> and <strong style={{ color: C.text }}>World Quiz</strong>, Ishaan wanted to build his own version — combining the visual beauty of a spinning globe with the challenge of naming every country in the world.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="cote-btn" onClick={() => setShowCredits(false)} style={{ ...btnGhost, flex: 1 }}>Back</button>
              <button className="cote-btn" onClick={() => { setShowLeaderboard(true); setLbLoading(true); loadLeaderboard().then(e => { setLbEntries(e); setLbLoading(false); }); }} style={{ ...btnGhost, flex: 2, background: C.surfaceAlt }}>
                Leaderboard
              </button>
              <button className="cote-btn-primary" onClick={() => { reset(); setShowCredits(false); }} style={{ ...btnPrimary, flex: 2 }}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard overlay ── */}
      {showLeaderboard && (() => {
        const entries = lbEntries;
        const medals = ["🥇", "🥈", "🥉"];
        const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
        return (
          <div style={{ ...overlay, zIndex: 110 }}>
            <div style={{ ...modalCard, padding: "28px 32px", maxWidth: 450, width: "90%" }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Top 10 All-Time</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.white }}>Leaderboard</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 22 }}>
                {lbLoading && (
                  <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>Loading…</div>
                )}
                {!lbLoading && entries.length === 0 && (
                  <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>
                    No scores yet — be the first!
                  </div>
                )}
                {!lbLoading && entries.map((entry, i) => {
                  const isTop3 = i < 3;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: isTop3 ? "11px 14px" : "8px 14px",
                      borderRadius: 8,
                      background: isTop3 ? `${medalColors[i]}10` : C.surfaceAlt,
                      border: `1px solid ${isTop3 ? medalColors[i] + "35" : C.border}`,
                    }}>
                      <div style={{ width: 26, textAlign: "center", flexShrink: 0 }}>
                        {isTop3
                          ? <span style={{ fontSize: 17 }}>{medals[i]}</span>
                          : <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                        }
                      </div>
                      <div style={{
                        flex: 1,
                        color: isTop3 ? medalColors[i] : C.text,
                        fontWeight: isTop3 ? 700 : 500,
                        fontSize: isTop3 ? 14 : 13,
                      }}>
                        {entry.name}
                      </div>
                      <div style={{ color: C.textMuted, fontSize: 12, marginRight: 4 }}>
                        {entry.countries} / {TOTAL}
                      </div>
                      <div style={{
                        color: isTop3 ? medalColors[i] : C.textMuted,
                        fontSize: 12, fontFamily: "monospace",
                        fontWeight: isTop3 ? 700 : 400,
                      }}>
                        {fmt(entry.seconds)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="cote-btn-primary" onClick={() => setShowLeaderboard(false)} style={btnPrimary}>
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Continent panel ── */}
      <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>

        {/* Tabs */}
        <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          {CONTINENTS.map(({ key, label }) => {
            const total = BY_CONTINENT[key].length;
            const found = BY_CONTINENT[key].filter(c => guessedIds.has(c.id)).length;
            const active = activeTab === key;
            const complete = found === total && total > 0;
            return (
              <button
                key={key}
                className="cote-tab"
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, padding: "6px 4px",
                  background: active ? C.surfaceAlt : "transparent",
                  border: "none",
                  borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
                  color: active ? C.text : C.textMuted,
                  cursor: "pointer", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.05em", textAlign: "center",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 10, color: complete ? C.accent : (active ? C.textMuted : C.textDim), marginTop: 1 }}>
                  {found}/{total}
                </div>
              </button>
            );
          })}
        </div>

        {/* Country slots */}
        <div style={{
          height: 124, overflowY: "auto",
          padding: "8px 14px",
          display: "flex", flexWrap: "wrap", gap: 4, alignContent: "flex-start",
        }}>
          {BY_CONTINENT[activeTab].map((country) => {
            const isGuessed = guessedIds.has(country.id);
            const isMissed  = gameState === "finished" && !isGuessed;
            return (
              <div
                key={country.id}
                className="cote-chip"
                style={{
                  padding: "2px 9px", borderRadius: 4, fontSize: 11,
                  fontWeight: isGuessed ? 500 : 400,
                  background: isGuessed ? C.foundBg : isMissed ? C.missBg : C.surfaceAlt,
                  border: `1px solid ${isGuessed ? C.foundBorder + "77" : isMissed ? C.missBorder + "77" : C.border}`,
                  color: isGuessed ? C.foundText : isMissed ? C.missText : C.textDim,
                  whiteSpace: "nowrap",
                }}
              >
                {isGuessed || isMissed ? country.name : "·  ·  ·"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
