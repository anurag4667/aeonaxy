const sql = require("../config/database.js");
const {upload,deleteResources} = require("../utils/cloudinary.js");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const sendmail = require("../utils/email.js");
const User = require("../models/user.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.register = async (req,res) => {
    try {
        const { name, email, password, role } = req.body;
        const userInstance = new User(); // Create an instance of the User class
        console.log(req.body);
        let user = await userInstance.addUser(name, email, password, role, req.file); // Call addUser method on the instance
        if (user.success) {
            user = await sql`select * from users where email = ${email}`;
            const token = userInstance.generateToken(user[0].userid);
            
            //sendmail({to : email , subject : "Registration" , body : "Successfully registred"});
            res.status(201).cookie("token", token, {
                expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                secure: process.env.NODE_ENV === "development" ? false : true,
            }).json({
                success: true,
                token,
            });
        } else {
            res.status(400).json({
                success: false,
                message: user.message,
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

exports.login = async (req,res) =>{

    try{
        const {email,password} = req.body;
        const userInstance = new User();
        const user = await sql`select * from users where email = ${email}`;

        if(user.length == 0){
            return res.status(400).json({
                success : false,
                message : "user not found"
            })
        }
        
        const ismatch = await bcrypt.compare(password,user[0].password);
        userInstance.setuser(user[0]);

        if(!ismatch){
            return res.status(400).json({
                success : false,
                message : "incorrect password"
            })
        }
        //console.log(user[0].userid);
        const token =  userInstance.generateToken(user[0].userid);

        res.status(200).cookie("token",token ,{
            expires : new Date(Date.now() + 90*24*60*60*1000),
            httpOnly : true,
            sameSite : process.env.NODE_ENV === "development" ? "lax" : "none",
            secure : process.env.NODE_ENV === "development" ? false : true,
        })
        .json({
            success : true,
            token,
        })
    }
    catch(err){
        return res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

exports.logout = async (req,res) =>{
    try{
        res.status(200)
        .cookie("token" , null ,{expires : new Date(Date.now())
            ,httpOnly : true,
            sameSite : process.env.NODE_ENV === "development" ? "lax" : "none",
            secure : process.env.NODE_ENV === "development" ? false : true,
        })
        .json({
            success : true,
            message : "logged out"
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

exports.updatepassword = async(req,res) =>{
    try{
        const user = await sql`select * from users where userid = ${req.user.userid}`;
        //console.log(user);
        const {oldpassword,newpassword} = req.body;

        if(!oldpassword || !newpassword){
            return res.status(400).json({
                success : false,
                message : "please enter old and new password"
            })
        }
        if(oldpassword === newpassword){
            return res.status(400).json({
                success : false,
                message : "old and new password cannot be same"
            })
        }

        const ismatch = await bcrypt.compare(oldpassword,user[0].password);

        if(!ismatch){
            return res.status(400).json({
                success : false,
                message : "old password is incorrect"
            })
        }
        const temp = await bcrypt.hash(newpassword,10);
        await sql`update users set password = ${temp} where userid = ${user[0].userid}`;

        res.status(200).json({
            success : "true",
            message : "password changed"
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

exports.deletemyprofile = async (req,res) =>{
    try {
        const delcoursesenroll = await sql`delete from course_enrolled where user_id = ${req.user.userid}`;
        const delcom = await sql`delete from comments where user_id = ${req.user.userid}`;
        const delcourses = await sql`delete from courses where ownerid = ${req.user.userid}`;
        const delprof = await sql`delete from users where userid = ${req.user.userid}`;
        
        //sendmail({to : req.user.email , subject : "Account deletion", body : "Your account has been successfully deleted" });
        
        const deletephoto = await deleteResources(req.user.avatar_public_id,"photo");

        res.cookie("token" , null ,{expires : new Date(Date.now())
            ,httpOnly : true,
            sameSite : process.env.NODE_ENV === "development" ? "lax" : "none",
            secure : process.env.NODE_ENV === "development" ? false : true,
        });


        res.status(200).json({
            success : true,
            message : "profile deleted",
        })
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}

exports.myprofile = async (req,res) =>{
    try {

        const user = req.user;
        res.status(200).json({
            success : true,
            user,
        })
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}


exports.forgotpassword = async (req,res) =>{
    try{
        let user = await sql`select * from users where email = ${req.body.email}`;
        
        if(user.length == 0){
            return res.status(404).json({
                success : false,
                message : "user not found",
            })
        }
        user = user[0];
        const resetToken = crypto.randomBytes(20).toString('hex');

        const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetPasswordExpire = Date.now() + 10*60*1000;


        await sql`update users set reset_password_token = ${resetPasswordToken} where userid = ${user.userid}`;
        await sql`update users set reset_password_expire = ${resetPasswordExpire} where userid = ${user.userid}`;

        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;

        const message = `reset your password by clicking on this link: \n\n ${resetUrl}`;
        
        try {
            await sendmail({
                to : user.email,
                subject : 'reset password',
                body : message,
            })
            res.status(200).json({
                success : true,
                message : `email sent to ${user.email}`,
            });
        } catch (error) {
            await sql`update users set reset_password_token = NULL where userid = ${user.userid}`;
            await sql`update users set reset_password_token = NULL where userid = ${user.userid}`;

            res.status(500).json({
                success : false,
                message : error.message,
            })
        }
    
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message,
        })
    }
}

exports.resetpassword = async (req, res) => {
    try {
        const resetPasswordToken = req.params.token; // Get the reset token from the request parameters

        // Check if the token is valid (i.e., not expired)
        let user = await sql`select * from users where reset_password_token = ${resetPasswordToken} 
                               and reset_password_expire > ${Date.now()}`;

        if (user.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset password token.'
            });
        }
        user = user[0];
        // Token is valid, proceed with password reset
        const { password } = req.body;

        // Hash the new password before updating the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password and clear the reset token and expiration time
        await sql`update users set password = ${hashedPassword}, 
                   reset_password_token = NULL, reset_password_expire = NULL 
                   where userid = ${user.userid}`;

        res.status(200).json({
            success: true,
            message: 'Password reset successful.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};