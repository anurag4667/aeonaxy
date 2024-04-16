const express = require("express");
const { isauthenticated } = require("../middlewares/auth");
const { addcourse, deletecourse, getAllCourses, buyCourse, addVideos, deleteVideo, addComment, deleteComment } = require("../controllers/course");
const upload = require("../middlewares/multer");

const router = express.Router();

router.route("/addcourse").post(isauthenticated,addcourse);
router.route("/deletecourse").delete(isauthenticated,deletecourse);
router.route("/courses").get(isauthenticated,getAllCourses);
router.route("/course/buy/:id").post(isauthenticated,buyCourse);
router.route("/course/:courseid/video/add").post(isauthenticated,upload.single('video'),addVideos);
router.route("/video/delete/:videoid").delete(isauthenticated,deleteVideo);
router.route("/course/:courseid/video/:videoid/comment").post(isauthenticated,addComment);
router.route("/course/:courseid/video/:videoid/comment/:commentid").delete(isauthenticated,deleteComment);
module.exports = router;