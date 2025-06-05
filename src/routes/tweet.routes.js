import { Router } from 'express';
import {
    createTweet,
    updateTweet ,
    getUserTweets,
    deleteTweet

} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);   // req.params.userId 
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router 