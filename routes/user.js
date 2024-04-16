const express = require("express");

const router = express.Router();

const { register,login,logout,updatepassword ,deletemyprofile , forgotpassword, resetpassword} = require("../controllers/user.js");
const upload  = require("../middlewares/multer.js");
const { isauthenticated } = require("../middlewares/auth.js");

router.route("/register").post(upload.single('photo'),register);

router.route("/login").post(login);
router.route("/logout").get(isauthenticated,logout);
router.route("/updatepassword").post(isauthenticated,updatepassword);
router.route("/deleteprofile").delete(isauthenticated,deletemyprofile);
router.route("/forgot/password").get(forgotpassword);
router.route("/password/reset/:token").put(resetpassword);
module.exports = router;