const app = require("./app.js");
const sql = require("./config/database.js");

app.listen(process.env.PORT,()=>{
    console.log(`server is running on port ${process.env.PORT} in enviornment ${process.env.NODE_ENV}`);
})

app.get("/",(req,res)=>{
    res.send("working");
})

