import mysql from 'mysql2/promise';
import express from 'express';
import knex from 'knex';
import cors from 'cors';
const app=express();
const pool = mysql.createPool({
    host: 'bntddj26lkwrpkkdvahk-mysql.services.clever-cloud.com',
    user: 'urkl2bq6tig8zo5n',
    password: 'CH0bBXMMtUEMimeaqa6e',
    database: 'bntddj26lkwrpkkdvahk',
    connectionLimit:4
  });
const db=  knex({
    client:'pg',
    connection:{
      host:'ddks.postgres.database.azure.com',
      user:'ddks',
      password:'Bali@123',
      port:'5432',
      database:'dhruv',
      ssl: true
    }
  })
  app.use(cors());
  app.use(express.json());
// let resp= await db.select(['username','update_text']).from('pubbulletin');
// console.log(JSON.stringify(resp));

  // connection.connect((err) => {
  //   if (err) {
  //     console.error('Error connecting to MySQL:', err);
  //   } else {
  //     console.log('Connected to MySQL database');
  //   }
  // });
  // const connection = await pool.getConnection();
  // let check=connection.execute("create table PubBulletin(date DATE,data text not null)")
  // connection.release();
  //  app.get("/getBulletin",async (req,resp)=>{
  //   try{
  //   let response=await db.select(['username','update_text']).from('pubbulletin');
  //   let res=JSON.stringify(response);
  //   resp.send(res);
  //   db.destroy();
  //   }
  //   catch(error){
  //     resp.status(500).send('Interval Server Error');
  //   }
  // })

  app.post("/login",async (req,resp)=>{
    let {username,password}=req.body;
    console.log("username",username);
    try {
      const user = await db.select().from('login').where({ username, password }).first();
  
      if (user) {
        let pl=await db("session").where({username}).update({'loggintime':Date.now()});
        resp.send("Successful");
      } else {
        resp.status(401).send('Invalid credentials');
      }
    } catch (error) {
      console.error('Error during login:', error.message);
      resp.status(500).send('Internal Server Error');
    }
  })
console.log("App Started and Listening in Progress !");


async function isLoggedIn(req,resp,next){
  let username =req.params.username;
  // console.log("Got", username);
  let sessionCheck=await db.select('loggintime').from('session').where({username});
  // console.log(sessionCheck[0]);
  // console.log(Date.now());
  try {
    if(Date.now()-Number(sessionCheck[0].loggintime)<=300000){
      // HTML send
      // resp.send("Hello There ");
      await db("session").where({username}).update({'loggintime':Date.now()});
      next();
    }
    else{
      // Send Error Message
      resp.status(403).send("Login Session Expired, Log in Again ");
      
    }
  }
  catch(error){
    resp.status(500).send("Internal Server Error");
  }
} 

app.get("/user/:username" ,isLoggedIn,(req,resp)=>{
// Here have to send the html file 

});
app.get("/user/:username/info",isLoggedIn,(req,resp)=>{

})
app.get("/user/:username/requests",isLoggedIn, async (req,resp)=>{
 let username =req.params.username;
 console.log("Here I am");
 const coords=await db.select("AgencyLat","AgencyLong").from('agencies').where({username}).first();
 let{AgencyLat,AgencyLong}=coords;
 let MAX_DISTANCE=100;
 const requestsWithinDistance = await db
  .select('*')
  .from(function() {
    // Subquery to calculate distance and filter requests
    this.select('*')
      .from('requests')
      .whereRaw(`calculate_distance(${AgencyLat}, ${AgencyLong}, Lat, Long) <= ${MAX_DISTANCE}`)
      .as('filtered_requests');
  });
  resp.send(requestsWithinDistance);
  // console.log(requestsWithinDistance);
}) 
app.post("/user/:username/mark",isLoggedIn,async (req,resp)=>{
  let username=req.params.username;
  console.log("Oh");
  let {ReqID,Action}=req.body;
  try{
    let check=await db("requests").where({"requestid":ReqID}).update({"status":"true","action_taken":Action});
  if(check) resp.send("Success");
  else resp.status(403).send("Bad Request");
  }
  catch(error){
    resp.status(500).send("Internal Server Problem");
  }

})
app.get("/user/:username/getUpdates",isLoggedIn,async (req,resp)=>{
  let username=req.params.username;
  try{
    let get=await db.select().from("pvtbulletin").where('username','!=',username).whereRaw('date>=CURRENT_DATE-INTERVAL \'7 days \'').orderBy('date','desc').orderBy('time','desc');
    if(get.length>=0) resp.send(get);
    else resp.status(403).send("Bad Request");
  }
  catch(error){
    resp.status(500).send("Interval Server Problem");
  }
})
app.post("/user/:username/postpvt",isLoggedIn,async (req,resp)=>{
  let username=req.params.username;
  let {message}=req.body;
  let obj={username,message};
  try{
    let get=await db("pvtbulletin").insert(obj);
    resp.send("Success")
  }
  catch(error){
    resp.status(500).send("Internal Server Error");
  }
})
app.post("/user/:username/postpub",isLoggedIn,async (req,resp)=>{
  let username=req.params.username;
  let {message}=req.body;
  let obj={username,"update_text":message};
  try{
    let get=await db("pubbulletin").insert(obj);
    resp.send("Success")
  }
  catch(error){
    resp.status(500).send("Internal Server Error");
  }
})
app.get("/getPub",async (req,resp)=>{
  try{
  let list=await db.select("pubbulletin.date","pubbulletin.update_text","agencies.agency_name").from("pubbulletin").join("agencies","pubbulletin.username","=","agencies.username");
  // console.log(list);
  resp.send(list);
  }
  catch(error) {resp.status(500).send("Internal Server Problem");}
})

app.get("/getAgencies",async (req,resp)=>{
    let list = await db.select("lat","long","agency_name").from("agencies");
    resp.send(list);
})

app.post("/postRequest",async(req,resp)=>{
  try{let obj=req.body;
    // console.log(obj);
  let check= await db("requests").insert(obj);
  if(check) resp.send("Successfull");
  else resp.status(403).send("Bad Requests");
  }
  catch(error) {resp.status(500).send("Internal Server Error");}
})
app.get('/',async(req,resp)=>{
  resp.send("<h1> I am alive. </h1>");
})

app.get("/user/:username/coords",async(req,resp)=>{
  try{
    let username=req.params.username;
    let coords=await db.select("lat as AgencyLat","long as AgencyLong").from('agencies').where({username}).first();
    console.log("YOi");
    resp.send(coords);
  }
  catch(error){
    resp.status(404).send("Bad Request");
  }
})
/// Almost all api have been created , looking fwd to integrate it with front end, and register part is also remaining and also , the getPub is sending the username not Agency name 
app.listen(process.env.PORT||3010);