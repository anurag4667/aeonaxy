const express = require("express");
const app = express();
const cookieparser = require("cookie-parser");
const cors = require("cors");

if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({
        path: "config/config.env"
    });
}

app.use(express.json({limit : '50mb'}));
app.use(express.urlencoded({limit : '50mb',extended : true}));
app.use(cookieparser());
app.use(cors({
    origin : [process.env.FRONTEND_URL],
    methods : ["GET",'POST','PUT','DELETE'],
    credentials : true,
}))

const user = require("./routes/user.js");
const course = require("./routes/course.js");
app.use("/api/v1",user);
app.use("/api/v1",course);

module.exports = app;