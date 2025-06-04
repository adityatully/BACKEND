import {Router} from 'express';
import { loginUser, logoutUser, registerUser , refreshAccessToken ,  
changeCurrentPassword , getCurrentUser ,UpdateUser , UpdateUserAvatar , UpdateUserCoverImage} from '../controllers/user.controller.js';
import {upload} from "../middlewares/multer.middleware.js"; 
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 } 
    ])
    , registerUser)
// yaha pe https://localhost:8000/api/v1/users/register
router.route("/login").post(loginUser);
router.route("/logout").post( verifyJWT , logoutUser)
router.route("/refreshToken").post(refreshAccessToken)
router.route("/changepassword").post(verifyJWT, changeCurrentPassword);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/update-user").patch(verifyJWT, UpdateUser);
router.route("/update-avatar").patch(verifyJWT, upload.single('avatar'), UpdateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT, upload.single('coverImage'), UpdateUserCoverImage);

export default router 

