const express=require("express");
const cors=require("cors");
const routes=require("./routes/internRoutes");
const errorHandler=require("./middleware/errorHandler");

const app=express();
const PORT=process.env.PORT||5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/",(req,res)=>res.json({success:true,message:"InternHub REST API is running.",version:"1.0.0"}));
app.get("/api/health",(req,res)=>res.status(200).json({success:true,status:"healthy",service:"InternHub API",timestamp:new Date().toISOString()}));

app.use("/api",routes);
app.use((req,res)=>res.status(404).json({success:false,message:`Route ${req.method} ${req.originalUrl} not found.`}));
app.use(errorHandler);

app.listen(PORT,()=>console.log(`InternHub API running at http://localhost:${PORT}`));
