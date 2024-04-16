const jwt = require('jsonwebtoken');
const fs = require('fs');
const sql = require("../config/database.js");
const {upload} = require("../utils/cloudinary.js");
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({
        path: "../config/config.env"
    });
}
const bcrypt = require("bcrypt");

class User {
    
    setuser({name,email,password,role,file}){
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.file = file;
    }
    async addUser(name,email,password,role,file) {
        try {
            this.name = name;
            this.email = email;
            this.password = password;
            this.role = role;
            this.file = file;
            let user = await sql`select * from users where email = ${this.email}`;

            if (user.length > 0) {
                return {
                    success: false,
                    message: "User already exists"
                };
            }
            //console.log(file);
            const uploadfile = await upload(this.file.path);
            this.password = await bcrypt.hash(this.password,10);
            user = await sql`insert into users (name, email, password, role, avatar_public_id, avatar_url) values (
                ${this.name}, ${this.email}, ${this.password}, ${this.role}, ${uploadfile.public_id}, ${uploadfile.url})`;

            // Delete the uploaded file from the local cache
            fs.unlinkSync(this.file.path);

            return {
                success: true, 
                message : "User created",
            };
        } catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    }

    generateToken(userid) {
        const token = jwt.sign({ id: userid }, process.env.JWT_SECRET);
        return token;
    }
}

module.exports = User;