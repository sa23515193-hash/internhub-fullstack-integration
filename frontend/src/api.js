const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "internhub_local_data";

const seed = [
  {id:"LOCAL-001",name:"Sara Ahmed",email:"sara@example.com",phone:"+92 300 1234567",department:"Web Development",role:"React Intern",status:"Active",progress:74,startDate:"2026-07-01",endDate:"2026-10-01",mentor:"Sarah Malik",location:"Lahore, Pakistan",skills:["React","JavaScript","CSS"],tasksCompleted:18,tasksTotal:24},
  {id:"LOCAL-002",name:"Ahmed Raza",email:"ahmed@example.com",phone:"+92 301 7654321",department:"Backend Development",role:"Node.js Intern",status:"Active",progress:61,startDate:"2026-07-15",endDate:"2026-10-15",mentor:"Usman Ali",location:"Islamabad, Pakistan",skills:["Node.js","Express","REST API"],tasksCompleted:14,tasksTotal:23}
];

function localData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {}
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(seed));
}
function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

async function backend(endpoint, options={}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options, signal: controller.signal,
      headers: {"Content-Type":"application/json", ...(options.headers || {})}
    });
    clearTimeout(timer);
    const body = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const e = new Error(body?.message || "API request failed.");
      e.status = response.status;
      throw e;
    }
    return body;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function fallback(endpoint, options={}) {
  let data = localData();
  const method = options.method || "GET";
  const match = endpoint.match(/^\/interns\/(.+)$/);
  const id = match?.[1];

  if (endpoint === "/interns" && method === "GET")
    return {success:true,count:data.length,data};

  if (endpoint === "/stats" && method === "GET") {
    const total=data.length, active=data.filter(x=>x.status==="Active").length;
    const completed=data.filter(x=>x.status==="Completed").length;
    const onHold=data.filter(x=>x.status==="On Hold").length;
    const averageProgress=total?Math.round(data.reduce((s,x)=>s+Number(x.progress||0),0)/total):0;
    return {success:true,data:{total,active,completed,onHold,averageProgress}};
  }

  if (id && method === "GET") {
    const item=data.find(x=>x.id===id);
    if (!item) { const e=new Error("Intern not found."); e.status=404; throw e; }
    return {success:true,data:item};
  }

  if (endpoint==="/interns" && method==="POST") {
    const body=JSON.parse(options.body||"{}");
    if(!body.name||!body.email||!body.department||!body.role){const e=new Error("Name, email, department and role are required.");e.status=400;throw e;}
    if(data.some(x=>x.email.toLowerCase()===body.email.toLowerCase())){const e=new Error("An intern with this email already exists.");e.status=409;throw e;}
    const item={...body,id:`LOCAL-${Date.now()}`,progress:Number(body.progress)||0,skills:Array.isArray(body.skills)?body.skills:[],tasksCompleted:Number(body.tasksCompleted)||0,tasksTotal:Number(body.tasksTotal)||0};
    data.unshift(item); save(data); return {success:true,message:"Intern created locally.",data:item};
  }

  if (id && method==="PUT") {
    const i=data.findIndex(x=>x.id===id); if(i<0){const e=new Error("Intern not found.");e.status=404;throw e;}
    data[i]={...JSON.parse(options.body||"{}"),id}; save(data); return {success:true,message:"Intern updated locally.",data:data[i]};
  }

  if (id && method==="PATCH") {
    const i=data.findIndex(x=>x.id===id); if(i<0){const e=new Error("Intern not found.");e.status=404;throw e;}
    data[i]={...data[i],...JSON.parse(options.body||"{}")}; save(data); return {success:true,message:"Intern partially updated.",data:data[i]};
  }

  if (id && method==="DELETE") {
    const next=data.filter(x=>x.id!==id); if(next.length===data.length){const e=new Error("Intern not found.");e.status=404;throw e;}
    save(next); return {success:true,message:"Intern deleted locally."};
  }

  const e=new Error("Local route not found."); e.status=404; throw e;
}

async function request(endpoint, options={}) {
  try { return await backend(endpoint, options); }
  catch(e) {
    // Real HTTP errors stay real; only unavailable/network failures fall back.
    if (!e.status || e.name==="AbortError") return fallback(endpoint, options);
    throw e;
  }
}

export const getInterns=()=>request("/interns");
export const getIntern=id=>request(`/interns/${id}`);
export const createIntern=data=>request("/interns",{method:"POST",body:JSON.stringify(data)});
export const updateIntern=(id,data)=>request(`/interns/${id}`,{method:"PUT",body:JSON.stringify(data)});
export const patchIntern=(id,data)=>request(`/interns/${id}`,{method:"PATCH",body:JSON.stringify(data)});
export const deleteIntern=id=>request(`/interns/${id}`,{method:"DELETE"});
export const getStats=()=>request("/stats");
