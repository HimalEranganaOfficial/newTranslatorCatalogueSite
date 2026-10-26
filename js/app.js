/* Sworn Translators Sri Lanka — client-side demo.
 * Production note: localStorage is per-browser and is not a secure/shared database.
 * Move registrations, reviews and moderation to an authenticated server/API before public launch.
 */
(() => {
  "use strict";
  const DATA_URL = "data/translators.json";
  const DATA_KEY = "stlk_translators_v1";
  const REG_KEY = "stlk_registration_requests_v1";
  const REVIEW_KEY = "stlk_reviews_v1";
  // Demo-only gate. Replace with a server-side authenticated admin before deployment.
  const ADMIN_DEMO_KEY = "change-this-demo-key";
  const PAGE_SIZE = 12;
  const POPULAR_LANGUAGES = ["Sinhala","English","Tamil","Arabic","Chinese","Korean","Japanese","German","Russian","Hebrew","French"];
  const OTHER_LANGUAGES = ["Afrikaans","Albanian","Amharic","Armenian","Azerbaijani","Bengali","Bosnian","Bulgarian","Burmese","Cambodian","Catalan","Cebuano","Croatian","Czech","Danish","Dutch","Estonian","Filipino","Finnish","Georgian","Greek","Gujarati","Haitian Creole","Hausa","Hindi","Hungarian","Icelandic","Igbo","Indonesian","Irish","Italian","Kannada","Kazakh","Khmer","Kurdish","Kyrgyz","Lao","Latvian","Lithuanian","Macedonian","Malay","Malayalam","Maltese","Marathi","Mongolian","Nepali","Norwegian","Pashto","Persian","Polish","Portuguese","Punjabi","Romanian","Serbian","Slovak","Slovenian","Somali","Spanish","Swahili","Swedish","Tagalog","Telugu","Thai","Tibetan","Turkish","Ukrainian","Urdu","Uzbek","Vietnamese","Welsh","Yoruba","Zulu"];
  const DISTRICTS = ["Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha","Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya","Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya"];
  const $ = (id) => document.getElementById(id);
  let translators = [];
  let filtered = [];
  let page = 1;
  let captchaAnswer = 0;
  let adminUnlocked = false;
  let currentSample = "birth";
  let currentSamplePage = 1;
  let reviews = [];

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm = (v) => String(v ?? "").trim().toLocaleLowerCase();
  const allLanguages = [...POPULAR_LANGUAGES, ...OTHER_LANGUAGES];
  const getLanguages = (t) => Array.from({length:6}, (_,i) => t[`lang${i+1}`]).filter(Boolean);
  const unique = (arr) => [...new Set(arr.map(v => String(v || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  function normalizeRecord(r, i=0) {
    const pick = (...keys) => {
      for (const k of keys) if (r[k] !== undefined && r[k] !== null && String(r[k]).trim()) return String(r[k]).trim();
      return "";
    };
    const out = {
      no: pick("no","No","NO") || String(i+1),
      r_number: pick("r_number","R. Number","R Number","registration number"),
      name: pick("name","Full Name","full_name"),
      address: pick("address","Address"),
      tel: pick("tel","Tel No","Telephone","phone"),
      email: pick("email","Mail Address","Email"),
      district: pick("district","District"),
      court: pick("court","District Court","Court")
    };
    for(let n=1;n<=6;n++) out[`lang${n}`] = pick(`lang${n}`,`Language ${n}`,`language${n}`);
    return out;
  }
  async function loadData() {
    try {
      const local = localStorage.getItem(DATA_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length) { translators = parsed.map(normalizeRecord); return; }
      }
    } catch (e) { console.warn("Could not read local directory override.", e); }
    try {
      const response = await fetch(DATA_URL, {cache:"no-cache"});
      if (!response.ok) throw new Error("Dataset request failed");
      const data = await response.json();
      translators = Array.isArray(data) ? data.map(normalizeRecord) : [];
    } catch (e) {
      translators = [];
      console.error(e);
      showNotice("The directory dataset could not be loaded. Open this site through a web server (not directly as a file) and confirm data/translators.json is deployed.");
    }
  }
  function showNotice(message) { const el=$("directoryNotice"); el.textContent=message; el.hidden=false; }
  function fillSelect(id, values, firstLabel) {
    const el=$(id); if(!el) return;
    const current=el.value;
    el.innerHTML = `<option value="">${esc(firstLabel)}</option>` + values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
    if(values.includes(current)) el.value=current;
  }
  function populateFilters() {
    const pairs = unique(translators.flatMap(getLanguages));
    const fromPairs = new Set();
    pairs.forEach(pair => {
      const bits = pair.split(/\s*(?:-|–|—|\/|,|&|\bto\b)\s*/i);
      bits.forEach(b => { const found=allLanguages.find(l=>norm(l)===norm(b)); if(found) fromPairs.add(found); });
    });
    const discovered = [...fromPairs].sort((a,b)=>a.localeCompare(b));
    const languages = [...POPULAR_LANGUAGES, ...OTHER_LANGUAGES.filter(l=>!POPULAR_LANGUAGES.includes(l))];
    // Include languages appearing in dataset even if they are not in the curated convenience list.
    const extras = discovered.filter(l=>!languages.includes(l)).sort((a,b)=>a.localeCompare(b));
    fillSelect("languageFilter", [...languages, ...extras], "All languages");
    fillSelect("districtFilter", unique([...DISTRICTS, ...translators.map(t=>t.district)]), "All districts");
    fillSelect("courtFilter", unique(translators.map(t=>t.court)), "All courts");
    fillSelect("regDistrict", unique([...DISTRICTS, ...translators.map(t=>t.district)]), "Select district");
    fillSelect("reviewTranslator", translators.filter(t=>t.name && t.r_number).map(t=>({label:`${t.name} — ${t.r_number}`,value:t.r_number})).map(o=>o.value), "Select a translator");
    // Replace plain options in review dropdown with informative labels safely.
    const reviewSel=$("reviewTranslator");
    reviewSel.innerHTML='<option value="">Select a translator</option>'+translators.filter(t=>t.name&&t.r_number).map(t=>`<option value="${esc(t.r_number)}">${esc(t.name)} — ${esc(t.r_number)}</option>`).join("");
    $("heroCount").textContent = `${translators.length.toLocaleString()} directory records loaded`;
  }
  function languageMatches(t, selected) {
    if(!selected) return true;
    return getLanguages(t).some(pair => {
      const tokens=pair.split(/\s*(?:-|–|—|\/|,|&|\bto\b)\s*/i).map(norm);
      return tokens.includes(norm(selected)) || norm(pair).includes(norm(selected));
    });
  }
  function runSearch(reset=true) {
    if(reset) page=1;
    const q=norm($("searchInput").value), lang=$("languageFilter").value, district=$("districtFilter").value, court=$("courtFilter").value;
    filtered=translators.filter(t=>{
      const hay=[t.no,t.r_number,t.name,t.address,t.tel,t.email,t.district,t.court,...getLanguages(t)].join(" ").toLocaleLowerCase();
      return (!q||hay.includes(q)) && languageMatches(t,lang) && (!district||norm(t.district)===norm(district)) && (!court||norm(t.court)===norm(court));
    });
    renderResults();
  }
  function translatorCard(t) {
    const languages=getLanguages(t);
    const phone = String(t.tel||"").replace(/[^\d+]/g,"");
    const email = String(t.email||"").trim();
    return `<article class="translator-card">
      <div class="translator-card-top"><span class="reg-tag">${esc(t.r_number || "Registration not listed")}</span>${t.featured ? '<span class="featured-tag">FEATURED</span>':""}</div>
      <h3>${esc(t.name || "Name not available")}</h3>
      <div class="card-meta">
        <div class="meta-line"><span class="meta-icon">⌖</span><span>${esc(t.district || "District not listed")}${t.court ? ` · ${esc(t.court)} Court` : ""}</span></div>
        ${t.address?`<div class="meta-line"><span class="meta-icon">⌂</span><span>${esc(t.address)}</span></div>`:""}
        ${t.tel?`<div class="meta-line"><span class="meta-icon">☎</span><span>${esc(t.tel)}</span></div>`:""}
        ${t.email?`<div class="meta-line"><span class="meta-icon">✉</span><span>${esc(t.email)}</span></div>`:""}
      </div>
      <div class="language-pills">${languages.length ? languages.map(l=>`<span class="language-pill">${esc(l)}</span>`).join("") : '<span class="language-pill">Languages not listed</span>'}</div>
      <div class="card-actions">${phone?`<a class="btn btn-outline" href="tel:${esc(phone)}">Call</a>`:""}${email?`<a class="btn btn-outline" href="mailto:${esc(email)}">Email</a>`:""}<button class="btn btn-outline btn-small verify-from-card" data-reg="${esc(t.r_number)}" type="button">Verify record</button></div>
    </article>`;
  }
  function renderResults() {
    const container=$("directoryResults"), total=filtered.length, pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    if(page>pages) page=pages;
    $("resultCount").textContent=`${total.toLocaleString()} result${total===1?"":"s"}`;
    $("pageSummary").textContent=total ? `Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,total)} of ${total.toLocaleString()}` : "No matching records";
    $("prevPage").disabled=page<=1; $("nextPage").disabled=page>=pages;
    if(!total) {
      container.innerHTML=`<div class="empty-state"><h3>No matching translators found</h3><p>No sworn translator found for this specific selection. Are you a registered translator? <a href="#register"><strong>Register now under Category B</strong></a> to request a listing.</p><button class="btn btn-outline btn-small" id="emptyClear" type="button">Clear filters</button></div>`;
      $("emptyClear")?.addEventListener("click",clearFilters);
      return;
    }
    container.innerHTML=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(translatorCard).join("");
    container.querySelectorAll(".verify-from-card").forEach(btn=>btn.addEventListener("click",()=>{
      $("verifyInput").value=btn.dataset.reg||""; verifyRegistration(btn.dataset.reg||""); $("standards").scrollIntoView({behavior:"smooth"});
    }));
  }
  function clearFilters() { $("searchInput").value=""; $("languageFilter").value=""; $("districtFilter").value=""; $("courtFilter").value=""; runSearch(); }
  function findRegistration(reg) { return translators.find(t=>norm(t.r_number)===norm(reg)); }
  function verifyRegistration(reg) {
    const result=$("verifyResult"); const clean=String(reg||"").trim();
    if(!clean) { result.textContent="Enter a registration number."; return; }
    const t=findRegistration(clean);
    if(!t) { result.innerHTML=`<div class="notice notice-info">No matching record was found in the currently loaded directory. This does not prove that a person is unregistered; confirm directly with the relevant authority.</div>`; return; }
    const langs=getLanguages(t);
    result.innerHTML=`<div class="verify-result-card"><strong>Directory match found</strong><div><b>Name:</b> ${esc(t.name)}</div><div><b>Registration:</b> ${esc(t.r_number)}</div><div><b>District / court:</b> ${esc(t.district||"Not listed")} / ${esc(t.court||"Not listed")}</div><div><b>Languages listed:</b> ${esc(langs.join("; ")||"Not listed")}</div><p style="margin:8px 0 0;font-size:10px">This is a match against this website's dataset, not live official verification.</p></div>`;
  }
  function readLocalArray(key) { try { const v=JSON.parse(localStorage.getItem(key)||"[]"); return Array.isArray(v)?v:[]; } catch { return []; } }
  function saveLocalArray(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
  function setMessage(id,text,error=false) { const el=$(id); el.textContent=text; el.classList.toggle("error",error); }
  function bindRegistration() {
    $("registrationForm").addEventListener("submit",e=>{
      e.preventDefault();
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      const record=normalizeRecord(data, translators.length+1);
      if(!record.r_number||!record.name||!record.address||!record.tel||!record.email||!record.district||!record.court||!record.lang1) {
        setMessage("registrationMessage","Please complete all required fields.",true); return;
      }
      const requests=readLocalArray(REG_KEY);
      requests.push({...record,submitted_at:new Date().toISOString(),status:"pending"});
      if(!saveLocalArray(REG_KEY,requests)) { setMessage("registrationMessage","Browser storage is unavailable or full. No submission was saved.",true); return; }
      // In this demo, add to current browser's search results only. Not an official registration.
      translators.push({...record, local_submission:true});
      saveLocalArray(DATA_KEY,translators);
      populateFilters(); runSearch();
      e.currentTarget.reset();
      setMessage("registrationMessage","Listing request saved in this browser and added to this local preview. It is not an official registration and is not visible to other visitors.");
    });
  }
  const sampleNames={birth:"Birth certificate",marriage:"Marriage certificate",death:"Death certificate",nic:"National Identity Card (NIC)"};
  function updateSample() {
    const name=sampleNames[currentSample];
    $("sampleTitle").textContent=name;
    $("sampleImage").src=`samples/${currentSample === "nic" ? "nic" : currentSample+"-certificate"}-p${currentSamplePage}.jpg`;
    $("sampleImage").alt=`Illustrative ${name.toLowerCase()} page ${currentSamplePage}`;
    $("sampleCaption").textContent=`Page ${currentSamplePage} of 4 · illustrative sample`;
    document.querySelectorAll(".sample-tab").forEach(b=>{const active=b.dataset.sample===currentSample;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
    document.querySelectorAll(".page-btn").forEach(b=>{const active=Number(b.dataset.page)===currentSamplePage;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
  }
  function createCaptcha() { const a=Math.floor(Math.random()*8)+2,b=Math.floor(Math.random()*8)+1; captchaAnswer=a+b; $("captchaQuestion").textContent=`Anti-bot check: what is ${a} + ${b}?`; $("captchaAnswer").value=""; }
  function renderReviews() {
    const list=$("reviewsList");
    if(!reviews.length) { list.innerHTML='<div class="empty-state"><h3>No reviews yet</h3><p>Be the first to leave respectful, factual feedback.</p></div>'; }
    else {
      const sorted=[...reviews].sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||String(b.created_at).localeCompare(String(a.created_at)));
      list.innerHTML=sorted.map(r=>`<article class="review-card ${r.pinned?"pinned":""}"><div class="review-card-top"><div><h4>${esc(r.translator_name||"Translator")}${r.pinned?' <span class="featured-tag">PINNED</span>':""}</h4><div class="review-meta">${esc(r.author||"Anonymous")} · ${esc(new Date(r.created_at).toLocaleDateString())}</div></div><div class="stars" aria-label="${Number(r.rating)||5} out of 5 stars">${"★".repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}${"☆".repeat(5-Math.max(1,Math.min(5,Number(r.rating)||5)))}</div></div><p>${esc(r.text)}</p></article>`).join("");
    }
    renderModeration();
  }
  function renderModeration() {
    const area=$("moderationControls");
    if(!adminUnlocked) { area.hidden=true; return; }
    area.hidden=false;
    area.innerHTML=reviews.length?reviews.map(r=>`<div class="moderation-row"><span>${esc(r.translator_name)} — ${esc(r.text.slice(0,65))}</span><div><button class="btn btn-outline btn-small" data-pin="${esc(r.id)}" type="button">${r.pinned?"Unpin":"Pin"}</button> <button class="btn btn-outline btn-small" data-delete="${esc(r.id)}" type="button">Delete</button></div></div>`).join(""):"<p>No reviews to moderate.</p>";
    area.querySelectorAll("[data-pin]").forEach(b=>b.addEventListener("click",()=>{reviews=reviews.map(r=>r.id===b.dataset.pin?{...r,pinned:!r.pinned}:r);saveLocalArray(REVIEW_KEY,reviews);renderReviews();}));
    area.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{reviews=reviews.filter(r=>r.id!==b.dataset.delete);saveLocalArray(REVIEW_KEY,reviews);renderReviews();}));
  }
  function bindReviews() {
    reviews=readLocalArray(REVIEW_KEY); renderReviews(); createCaptcha();
    $("newCaptcha").addEventListener("click",createCaptcha);
    $("reviewForm").addEventListener("submit",e=>{
      e.preventDefault();
      const answer=Number($("captchaAnswer").value);
      if(answer!==captchaAnswer) { setMessage("reviewMessage","That answer is not correct. Please try the new math check.",true); createCaptcha(); return; }
      const reg=$("reviewTranslator").value, t=findRegistration(reg);
      const text=$("reviewText").value.trim();
      if(!t||text.length<8) { setMessage("reviewMessage","Select a translator and enter at least 8 characters of feedback.",true); return; }
      const review={id:`rv_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,r_number:reg,translator_name:t.name,author:$("reviewName").value.trim()||"Anonymous",rating:Number($("reviewRating").value),text,created_at:new Date().toISOString(),pinned:false};
      reviews.unshift(review);
      if(!saveLocalArray(REVIEW_KEY,reviews)) { reviews.shift(); setMessage("reviewMessage","Browser storage is unavailable or full.",true); return; }
      e.currentTarget.reset(); renderReviews(); createCaptcha();
      setMessage("reviewMessage","Review saved locally in this browser. It is not submitted to a shared public server.");
    });
    $("unlockAdmin").addEventListener("click",()=>{
      if($("adminPin").value===ADMIN_DEMO_KEY) { adminUnlocked=true; setMessage("reviewMessage","Local demo moderation unlocked."); renderModeration(); }
      else { adminUnlocked=false; setMessage("reviewMessage","Incorrect demo passphrase. This client-side gate is not secure authentication.",true); renderModeration(); }
    });
  }
  function importRecords(file) {
    const ext=file.name.split(".").pop().toLowerCase();
    const readText=()=>file.text().then(text=>{
      if(ext==="json") return JSON.parse(text);
      if(ext==="csv") {
        if(!window.XLSX) throw new Error("CSV parser has not loaded yet. Refresh and try again.");
        const wb=XLSX.read(text,{type:"string"}); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});
      }
      throw new Error("Unsupported file type.");
    });
    if(ext==="xlsx"||ext==="xls") {
      if(!window.XLSX) return Promise.reject(new Error("Excel parser has not loaded yet. Check your connection and try again."));
      return file.arrayBuffer().then(buf=>{const wb=XLSX.read(buf,{type:"array"});return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});});
    }
    return readText();
  }
  function bindImporter() {
    const drop=$("dataFile").closest(".file-drop");
    ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor="var(--brand-green)";}));
    ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor="";if(ev==="drop"&&e.dataTransfer.files.length)$("dataFile").files=e.dataTransfer.files;}));
    $("importData").addEventListener("click",async()=>{
      const file=$("dataFile").files[0];
      if(!file) { setMessage("importMessage","Choose a file first.",true); return; }
      try {
        const parsed=await importRecords(file);
        if(!Array.isArray(parsed)) throw new Error("The file must contain a JSON array or a table of records.");
        const normalized=parsed.map(normalizeRecord).filter(t=>t.r_number||t.name);
        if(!normalized.length) throw new Error("No translator rows were found. Check the header names and file contents.");
        const replace=$("replaceData").checked;
        const merged=replace?normalized:[...translators,...normalized];
        if(!saveLocalArray(DATA_KEY,merged)) throw new Error("Could not save data. Browser storage may be full.");
        translators=merged; populateFilters(); runSearch();
        setMessage("importMessage",`${normalized.length.toLocaleString()} records imported into this browser${replace?" (local dataset replaced)":" (appended)"}. Export JSON and deploy it as data/translators.json to publish the update for all visitors.`);
      } catch(err) { setMessage("importMessage",err.message||"Import failed.",true); }
    });
    $("exportJson").addEventListener("click",()=>{
      const blob=new Blob([JSON.stringify(translators,null,2)],{type:"application/json"});
      downloadBlob(blob,"translators.json");
      setMessage("ownerMessage","Current dataset exported as JSON. Replace data/translators.json in your project and redeploy to publish globally.");
    });
    $("exportZip").addEventListener("click",exportProjectZip);
  }
  function downloadBlob(blob,name) {
    const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportProjectZip() {
    if(!window.JSZip) { setMessage("ownerMessage","ZIP library has not loaded. Check your internet connection and try again.",true); return; }
    const btn=$("exportZip"); btn.disabled=true; btn.textContent="Preparing ZIP…";
    const zip=new JSZip(), root=zip.folder("sworn-translators-lk");
    const paths=["index.html","css/styles.css","js/app.js","data/translators.json","README.md",
      "samples/birth-certificate-p1.jpg","samples/birth-certificate-p2.jpg","samples/birth-certificate-p3.jpg","samples/birth-certificate-p4.jpg",
      "samples/marriage-certificate-p1.jpg","samples/marriage-certificate-p2.jpg","samples/marriage-certificate-p3.jpg","samples/marriage-certificate-p4.jpg",
      "samples/death-certificate-p1.jpg","samples/death-certificate-p2.jpg","samples/death-certificate-p3.jpg","samples/death-certificate-p4.jpg",
      "samples/nic-p1.jpg","samples/nic-p2.jpg","samples/nic-p3.jpg","samples/nic-p4.jpg",
      "templates/Birth_Certificate_Template.docx","templates/Marriage_Certificate_Template.docx","templates/Death_Certificate_Template.docx"];
    try {
      for(const path of paths) {
        if(path === "data/translators.json") {
          root.file(path, JSON.stringify(translators, null, 2));
          continue;
        }
        const response=await fetch(path);
        if(!response.ok) throw new Error(`Could not read ${path}. Make sure the site is deployed on a web server.`);
        root.file(path,await response.arrayBuffer());
      }
      const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
      downloadBlob(blob,"sworn-translators-lk.zip");
      setMessage("ownerMessage","ZIP archive generated and downloaded with the current browser dataset included. Registration requests and reviews are local-only and are not included.");
    } catch(err) { setMessage("ownerMessage",err.message||"ZIP export failed.",true); }
    finally { btn.disabled=false; btn.textContent="Download full ZIP archive"; }
  }
  function bindEvents() {
    $("navToggle").addEventListener("click",()=>{const nav=$("mainNav"),open=nav.classList.toggle("open");$("navToggle").setAttribute("aria-expanded",String(open));});
    $("mainNav").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{$("mainNav").classList.remove("open");$("navToggle").setAttribute("aria-expanded","false");}));
    $("searchInput").addEventListener("input",()=>runSearch());
    ["languageFilter","districtFilter","courtFilter"].forEach(id=>$(id).addEventListener("change",()=>runSearch()));
    $("clearFilters").addEventListener("click",clearFilters);
    $("prevPage").addEventListener("click",()=>{if(page>1){page--;renderResults();$("directory").scrollIntoView({behavior:"smooth"});}});
    $("nextPage").addEventListener("click",()=>{if(page<Math.ceil(filtered.length/PAGE_SIZE)){page++;renderResults();$("directory").scrollIntoView({behavior:"smooth"});}});
    $("heroVerifyForm").addEventListener("submit",e=>{e.preventDefault();$("verifyInput").value=$("heroReg").value;verifyRegistration($("heroReg").value);$("standards").scrollIntoView({behavior:"smooth"});});
    $("verifyForm").addEventListener("submit",e=>{e.preventDefault();verifyRegistration($("verifyInput").value);});
    document.querySelectorAll(".sample-tab").forEach(b=>b.addEventListener("click",()=>{currentSample=b.dataset.sample;currentSamplePage=1;updateSample();}));
    document.querySelectorAll(".page-btn").forEach(b=>b.addEventListener("click",()=>{currentSamplePage=Number(b.dataset.page);updateSample();}));
    bindRegistration(); bindReviews(); bindImporter();
    $("year").textContent=new Date().getFullYear();
  }
  async function init() {
    await loadData();
    populateFilters();
    bindEvents();
    runSearch();
    updateSample();
  }
  document.addEventListener("DOMContentLoaded",init);
})();