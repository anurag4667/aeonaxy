const sql = require("../config/database.js");
const {upload,deleteResources} = require("../utils/cloudinary.js");
const fs = require("fs");
exports.addcourse = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "You are not an admin."
            });
        }

        const { category, course_name, course_price, duration, ownerid, total_videos } = req.body;

        // Validate required fields
        if (!category || !course_name || !course_price || !duration || !ownerid || !total_videos) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Insert the new course into the database
        const result = await sql`INSERT INTO courses (category, course_name, course_price, duration, ownerid, total_videos)
                                  VALUES (${category}, ${course_name}, ${course_price}, ${duration}, ${ownerid}, ${total_videos})
                                  RETURNING *`;

        if (result.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to add the course."
            });
        }

        res.status(201).json({
            success: true,
            message: "Course added successfully.",
            course: result[0]
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

exports.deletecourse = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "You are not an admin."
            });
        }

        const { courseid } = req.body;

        // Validate that courseid is provided
        if (!courseid) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required."
            });
        }

        // Delete the course from the database
        const result = await sql`DELETE FROM courses WHERE courseid = ${courseid} RETURNING *`;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully.",
            course: result[0]
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const { category, price, course_name} = req.body;
        let courses;
        
        if(course_name){
            courses = await sql `select * from courses where course_name like ${'%'+course_name + '%'}`;
        }
        else 
            courses = await sql `select * from courses `;

        if(category){
            let temp = [];
            for(let i = 0; i < courses.length ; i++){
                if((courses[i].category === category)){
                    console.log(courses[i]);
                    temp.push(courses[i]);
                }
            }
            courses = temp;
        }
        if(price ){
            let temp = [];
            for(let i = 0; i < courses.length ; i++){
                if((courses[i].course_price <= price)){
                    temp.push(courses[i]);
                }
            }
            courses = temp;
        }
        
        
        return res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

exports.buyCourse = async (req,res) =>{
    
    try{const course = req.params.id;

    const find = await sql `select * from courses where course_id = ${course}`;
    if(find.length == 0){
        return res.status(400).json({
            success : false,
            message : "course does not exist"
        })
    }

    const alreadyEnrolled = await sql `select * from course_enrolled where course_id = ${course} and user_id = ${req.user.userid}`;
    if(alreadyEnrolled.length > 0){
        return res.status(400).json({
            success : false,
            message : "already enrolled"
        })
    }

    const query = await sql `insert into course_enrolled (course_id,user_id) values (${course},${req.user.userid})`;
    res.status(200).json({
        success: true,
        message : "course enrolled"
    });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}

exports.addVideos = async (req,res) =>{
    try {
        if(req.user.role !== "admin"){
            return res.status(400).json({
                success : false,
                message : "not an admin",
            })
        }

        const course = req.params.courseid;
        const {video_title, video_no} = req.body;
        const file = req.file;

        const uploadfile = await upload(file.path);
        const uploadvideo = await sql`insert into course_videos (course_id,video_title,video_number,video_url,video_public_id) values (${course},${video_title},${video_no},${uploadfile.url},${uploadfile.public_id})`;
        fs.unlinkSync(file.path);
        return res.status(200).json({
            success : true,
            message : "video has been uploaded"
        })


    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message
        })
    }
}

exports.deleteVideo = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins are allowed to delete videos."
            });
        }

        const videoId = req.params.videoid;

        // Retrieve video details from the database
        const [video] = await sql`
            SELECT video_url, video_public_id
            FROM course_videos
            WHERE video_id = ${videoId}
        `;

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        // Delete the video file from storage
        await deleteResources(video.video_public_id,"video");

        // Delete the video record from the database
        await sql`
            DELETE FROM course_videos
            WHERE video_id = ${videoId}
        `;

        return res.status(200).json({
            success: true,
            message: "Video deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

async function isUserEnrolledInCourse(userId, courseId) {
    const enrollment = await sql`
        SELECT * FROM course_enrolled
        WHERE user_id = ${userId} AND course_id = ${courseId}
    `;
    return enrollment.length > 0; 
}

exports.addComment = async (req, res) => {
    try {
        const userId = req.user.userid;
        const courseId = req.params.courseid;
        const videoId = req.params.videoid;
        const { comment } = req.body;

        // Check if the user is enrolled in the course
        const enrolled = await isUserEnrolledInCourse(userId, courseId);
        if (!enrolled) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course."
            });
        }

        // Add the comment to the database
        await sql`
            INSERT INTO comments (user_id, course_id, video_id, comment_text)
            VALUES (${userId}, ${courseId}, ${videoId}, ${comment})
        `;

        return res.status(200).json({
            success: true,
            message: "Comment added successfully."
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const userId = req.user.userid;
        const courseId = req.params.courseid;
        const videoId = req.params.videoid;
        const commentId = req.params.commentid; 
        // Check if the user is enrolled in the course
        const enrolled = await isUserEnrolledInCourse(userId, courseId);
        if (!enrolled) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course."
            });
        }

        // Delete the comment from the database
        const query = await sql`
            DELETE FROM comments
            WHERE comment_id = ${commentId}`;

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};