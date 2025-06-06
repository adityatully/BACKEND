import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // Step 1: Extract query parameters from request URL
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // Step 2: Parse page and limit as numbers, and calculate how many results to skip
    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 10
    const skip = (pageNum - 1) * limitNum

    // Step 3: Build filter object to search in DB
    const filter = {}

    // If user wants to search by keyword, search in title OR description, case insensitive
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }

    // If userId is specified, filter videos owned by that user
    if (userId) {
        filter.owner = userId
    }

    // Step 4: Build sort options
    const sortOptions = {}
    if (sortBy) {
        // sortType comes as string "1" or "-1", convert to number, default descending (-1)
        const order = parseInt(sortType) === 1 ? 1 : -1
        sortOptions[sortBy] = order
    } else {
        // default sorting by createdAt descending (newest first)
        sortOptions.createdAt = -1
    }

    // Step 5: Fetch videos from DB matching filter, sort, skip, limit
    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)

    // Step 6: Get total count of videos for pagination info
    const totalVideos = await Video.countDocuments(filter)
    const totalPages = Math.ceil(totalVideos / limitNum)

    // Step 7: Return results and pagination info as JSON response
    return res.status(200).json({
        success: true,
        data: videos,
        pagination: {
            totalVideos,
            totalPages,
            currentPage: pageNum,
            limit: limitNum
        }
    })
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description){
        throw new ApiError(404 , "titlle and description are required")
    }
    // we are getting video and thumbnai from req.files , using mutler middleware
    // we have req.user because we are loggen in 
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path 
    const videoLocalPath = req.files?.videoFile[0]?.path 

    if(!thumbnailLocalPath){
        throw new ApiError(404 , "Thumbnail is required")
    }

    if(!videoLocalPath){
        throw new ApiError(404 , "Video is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    const video = await uploadOnCloudinary(videoLocalPath)

    if(!thumbnail){
        throw new ApiError(404 , "Couldnt upload thumbnail")
    }

    if(!video){
        throw new ApiError(404 , "Couldnt upload video")
    }

    const publishingvideo = await Video.create({
        videoFile : video.url ,
        thumbnail : thumbnail.url , 
        title , 
        description , 
        duration : video.duration , 
        isPublished : true , 
        owner : req.user._id
    })

    const PublishedVideo = await Video.findById({
       _id : publishingvideo._id 
    })

    if(!PublishedVideo){
        throw new ApiError(404 , "Couldnt publish the video")
    }
    return res.status(200).json(
        new ApiResponse(200 , PublishedVideo , "Video published succesfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(404 , "Not a valid video URL")
    }

    const video = await Video.findById({_id : new mongoose.Types.ObjectId(`${videoId}`)})
    if(!video){
        throw new ApiError(404 , "this video dosent exist")
    }

    return res.status(200).json(
        new ApiResponse(200 , video , "Video fetched succesfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    let thumbnailUrl = null;

    // Handle thumbnail update (optional)
    if (
        req.files &&
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length > 0
    ) {
        const thumbnailLocalPath = req.files.thumbnail[0].path;
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(500, "Thumbnail upload failed");
        }

        thumbnailUrl = thumbnail.url;
    }

    // Build update object dynamically
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (thumbnailUrl) updateData.thumbnail = thumbnailUrl;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
        new: true,
    });

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found or couldn't be updated");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(404 , "Not a valid video Id")
    }

    const deletedVideo = await Video.findByIdAndDelete(
          videoId
          // or {_id : videoId}
    )

    if(!deletedVideo){
        throw new ApiError(404 , "Couldnt delete video")
    }

    return res.status(201).json(
        new ApiResponse(201 , deleteVideo , "Video deleted succesfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Not a valid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "No video exists");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Published status changed successfully")
    );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}



//videoId: The _id of the document to update.
//updateData: Your own custom object with only the fields you want to update.
//{ new: true }: Ensures the updated document is returned, not the original one.



//the client sends ?query=music, you want to get videos where:
////
////title contains "music" OR
////description contains "music"
////Explanation:
////$or: At least one condition must be true.
////$regex: Allows partial matching, like SQL LIKE '%music%'
//$options: 'i': Makes it case-insensitive (so "Music", "MUSIC", or "music" all match)
