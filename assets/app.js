"use strict";
(function(){
  var state={all:[],filtered:[],view:"cards"};
  var $=function(id){return document.getElementById(id)};
  var statusNames={active:"Aktivní",upcoming:"Plánované",watch:"Sledovat",closed:"Ukončené",awarded:"Zadané"};
  var fmtDate=new Intl.DateTimeFormat("cs-CZ",{day:"numeric",month:"short",year:"numeric"});
  var fmtNumber=new Intl.NumberFormat("cs-CZ");

  function esc(value){return String(value==null?"—":value).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]})}
  function date(value){if(!value)return"Neuvedeno";var d=new Date(value+"T12:00:00Z");return isNaN(d)?esc(value):fmtDate.format(d)}
  function daysLeft(value){if(!value)return null;return Math.ceil((new Date(value+"T23:59:59Z")-new Date())/86400000)}
  function valueText(t){if(t.value==null)return"Neuvedena";return fmtNumber.format(t.value)+" "+esc(t.currency||"")}
  function isOpen(t){return t.status==="active"||t.status==="upcoming"||t.status==="watch"}
  function scoreClass(n){return n>=80?"high":n<50?"low":""}

  function validatePayload(data){
    if(!data||data.schemaVersion!=="1.0"||!Array.isArray(data.tenders))throw new Error("Neplatná datová sada");
    var ids=new Set();
    data.tenders.forEach(function(t){
      ["id","title","buyer","country","region","productArea","status","relevance","source"].forEach(function(k){if(t[k]===undefined||t[k]===null||t[k]==="")throw new Error("Chybí "+k+" u "+(t.id||"záznamu"))});
      if(ids.has(t.id))throw new Error("Duplicitní ID "+t.id);ids.add(t.id);
      if(t.relevance<0||t.relevance>100)throw new Error("Neplatná relevance");
      if(!/^https:\/\//.test(t.source.url))throw new Error("Zdroj musí používat HTTPS");
    });
    return data;
  }

  function renderKpis(data){
    var open=state.all.filter(isOpen);
    var now=Date.now(),week=now-7*86400000;
    $("kpiActive").textContent=open.length;
    $("kpiNew").textContent=state.all.filter(function(t){return new Date(t.firstSeen).getTime()>=week}).length;
    $("kpiDeadline").textContent=open.filter(function(t){var d=daysLeft(t.deadline);return d!==null&&d>=0&&d<=14}).length;
    $("kpiCountries").textContent=new Set(state.all.map(function(t){return t.country})).size;
    $("kpiSources").textContent=new Set(state.all.map(function(t){return t.source.name})).size;
    $("updatedAt").textContent=new Intl.DateTimeFormat("cs-CZ",{dateStyle:"medium",timeStyle:"short"}).format(new Date(data.generatedAt));
  }

  function populateRegions(){
    var select=$("regionFilter"),regions=Array.from(new Set(state.all.map(function(t){return t.region}))).sort();
    regions.forEach(function(r){var o=document.createElement("option");o.textContent=r;o.value=r;select.appendChild(o)});
  }

  function badges(t){
    var out=['<span class="badge '+esc(t.status)+'">'+esc(statusNames[t.status]||t.status)+'</span>'];
    if(t.isNew)out.push('<span class="badge new">Nové</span>');
    var d=daysLeft(t.deadline);if(isOpen(t)&&d!==null&&d>=0&&d<=14)out.push('<span class="badge urgent">Termín</span>');
    if(t.changedFields&&t.changedFields.length)out.push('<span class="badge new">Změna</span>');
    return out.join("");
  }

  function card(t){
    var d=daysLeft(t.deadline),near=isOpen(t)&&d!==null&&d>=0&&d<=14;
    return '<article class="tender-card" tabindex="0" data-id="'+esc(t.id)+'">'+
      '<div class="card-top"><div class="badges">'+badges(t)+'</div><div class="score '+scoreClass(t.relevance)+'" title="Skóre relevance">'+t.relevance+'</div></div>'+
      '<h3>'+esc(t.title)+'</h3><div class="buyer">'+esc(t.buyer)+' · '+esc(t.country)+'</div>'+
      '<div class="card-facts"><div class="fact"><span>Termín</span><strong class="deadline '+(near?"near":"")+'">'+date(t.deadline)+(near?" · "+d+" dní":"")+'</strong></div>'+
      '<div class="fact"><span>Hodnota</span><strong>'+valueText(t)+'</strong></div>'+
      '<div class="fact"><span>Ráže / specifikace</span><strong>'+esc((t.calibers||[]).join(", ")||"Neuvedeno")+'</strong></div>'+
      '<div class="fact"><span>Zdroj</span><strong>'+esc(t.source.name)+'</strong></div></div>'+
      '<div class="card-bottom"><span class="product">'+esc(t.productArea)+'</span><span class="details-link">Detail příležitosti →</span></div></article>';
  }

  function row(t){
    return '<tr data-id="'+esc(t.id)+'"><td><strong>'+esc(t.title)+'</strong><br><span class="buyer">'+esc(t.buyer)+'</span></td><td>'+esc(t.country)+'</td><td>'+esc(t.productArea)+'</td><td><span class="badge '+esc(t.status)+'">'+esc(statusNames[t.status]||t.status)+'</span></td><td>'+date(t.deadline)+'</td><td><strong>'+t.relevance+'/100</strong></td></tr>';
  }

  function render(){
    $("loadingState").hidden=true;$("errorState").hidden=true;
    $("resultsCount").textContent="Nalezeno "+state.filtered.length+" z "+state.all.length+" záznamů";
    $("emptyState").hidden=state.filtered.length!==0;
    $("cardsView").hidden=state.view!=="cards"||state.filtered.length===0;
    $("tableView").hidden=state.view!=="table"||state.filtered.length===0;
    $("cardsView").innerHTML=state.filtered.map(card).join("");
    $("tableBody").innerHTML=state.filtered.map(row).join("");
    document.querySelectorAll("[data-id]").forEach(function(el){
      el.addEventListener("click",function(){openDetail(el.dataset.id)});
      el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openDetail(el.dataset.id)}});
    });
  }

  function filter(){
    var q=$("searchInput").value.trim().toLocaleLowerCase("cs"),status=$("statusFilter").value,product=$("productFilter").value,region=$("regionFilter").value;
    state.filtered=state.all.filter(function(t){
      var hay=[t.title,t.buyer,t.country,t.region,t.summary,t.productArea,(t.calibers||[]).join(" ")].join(" ").toLocaleLowerCase("cs");
      return(!q||hay.indexOf(q)>=0)&&(!status||t.status===status)&&(!product||t.productArea===product)&&(!region||t.region===region);
    });
    var sort=$("sortFilter").value;
    state.filtered.sort(function(a,b){
      if(sort==="deadline")return (a.deadline||"9999").localeCompare(b.deadline||"9999");
      if(sort==="newest")return (b.publishedAt||"").localeCompare(a.publishedAt||"");
      if(sort==="value")return (b.value||0)-(a.value||0);
      return b.relevance-a.relevance;
    });render();
  }

  function renderInsights(){
    var top=state.all.filter(isOpen).sort(function(a,b){return b.relevance-a.relevance})[0]||state.all[0];
    if(top){$("topInsight").textContent=top.title;$("topInsightText").textContent=top.managementNote||top.summary;$("topInsightButton").onclick=function(){openDetail(top.id)}}
    var counts={};state.all.forEach(function(t){counts[t.productArea]=(counts[t.productArea]||0)+1});
    var max=Math.max.apply(null,Object.values(counts).concat([1]));$("chartTotal").textContent=state.all.length+" záznamů";
    $("productChart").innerHTML=Object.keys(counts).map(function(k){return '<div class="bar-row"><span>'+esc(k)+'</span><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(counts[k]/max*100)+'%"></div></div><strong>'+counts[k]+'</strong></div>'}).join("");
    var countries={};state.all.forEach(function(t){countries[t.country]=(countries[t.country]||0)+1});
    $("countryList").innerHTML=Object.entries(countries).sort(function(a,b){return b[1]-a[1]}).slice(0,5).map(function(x,i){return '<div class="country-row"><span class="country-rank">0'+(i+1)+'</span><span>'+esc(x[0])+'</span><span class="country-count">'+x[1]+'×</span></div>'}).join("");
  }

  function openDetail(id){
    var t=state.all.find(function(x){return x.id===id});if(!t)return;
    var risks=(t.risks||[]).map(function(x){return"<li>"+esc(x)+"</li>"}).join("");
    var changes=(t.changedFields||[]).length?'<div class="dialog-section"><h3>Zaznamenané změny</h3><p>'+esc(t.changedFields.join(", "))+'</p></div>':"";
    $("dialogContent").innerHTML='<div class="dialog-eyebrow">'+esc(t.id)+' · '+esc(statusNames[t.status]||t.status)+'</div><h2>'+esc(t.title)+'</h2><div class="dialog-sub">'+esc(t.buyer)+' · '+esc(t.country)+'</div>'+
      '<div class="dialog-grid"><div class="dialog-fact"><span>Relevance</span><b>'+t.relevance+' / 100</b></div><div class="dialog-fact"><span>Termín</span><b>'+date(t.deadline)+'</b></div><div class="dialog-fact"><span>Hodnota</span><b>'+valueText(t)+'</b></div><div class="dialog-fact"><span>Produkt</span><b>'+esc(t.productArea)+'</b></div><div class="dialog-fact"><span>Ráže</span><b>'+esc((t.calibers||[]).join(", ")||"Neuvedeno")+'</b></div><div class="dialog-fact"><span>Poslední kontrola</span><b>'+date(t.lastChecked)+'</b></div></div>'+
      '<div class="dialog-section"><h3>Shrnutí</h3><p>'+esc(t.summary)+'</p></div><div class="dialog-section"><h3>Obchodní pohled</h3><p>'+esc(t.managementNote||"Bez doplňující poznámky.")+'</p></div>'+
      (risks?'<div class="dialog-section"><h3>Podmínky a rizika k prověření</h3><ul>'+risks+'</ul></div>':"")+changes+
      '<div class="dialog-section"><h3>Zdroj a ověření</h3><p>Stav ověření: <strong>'+esc(t.verification)+'</strong>. Rozhodující jsou vždy originální zadávací podklady.</p><a class="source-button" href="'+esc(t.source.url)+'" target="_blank" rel="noopener">Otevřít původní zdroj ↗</a></div>';
    $("detailDialog").showModal();
  }

  ["searchInput","statusFilter","productFilter","regionFilter","sortFilter"].forEach(function(id){$(id).addEventListener(id==="searchInput"?"input":"change",filter)});
  $("clearFilters").addEventListener("click",function(){["searchInput","statusFilter","productFilter","regionFilter"].forEach(function(id){$(id).value=""});$("sortFilter").value="relevance";filter()});
  document.querySelectorAll(".view-tabs button").forEach(function(btn){btn.addEventListener("click",function(){state.view=btn.dataset.view;document.querySelectorAll(".view-tabs button").forEach(function(x){x.classList.toggle("active",x===btn)});render()})});
  $("dialogClose").onclick=function(){$("detailDialog").close()};$("detailDialog").onclick=function(e){if(e.target===$("detailDialog"))$("detailDialog").close()};
  $("themeToggle").onclick=function(){document.body.classList.toggle("light");localStorage.setItem("radar-theme",document.body.classList.contains("light")?"light":"dark")};
  if(localStorage.getItem("radar-theme")==="light")document.body.classList.add("light");

  fetch("data/tenders.json",{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(validatePayload).then(function(data){state.all=data.tenders;state.filtered=data.tenders.slice();populateRegions();renderKpis(data);renderInsights();filter()}).catch(function(err){console.error(err);$("loadingState").hidden=true;$("errorState").hidden=false;$("resultsCount").textContent="Data nejsou dostupná"});
})();