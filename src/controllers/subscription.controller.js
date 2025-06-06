import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Tweet } from "../models/tweets.model.js";

import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js";


const getUserChannelSubscribers = asyncHandler(async(req ,res )=>{
    // we need to get subscribers of a channel 
    // channel Id in the params 
    // we need all subscribers of the channel we can retun the subscriber id name etc
    const {channelId} = req.params 
    if(!isValidObjectId(channelId)){
        throw new ApiError(404 , "No channel")
    }
    const subscribers = await Subscription.aggregate([
        {
            // first we match teh channel id 
            $match : {
                channel : new mongoose.Types.ObjectId(`${channelId}`),
            }
            // we have the channel id ke all docs , which also have the subscriber id 
        } ,
        {
            $lookup : {
                from : "users" , 
                localField : "subscriber" ,
                foreignField : "_id" , 
                as : "AllSubscribers" , 
                pipeline: [
                    {
                        $project : {
                            username : 1 , 
                            fullname : 1 , 
            
                        }
                    }
                ]
            }
        } 
    ])

    if(subscribers.length === 0){
        throw new ApiError(404, "No subscribers found");
    }
    
    return res.status(201).json(
        new ApiResponse(201 , subscribers , "list of subscribers")
    )

})

const getSubscribedChannels = asyncHandler(async(req , res)=>{
    // we will get a subscriberId and we have to give all subscribed channels for that id 
    // already loggen in 
    const {subscriberId} = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(404 , "Not a valid subscriber ID")
    }
    const channels = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(`${subscriberId}`)
            }
        // we have the documents with the subscribr id given 
        }
        ,
        {
            $lookup : {
                from : "users" , 
                localField : "channel" , 
                foreignField : "_id",
                as : "ChannelList" , 
                pipeline : [
                    {
                        $project  : {
                            username : 1
                        }
                    }
                ]
            }
        }

    ])

    if (!channels || channels.length === 0) {
        throw new ApiError(404, "No subscribed channels found");
      }
    
    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
     );
})


const toggleSubscription = asyncHandler(async(req , res)=>{
    // channel id from the req . params 
    // subscriber id or user id  req.user._id because the user is loggen in and jwt MIDDLEWARE injects it 

    const subscriberId = req.user._id 
    const {channelId} = req.params 

    if(!isValidObjectId(channelId)){
        throw new ApiError(404 , "nOT A VALID CHANNEL ID")
    }

    const isSubscribed  =  await Subscription.findOne({
        
            channel : channelId,
            subscriber : subscriberId
        
    })

    if(!isSubscribed){
        // means not subscribed 
        // so we add 
        const Subscribed = await Subscription.create({
            channel : channelId , 
            subscriber : subscriberId 
        })

        if(!Subscribed){
            throw new ApiError(401 , "Could not subscribe")
        }

        return res.status(201).json(
            new ApiResponse(201 , Subscribed , "channel subscribed succefully")
        )
    }

    // else means it is subscribed 

    const Unsubscribed = await Subscription.findOneAndDelete({
            channel : channelId,
            subscriber : subscriberId
    })

    if(!Unsubscribed){
        throw new ApiError(404 , "Could not unsubscribe")
    }

    return res.status(200).json(
        new ApiResponse( 200 , Unsubscribed , "Channel unsubscribed succesfully")
    )

    
})

export {getUserChannelSubscribers , getSubscribedChannels , toggleSubscription}