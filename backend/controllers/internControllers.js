const fs=require("fs");
const path=require("path");
const file=path.join(__dirname,"../data/interns.json");
const read=()=>JSON.parse(fs.readFileSync(file,"utf8"));
const write=data=>fs.writeFileSync(file,JSON.stringify(data,null,2),"utf8");

exports.getInterns=(req,res)=>{
  try{
    let data=read(); const {search,status,department}=req.query;
    if(search){const q=search.toLowerCase();data=data.filter(x=>[x.name,x.email,x.role,x.department].some(v=>String(v).toLowerCase().includes(q)))}
    if(status&&status!=="All")data=data.filter(x=>x.status===status);
    if(department&&department!=="All")data=data.filter(x=>x.department===department);
    res.status(200).json({success:true,count:data.length,data});
  }catch{res.status(500).json({success:false,message:"Unable to retrieve interns."})}
};

exports.getIntern=(req,res)=>{
  try{const x=read().find(i=>i.id===req.params.id);if(!x)return res.status(404).json({success:false,message:"Intern not found."});res.status(200).json({success:true,data:x})}
  catch{res.status(500).json({success:false,message:"Unable to retrieve intern."})}
};

exports.createIntern=(req,res)=>{
  try{
    const data=read(),b=req.body;
    if(!b.name||!b.email||!b.department||!b.role)return res.status(400).json({success:false,message:"Name, email, department and role are required."});
    if(data.some(x=>x.email.toLowerCase()===b.email.toLowerCase()))return res.status(409).json({success:false,message:"An intern with this email already exists."});
    const x={id:`INT-${Date.now().toString().slice(-6)}`,name:b.name,email:b.email,phone:b.phone||"",department:b.department,role:b.role,status:b.status||"Active",progress:Number(b.progress)||0,startDate:b.startDate||"",endDate:b.endDate||"",mentor:b.mentor||"",location:b.location||"",skills:Array.isArray(b.skills)?b.skills:[],tasksCompleted:Number(b.tasksCompleted)||0,tasksTotal:Number(b.tasksTotal)||0};
    data.unshift(x);write(data);res.status(201).json({success:true,message:"Intern created successfully.",data:x});
  }catch{res.status(500).json({success:false,message:"Unable to create intern."})}
};

exports.updateIntern=(req,res)=>{
  try{
    const data=read(),i=data.findIndex(x=>x.id===req.params.id),b=req.body;
    if(i<0)return res.status(404).json({success:false,message:"Intern not found."});
    if(!b.name||!b.email||!b.department||!b.role)return res.status(400).json({success:false,message:"Name, email, department and role are required."});
    data[i]={...b,id:data[i].id,progress:Number(b.progress)||0,tasksCompleted:Number(b.tasksCompleted)||0,tasksTotal:Number(b.tasksTotal)||0,skills:Array.isArray(b.skills)?b.skills:[]};
    write(data);res.status(200).json({success:true,message:"Intern updated successfully.",data:data[i]});
  }catch{res.status(500).json({success:false,message:"Unable to update intern."})}
};

exports.patchIntern=(req,res)=>{
  try{const data=read(),i=data.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({success:false,message:"Intern not found."});data[i]={...data[i],...req.body};write(data);res.status(200).json({success:true,message:"Intern partially updated.",data:data[i]})}
  catch{res.status(500).json({success:false,message:"Unable to update intern."})}
};

exports.deleteIntern=(req,res)=>{
  try{const data=read(),next=data.filter(x=>x.id!==req.params.id);if(next.length===data.length)return res.status(404).json({success:false,message:"Intern not found."});write(next);res.status(204).send()}
  catch{res.status(500).json({success:false,message:"Unable to delete intern."})}
};

exports.getStats=(req,res)=>{
  try{const data=read(),total=data.length,active=data.filter(x=>x.status==="Active").length,completed=data.filter(x=>x.status==="Completed").length,onHold=data.filter(x=>x.status==="On Hold").length,averageProgress=total?Math.round(data.reduce((s,x)=>s+Number(x.progress||0),0)/total):0;res.status(200).json({success:true,data:{total,active,completed,onHold,averageProgress}})}
  catch{res.status(500).json({success:false,message:"Unable to calculate statistics."})}
};
