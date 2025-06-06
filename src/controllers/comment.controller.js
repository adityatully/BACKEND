import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User  } from "../models/user.model.js";
import { Comment } from "../models/comments.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";



const getVideoComments = asyncHandler(async(req , res)=>{
    // is video id ke saare coments 
    const {videoId} = req.params 

    if(!isValidObjectId(videoId)){
        throw new ApiError(404 , "No video found")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(`${videoId}`)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            profilePicture: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                ownerDetails: 1
            }
        }
    ])
    if(!comments){
        throw new ApiError(404 , "No comments found for this video")
    }   

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )
})


const addComment = asyncHandler(async(req , res)=>{
    // we need to add the comment 
    const {videoId} = req.params  
    const {content} = req.body 
    const UserId = req.user._id // we have this because user is logged in

    if(!isValidObjectId(videoId)){
        throw new ApiError(404 , "No video found")
    }

    const newComment = await Comment.create({
        content , 
        video :videoId  ,
        owner :UserId 
    })

    if(!newComment){
        throw new ApiError(401 , "Could not add comment")
    }

    return res.status(200).json(
        new ApiResponse(200 , newComment , "Comment added succesfully")
    )
})


const deleteComment = asyncHandler(async(req ,res)=>{
    const {commentId} = req.params 
    if(!isValidObjectId(commentId)){
        throw new ApiError(404 , "coment id not mentioned")
    }

    const Deletedcomment = await Comment.deleteOne({
        _id: commentId,
        owner: req.user._id 
    })

    if(!Deletedcomment){
        throw new ApiError(404 , "Comment not found or you are not authorized to delete it")
    }

    return res.status(200).json(
        new ApiResponse(200 , Deletedcomment , "Comment deleted succesfully")
    )
})


const updateComment = asyncHandler(async(req , res)=>{
    const {commentId} = req.params 
    const {content} = req.body 

    if(!content || content.trim() === ""){
        throw new ApiError(404 , "Conetent cannot be emoty ")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(404 , "coment id not mentioned")
    }

    const UpdatedComment = await Comment.findByIdAndUpdate(
        {
            _id : commentId ,
            owner: req.user._id 
        },
        {
            $set : {
                content 
            }
        }, 
        {
            new : true
        }
    )

    if(UpdatedComment){
        throw new ApiError(404 , "Comment couldnt be updated")
    }

    return res.status(200).json(
        new ApiResponse(200 ,UpdatedComment , "Comment updated successfully")
    )
})

export {getVideoComments , addComment , deleteComment , updateComment}