import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Tweet } from "../models/tweets.model.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async(req , res)=>{
    // first to create a tweet , user shud be logged in 
    // if logged in then req will have req.user  

    const {content} = req.body 
    if(!content){
        throw new ApiError(400 , "Tweet Cannot be empty")
    }

    // we have the tweet and the user 
    const tweet = await Tweet.create({
        content , 
        owner : req.user._id
    })

    if(!tweet){
        throw new ApiError(401 , "Error creating the tweet ")
    }

    return res.status(201).json(
        new ApiResponse(201, tweet , "Tweet Created  successfully")
    )
})


const getUserTweets = asyncHandler(async(req , res)=>{
    // user is logged in so we have the req.user._id
    // for a particlar id we need all tweets 
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.params.userId)
            }
        }
        , 
        {
            $project: {
                _id: 1,
                content: 1
            }
        }
    ])

    if(!tweets){
        throw new ApiError(401  , "Error fetching the tweets")

    }

    return res.status(201).json(
        new ApiResponse(tweets , "Tweets fetched succesfully")
    )
})


const deleteTweet = asyncHandler(async(req , res)=>{
    // user will be alrady loggedn in j, we will get the twet it from the req.params 
    const tweetDeleted = await Tweet.deleteOne({
        _id : req.params.tweetId
    })

    if(!tweetDeleted){
        throw new ApiError(401 , "tweet cannot be deleted")
    }

    return res.status(201).json(
        new ApiResponse(200 , "Tweet deleted succesfully" , tweetDeleted)
    )
})

const updateTweet = asyncHandler(async(req , res)=>{
    // user logged in we hv req.user
    // tweet id from req.params 
    // content from the body 
    const {content} = req.body 
    if(!content){
        throw new ApiError(401 , "Pls enter the content ")
    }

    const updateTweet = await  Tweet.findByIdAndUpdate(req.params.tweetId , {
        $set : {
            content : content 
        } 
    } , {new : true})

    if(!updateTweet){
        throw new ApiError(402 , "tweet could not be updated")
    }

    return res.status(201).json(
        new ApiResponse( 200 , "tweet update" , updateTweet)
    )
})

export {createTweet , getUserTweets , deleteTweet , updateTweet }