const jwt = require("jsonwebtoken");
const sql = require("../config/database.js");
exports.isauthenticated = async (req,res,next) => {
    try{
        const {token} = req.cookies;

    if(!token){
        return res.status(401).json({
            message : "Please login first"
        });
    }

    const decoded = await jwt.verify(token,process.env.JWT_SECRET);

    const user  = await sql`select * from users where userid = ${decoded.id}`;
    req.user = user[0];
    next();
    }
    catch(err){
        res.status(500).json({
            message : err.message
        })
    }
    
}