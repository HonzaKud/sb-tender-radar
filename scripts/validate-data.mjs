import fs from "node:fs";
const path="data/tenders.json";
const data=JSON.parse(fs.readFileSync(path,"utf8"));
const fail=(m)=>{console.error("VALIDACE SELHALA: "+m);process.exit(1)};
if(data.schemaVersion!=="1.0")fail("schemaVersion musí být 1.0");
if(!data.generatedAt||Number.isNaN(Date.parse(data.generatedAt)))fail("neplatné generatedAt");
if(!Array.isArray(data.tenders))fail("tenders musí být pole");
const required=["id","title","buyer","country","region","productArea","calibers","status","relevance","value","currency","publishedAt","deadline","firstSeen","lastChecked","isNew","changedFields","summary","managementNote","risks","verification","source"];
const products=new Set(["Malorážové střelivo","Speciální a cvičné střelivo","Komponenty střeliva"]);
const statuses=new Set(["active","upcoming","watch","closed","awarded"]);
const ids=new Set();
const isoDate=v=>v===null||/^\d{4}-\d{2}-\d{2}$/.test(v);
for(const [i,t] of data.tenders.entries()){
 for(const key of required)if(!(key in t))fail("záznam "+i+" postrádá "+key);
 if(!/^[A-Z0-9][A-Z0-9._-]{2,79}$/.test(t.id))fail("neplatné ID "+t.id);
 if(ids.has(t.id))fail("duplicitní ID "+t.id);ids.add(t.id);
 if(!products.has(t.productArea))fail("neplatná oblast u "+t.id);
 if(!statuses.has(t.status))fail("neplatný stav u "+t.id);
 if(!Number.isInteger(t.relevance)||t.relevance<0||t.relevance>100)fail("neplatná relevance u "+t.id);
 if(t.value!==null&&(typeof t.value!=="number"||t.value<0))fail("neplatná hodnota u "+t.id);
 if(!/^[A-Z]{3}$/.test(t.currency))fail("neplatná měna u "+t.id);
 for(const key of ["publishedAt","deadline","firstSeen","lastChecked"])if(!isoDate(t[key]))fail("neplatné datum "+key+" u "+t.id);
 if(!Array.isArray(t.calibers)||!Array.isArray(t.changedFields)||!Array.isArray(t.risks))fail("neplatné pole u "+t.id);
 if(!t.source||typeof t.source.name!=="string"||!/^https:\/\//.test(t.source.url))fail("neplatný zdroj u "+t.id);
}
console.log("OK: "+data.tenders.length+" záznamů, schéma "+data.schemaVersion);