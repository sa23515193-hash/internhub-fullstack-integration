import {useCallback,useEffect,useMemo,useState} from "react";
import {createIntern,deleteIntern,getInterns,getStats,patchIntern,updateIntern} from "./api";

const EMPTY={name:"",email:"",phone:"",department:"Web Development",role:"",status:"Active",progress:0,startDate:"",endDate:"",mentor:"",location:"",skills:"",tasksCompleted:0,tasksTotal:0};

export default function App(){
  const [interns,setInterns]=useState([]);
  const [stats,setStats]=useState({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("All");
  const [department,setDepartment]=useState("All");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [toast,setToast]=useState(null);
  const [activity,setActivity]=useState([]);

  const notify=useCallback((type,message)=>{
    setToast({type,message});
    setTimeout(()=>setToast(null),3200);
  },[]);

  const log=useCallback((method,endpoint,status,duration)=>{
    setActivity(a=>[{id:Date.now()+Math.random(),method,endpoint,status,duration},...a].slice(0,8));
  },[]);

  const load=useCallback(async()=>{
    setLoading(true); setError("");
    const start=performance.now();
    try{
      const [a,b]=await Promise.all([getInterns(),getStats()]);
      setInterns(a.data||[]); setStats(b.data||{});
      log("GET","/api/interns",200,Math.round(performance.now()-start));
    }catch(e){
      setError(e.message||"Unable to load data.");
      log("GET","/api/interns",e.status||500,Math.round(performance.now()-start));
    }finally{setLoading(false);}
  },[log]);

  useEffect(()=>{load()},[load]);

  const departments=useMemo(()=>["All",...new Set(interns.map(x=>x.department))],[interns]);
  const filtered=useMemo(()=>{
    const q=search.toLowerCase().trim();
    return interns.filter(x=>{
      const qok=!q||[x.name,x.email,x.role,x.department].some(v=>String(v||"").toLowerCase().includes(q));
      return qok&&(status==="All"||x.status===status)&&(department==="All"||x.department===department);
    });
  },[interns,search,status,department]);

  const change=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const create=()=>{setEditing(null);setForm(EMPTY);setModal(true)};
  const edit=x=>{setEditing(x);setForm({...x,skills:(x.skills||[]).join(", ")});setModal(true)};

  async function submit(e){
    e.preventDefault();
    if(!form.name.trim()||!form.email.trim()||!form.role.trim()){notify("error","Please complete required fields.");return}
    const payload={...form,progress:Number(form.progress),tasksCompleted:Number(form.tasksCompleted),tasksTotal:Number(form.tasksTotal),skills:form.skills.split(",").map(x=>x.trim()).filter(Boolean)};
    const start=performance.now();
    try{
      if(editing){
        const r=await updateIntern(editing.id,payload);
        log("PUT",`/api/interns/${editing.id}`,200,Math.round(performance.now()-start));
        notify("success",r.message||"Intern updated.");
      }else{
        const r=await createIntern(payload);
        log("POST","/api/interns",201,Math.round(performance.now()-start));
        notify("success",r.message||"Intern created.");
      }
      setModal(false);setEditing(null);setForm(EMPTY);await load();
    }catch(e){notify("error",e.message||"Request failed.");log(editing?"PUT":"POST",editing?`/api/interns/${editing.id}`:"/api/interns",e.status||500,Math.round(performance.now()-start))}
  }

  async function remove(x){
    if(!confirm(`Delete ${x.name}?`))return;
    const start=performance.now();
    try{await deleteIntern(x.id);log("DELETE",`/api/interns/${x.id}`,204,Math.round(performance.now()-start));notify("success","Intern deleted.");setSelected(null);await load()}
    catch(e){notify("error",e.message||"Delete failed.")}
  }

  async function quick(x,newStatus){
    const start=performance.now();
    try{const r=await patchIntern(x.id,{status:newStatus});log("PATCH",`/api/interns/${x.id}`,200,Math.round(performance.now()-start));notify("success",r.message||"Status updated.");setSelected(null);await load()}
    catch(e){notify("error",e.message||"Update failed.")}
  }

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo">I</div><div><b>InternHub</b><small>Integration Suite</small></div></div>
      <nav>
        <button className="active">⌂ <span>Dashboard</span></button>
        <button>◈ <span>Interns</span></button>
        <button>◌ <span>API Monitor</span></button>
        <button>⚙ <span>Settings</span></button>
      </nav>
      <div className="connection"><i/> <div><b>API Ready</b><small>REST Integration</small></div></div>
    </aside>

    <main className="main">
      <header className="hero">
        <div><label>INTERNSHIP PROJECT 04</label><h1>Full-Stack Integration</h1><p>Intern management powered by REST APIs, async JavaScript and defensive error handling.</p></div>
        <button className="primary" onClick={create}>＋ Add Intern</button>
      </header>

      {error&&<div className="alert"><div><b>API request failed</b><span>{error}</span></div><button onClick={load}>Retry</button></div>}

      <section className="stats">
        <Stat icon="◎" title="Total Interns" value={stats.total||0}/>
        <Stat icon="↗" title="Active" value={stats.active||0}/>
        <Stat icon="✓" title="Completed" value={stats.completed||0}/>
        <Stat icon="◔" title="Average Progress" value={`${stats.averageProgress||0}%`}/>
      </section>

      <section className="card directory">
        <div className="sectionHead"><div><label>RESOURCE MANAGEMENT</label><h2>Intern Directory</h2></div><button className="ghost" onClick={load} disabled={loading}>↻ {loading?"Loading":"Refresh"}</button></div>
        <div className="filters">
          <div className="search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, role..."/></div>
          <select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Active</option><option>Completed</option><option>On Hold</option></select>
          <select value={department} onChange={e=>setDepartment(e.target.value)}>{departments.map(x=><option key={x}>{x}</option>)}</select>
        </div>

        {loading?<div className="state"><div className="spinner"/><h3>Fetching API data...</h3><p>Waiting for asynchronous response.</p></div>:
        filtered.length===0?<div className="state"><strong>⌕</strong><h3>No interns found</h3><p>Try another search or filter.</p></div>:
        <div className="tableWrap"><table><thead><tr><th>Intern</th><th>Department</th><th>Role</th><th>Status</th><th>Progress</th><th>Actions</th></tr></thead><tbody>
          {filtered.map(x=><tr key={x.id}>
            <td><div className="person"><div className="avatar">{x.name?.[0]}</div><div><b>{x.name}</b><small>{x.email}</small></div></div></td>
            <td>{x.department}</td><td>{x.role}</td>
            <td><em className={`badge ${x.status.toLowerCase().replace(" ","-")}`}>{x.status}</em></td>
            <td><div className="prog"><div><span style={{width:`${x.progress}%`}}/></div><small>{x.progress}%</small></div></td>
            <td><div className="actions"><button onClick={()=>setSelected(x)}>View</button><button onClick={()=>edit(x)}>Edit</button><button className="danger" onClick={()=>remove(x)}>Delete</button></div></td>
          </tr>)}
        </tbody></table></div>}
      </section>

      <section className="lower">
        <div className="card panel"><label>API MONITOR</label><h2>Recent Requests</h2>
          <div className="activity">{activity.length?activity.map(x=><div className="row" key={x.id}><b className={`method ${x.method.toLowerCase()}`}>{x.method}</b><code>{x.endpoint}</code><span>{x.status}</span><small>{x.duration}ms</small></div>):<p className="muted">No API activity yet.</p>}</div>
        </div>
        <div className="card panel"><label>INTEGRATION FLOW</label><h2>Frontend → API → Response</h2>
          <div className="flow"><b>React</b><i>→</i><b>Fetch</b><i>→</i><b>REST</b><i>→</i><b>JSON</b><i>→</i><b>UI</b></div>
          <p className="muted">GET, POST, PUT, PATCH and DELETE are demonstrated with async/await, status checks and user-friendly errors.</p>
        </div>
      </section>
    </main>

    {modal&&<div className="overlay"><div className="modal"><div className="modalTop"><div><label>{editing?"PUT REQUEST":"POST REQUEST"}</label><h2>{editing?"Edit Intern":"Add New Intern"}</h2></div><button onClick={()=>setModal(false)}>×</button></div>
      <form onSubmit={submit}><div className="formGrid">
        <Field label="Full Name *" name="name" value={form.name} onChange={change}/><Field label="Email *" name="email" type="email" value={form.email} onChange={change}/>
        <Field label="Phone" name="phone" value={form.phone} onChange={change}/><Field label="Role *" name="role" value={form.role} onChange={change}/>
        <Select label="Department" name="department" value={form.department} onChange={change} options={["Web Development","Backend Development","UI/UX Design","Data Science","Marketing","Mobile Development"]}/>
        <Select label="Status" name="status" value={form.status} onChange={change} options={["Active","Completed","On Hold"]}/>
        <Field label="Progress %" name="progress" type="number" min="0" max="100" value={form.progress} onChange={change}/>
        <Field label="Mentor" name="mentor" value={form.mentor} onChange={change}/><Field label="Location" name="location" value={form.location} onChange={change}/>
        <Field label="Start Date" name="startDate" type="date" value={form.startDate} onChange={change}/><Field label="End Date" name="endDate" type="date" value={form.endDate} onChange={change}/>
        <Field label="Completed Tasks" name="tasksCompleted" type="number" value={form.tasksCompleted} onChange={change}/><Field label="Total Tasks" name="tasksTotal" type="number" value={form.tasksTotal} onChange={change}/>
        <div className="full"><Field label="Skills — comma separated" name="skills" value={form.skills} onChange={change} placeholder="React, JavaScript, CSS"/></div>
      </div><div className="formActions"><button type="button" className="ghost" onClick={()=>setModal(false)}>Cancel</button><button className="primary">{editing?"Update Intern":"Create Intern"}</button></div></form>
    </div></div>}

    {selected&&<div className="overlay"><div className="modal detail"><div className="modalTop"><div className="person"><div className="avatar big">{selected.name?.[0]}</div><div><label>{selected.id}</label><h2>{selected.name}</h2></div></div><button onClick={()=>setSelected(null)}>×</button></div>
      <div className="detailGrid">{[["Email",selected.email],["Department",selected.department],["Role",selected.role],["Mentor",selected.mentor||"Not assigned"],["Location",selected.location||"Not provided"],["Progress",`${selected.progress}%`]].map(([a,b])=><div key={a}><small>{a}</small><b>{b}</b></div>)}</div>
      <h4>Skills</h4><div className="skills">{(selected.skills||[]).map(s=><span key={s}>{s}</span>)}</div>
      <h4>Quick PATCH Status Update</h4><div className="quick"><button onClick={()=>quick(selected,"Active")}>Active</button><button onClick={()=>quick(selected,"Completed")}>Completed</button><button onClick={()=>quick(selected,"On Hold")}>On Hold</button></div>
    </div></div>}

    {toast&&<div className={`toast ${toast.type}`}><b>{toast.type==="success"?"Success":"Error"}</b><span>{toast.message}</span></div>}
  </div>
}

function Stat({icon,title,value}){return <div className="stat"><strong>{icon}</strong><div><small>{title}</small><b>{value}</b></div></div>}
function Field({label,...props}){return <label className="field"><span>{label}</span><input {...props}/></label>}
function Select({label,options,...props}){return <label className="field"><span>{label}</span><select {...props}>{options.map(x=><option key={x}>{x}</option>)}</select></label>}
