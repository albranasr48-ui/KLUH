const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ready=()=>window.sb&&window.SUPABASE_URL&&!window.SUPABASE_URL.includes("YOUR-PROJECT");
const msg=t=>{let x=$("#msg");if(x){x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),3500)}};
async function settings(){if(!ready())return;let {data}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();if(!data)return;
document.querySelectorAll("[data-site]").forEach(x=>x.textContent=data.site_name);
document.querySelectorAll("[data-welcome]").forEach(x=>x.textContent=data.welcome_text);
if(data.students_closed&&document.body.dataset.public==="yes")document.body.innerHTML=`<main class="closed"><h1>${esc(data.site_name)}</h1><h2>الموقع مغلق مؤقتاً</h2><p>${esc(data.closed_message)}</p></main>`;
}
async function authAdmin(){let {data:{session}}=await sb.auth.getSession();if(!session){location.href="login.html";return false}
let {data:p}=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();if(p?.role!=="admin"){await sb.auth.signOut();location.href="login.html";return false}return true}
async function login(e){e.preventDefault();let {error}=await sb.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error)return msg(error.message);if(await authAdmin())location.href="dashboard.html"}
async function logout(){await sb.auth.signOut();location.href="login.html"}
async function rows(table,cols,filter={}){let q=sb.from(table).select("*").order("created_at",{ascending:false});for(let [k,v] of Object.entries(filter))q=q.eq(k,v);let {data,error}=await q;if(error){msg(error.message);return []}return data||[]}
async function fill(table,id){let data=await rows(table);$(id).innerHTML=data.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}
async function save(table,form){let f=$(form),o=Object.fromEntries(new FormData(f).entries()),id=o.id;delete o.id;o.is_active=f.elements.is_active?.checked??true;let q=id?sb.from(table).update(o).eq("id",id):sb.from(table).insert(o);let {error}=await q;if(error)return msg(error.message);f.reset();await renderTable(table)}
async function edit(table,id){let {data}=await sb.from(table).select("*").eq("id",id).single();let f=$("#entity");Object.entries(data||{}).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??""});f.elements.id.value=id;window.scrollTo(0,0)}
async function del(table,id){if(!confirm("تأكيد الحذف؟"))return;let {error}=await sb.from(table).delete().eq("id",id);if(error)msg(error.message);else renderTable(table)}
async function renderTable(table){let config={
departments:["اسم القسم","الوصف"],
specializations:["اسم التخصص","department_id"],
subjects:["اسم المادة","specialization_id","semester"],
materials:["عنوان الملف","subject_id","file_url"]
}[table];let data=await rows(table);let host=$("#rows");if(!host)return;
host.innerHTML=data.map(x=>`<tr>${config.map(k=>`<td>${esc(x[k])}</td>`).join("")}<td><button onclick="edit('${table}','${x.id}')">تعديل</button> <button onclick="del('${table}','${x.id}')">حذف</button></td></tr>`).join("");
}
async function initAdmin(){if(!ready()){msg("أكمل إعداد config.js أولاً");return}if(!await authAdmin())return;
let p=location.pathname.split("/").pop(),table=p.startsWith("depart")?"departments":p.startsWith("special")?"specializations":p.startsWith("subject")?"subjects":p.startsWith("material")?"materials":null;
if(table){if(table==="specializations")await fill("departments","#parent");if(table==="subjects")await fill("specializations","#parent");if(table==="materials")await fill("subjects","#parent");await renderTable(table);$("#entity")?.addEventListener("submit",e=>{e.preventDefault();save(table,"#entity")})}
if(p==="dashboard.html"){for(let t of ["departments","specializations","subjects","materials"]){let {count}=await sb.from(t).select("*",{count:"exact",head:true});$("#n-"+t).textContent=count||0}}
if(p==="settings.html"){let {data}=await sb.from("site_settings").select("*").eq("id",1).single();Object.entries(data||{}).forEach(([k,v])=>{if($("#settings")?.elements[k])$("#settings").elements[k].value=v??""});$("#settings")?.addEventListener("submit",async e=>{e.preventDefault();let o=Object.fromEntries(new FormData(e.target).entries());o.students_closed=e.target.elements.students_closed.checked;let {error}=await sb.from("site_settings").upsert({id:1,...o});msg(error?.message||"تم حفظ الإعدادات")})}
}
async function publicLoad(){
 if(!ready())return msg("أكمل إعداد config.js أولاً");await settings();
 let p=location.pathname.split("/").pop(),id=new URLSearchParams(location.search);
 if(p==="index.html"){let d=await rows("departments");$("#cards").innerHTML=d.filter(x=>x.is_active).map(x=>`<a class="tile" href="specializations.html?id=${x.id}"><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p></a>`).join("")||"لا توجد أقسام بعد"}
 if(p==="specializations.html"){let d=await rows("specializations",[],{department_id:id.get("id")});$("#cards").innerHTML=d.map(x=>`<a class="tile" href="subjects.html?id=${x.id}"><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p></a>`).join("")}
 if(p==="subjects.html"){let d=await rows("subjects",[],{specialization_id:id.get("id")});$("#cards").innerHTML=d.map(x=>`<a class="tile" href="subject.html?id=${x.id}"><h3>${esc(x.name)}</h3><p>${esc(x.semester||"")}</p></a>`).join("")}
 if(p==="subject.html"){let {data:s}=await sb.from("subjects").select("*").eq("id",id.get("id")).single();$("#heading").textContent=s?.name||"المادة";let {data:m}=await sb.from("materials").select("*").eq("subject_id",id.get("id"));$("#cards").innerHTML=(m||[]).map(x=>`<a class="tile" target="_blank" href="${esc(x.file_url)}"><h3>${esc(x.title)}</h3><p>فتح ملف المنهج PDF</p></a>`).join("")}
}
