import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const registerUser = asyncHandler(async (req , res)=>{
    // get user detals from front end 
    // validation of the data we got 
    // alreDY EXISTS  , USERNAME , EMAIL 
    // CHECK FOR Images , avatar
    // upload to cloudinary 
    // save the user to databse 
    // remove password and refresh token from field 
    //  chck is response ayaor not 
    // return response 
    const {username , email , password  ,fullname} = req.body ;
    if(
        [username , email , password  ,fullname].some((field)=> field.trim()=== " ")
    ){
        throw new ApiError("All fields are required", 400);
    }

    const existingUser = await  User.findOne({
        $or: [{username} , {email}]
    })
    // $or is used to check if either username or email exists

    if(existingUser){
        throw new ApiError("Username or Email already exists", 409);
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError("Avatar image is required", 400);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError("Failed to upload avatar image", 500);
    }

    const user =  await User.create({
        fullname , 
        avatar : avatar.url,
        coverImage : coverImage?.url, 
        email ,
        password ,
        username : username.toLowerCase() 
    })

    const CreatedUser = await User.findById(user._id).select("-password -RefreshToken");

    if(!CreatedUser){
        throw new ApiError("Failed to create user", 500);
    }

    return res.status(201).json(
        new ApiResponse(201, CreatedUser, "User registered successfully")
    )
})

const generateAccessandRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()
        user.RefreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        return {refreshToken , accessToken};
    }catch(error){
        console.error("Error generating tokens:", error);
        throw new ApiError("Failed to generate tokens", 500);
    }
}

const loginUser = asyncHandler(async (req, res) => {
    // get uer details from frontend 
    // username email and password , check validity 
    // check if user exists 
    // if user exists then decrtypt the stored password and compare the etered password 
    // if password matches , gen acces and refresh toen 
    // save the refresh token to the db 
    // send cookie 
    // send response 

    const { username, email, password } = req.body;

    if(!username && !email) {
        throw new ApiError("Username or Email is required", 400);
    }

    const user = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }]
    });

    if(!user){
        throw new ApiError("Invalid username or email", 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid){
        throw new ApiError("Invalid password", 401);
    }

    const {refreshToken , accessToken} =await  generateAccessandRefreshTokens(user._id)

    const loggedInuser = await User.findById(user._id).select("-password -RefreshToken") 

    // we define options to send cookies 
    const options = {
        httpOnly : true, // only server can access this cookie and modify it 
        secure : true 
    }

    return res.
    status(200).
    cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options).
    json(
        new ApiResponse(200, {
            user : loggedInuser , accessToken , refreshToken
        } , 
        "User logged in successfully")
    )


})

const logoutUser = asyncHandler(async (req, res) => {
    // clear refresh token 
    // cear both from cookies 
    // req.user was added to the request using a middleware 
    await User.findOneAndUpdate(
        req.user._id,
        {
            $unset :{
                RefreshToken: 1 // this will remove the RefreshToken field from the user document
            }
        },{
            new : true 
        }
    )

    const options = {
        httpOnly : true, // only server can access this cookie and modify it 
        secure : true 
    }

    return res.status(200).
    clearCookie("accessToken", options).
    clearCookie("refreshToken", options).
    json(
        new ApiResponse(200, null, "User logged out successfully")
    )

}) 

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the refresh token fro cookies 
    // match that tken with the refresh token in the database 
    // if matchd generate new access token and send it to through cookies 
    const Incomingtoken = req.cookies?.refreshToken || req.body?.refreshToken;
    if(!Incomingtoken){
        throw new ApiError("Refresh token is required", 400);
    }
    try{
        const decoded =  jwt.verify(Incomingtoken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select("-password -RefreshToken");
        if(!user){
            throw new ApiError("Invalid refresh token", 401);
        }
        if(user?.RefreshToken !== Incomingtoken){
            throw new ApiError("Invalid refresh token", 401);
        }
        
        const options = {
            httpOnly: true ,
            secure: true
        }
        const {newAccessToken, newRefreshToken} = await generateAccessandRefreshTokens(user._id);
        user.RefreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });
        return res.status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {accessToken: newAccessToken, refreshToken: newRefreshToken}, "Access token refreshed successfully")
        )
    }
    catch(error){
        console.error("Error refreshing access token:", error);
        throw new ApiError("Failed to refresh access token", 500);
    }

})

const changeCurrentPassword = asyncHandler(async(req , res)=>{
    // he can cnage pass mtlb logged in hai , agr logged in hai to middleware se crooss hua 
    // agar middle ware cross hua hai to req mei req.user hoga always 
    const{oldPassword , newPassword} = req.body;  
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.comparePassword(oldPassword); 

    if(!isPasswordValid){
        throw new ApiError("Invalid old password", 401);
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully")
    )

})

const getCurrentUser = asyncHandler(async (req , res)=>{
    // req.user is added by the verifyJWT middleware agar logged in hai to req.user obj hoga 
    return res.status(200).json(200 , req.user , "Current user fetched successfully")
})

const UpdateUser = asyncHandler(async(req , res)=>{ 

    // logged in hai to user.req hoga 
    const{fullname , username , email} = req.body; 

    if(!fullname || !username || !email){
        throw new ApiError("All fields are required", 400);
    }   

    const user = User.findByIdAndUpdate(req.user._id , {
        $set :{
            fullname , 
            username : username.toLowerCase() , 
            email
        }
    } , {new : true}).select("-password ");

    return res.status(201).json(
        new ApiResponse(201, user, "User updated successfully")
    )


})

const UpdateUserAvatar = asyncHandler(async(req , res)=>{
    // mutler se file upload hogi , into req.files
    // then cloudinary m store hoi and we will get the response url
    // user logged in hai to req.user obect zarur hoga
    const avatarLocalPath = req.file?.path  // injected by th multer middleware
    if(!avatarLocalPath){
        throw new ApiError("Avatar image is required", 400);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError("Failed to upload cover image", 500);
    }

    const user = await User.findByIdAndUpdate(req.user_id , {
        $set :{
            avatar : avatar.url
        }
    } ,{new : true}).select("-password");

    return res.status(201).json(
        new ApiResponse(201, user, "User avatar updated successfully")
    )

})


const UpdateUserCoverImage = asyncHandler(async(req , res)=>{
    // mutler se file upload hogi , into req.files
    // then cloudinary m store hoi and we will get the response url
    // user logged in hai to req.user obect zarur hoga
    const coverImageLocalPath = req.file?.path  // injected by th multer middleware
    if(!coverImageLocalPath){
        throw new ApiError("Avatar image is required", 400);
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError("Failed to upload cover image", 500);
    }

    const user = await User.findByIdAndUpdate(req.user_id , {
        $set :{
            coverImage : coverImage.url
        }
    } ,{new : true}).select("-password");

    return res.status(201).json(
        new ApiResponse(201, user, "User cover image updated successfully")
    )

})

const getUserChannelProfile = asyncHandler(async(req , res)=>{
    const {username} = req.params;
 
    if(!username?.trim()){
        throw new ApiError("Username is required", 400);
    }
    const channel = await User.aggregate([
        {
        $match : {
            username : username.toLowerCase()
        }}   ,

        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",   // this gets the nuber of subscribers 
                as : "subscribers"
            }
        } , 
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",   // this gets the nuber of subscribers 
                as : "subscribed_to"
            }
        } , 
        {
            $addFields :{
                subscribersCount : { $size: "$subscribers" },
                subscribedToCount : { $size: "$subscribed_to" } , 
                isSubscribed : {
                    $cond : {
                        if : {$in:[req.user?._id , "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            } 
        }
        , 
        {
            $project : {
                fullname : 1,
                username : 1,
                avatar : 1,
                coverImage : 1,
                subscribersCount : 1,
                subscribedToCount : 1,
                isSubscribed : 1 ,
                email : 1,
            }
        }
    
    ])

    if(!channel?.length){
        throw new ApiError("Channel not found", 404);
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "User channel profile fetched successfully")
    )

})


const getWatchHistory = asyncHandler(async(req , res)=>{
    const {username} = req.params ; 
    if(!username?.trim()){
        throw new ApiError("Username is required", 400);
    }

    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id),

            }  
            // we have the watch istory array nhow 
        } , 

        {
            $lookup : {
                from : "videos", // kis table ko oin 
                localField : "watchHistory", // field in the user collection which contains the video ids
                foreignField : "_id",
                as : "watchHistoryVideos" ,
                pipeline : [

                    {
                        $lookup :{
                            from : "users" ,
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner" , 
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    }
                    , 

                    {
                        $addFields : {
                            owner : {   // owner was an array of object , this makes it only one object 
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistoryVideos, "User watch history fetched successfully")
    )

    
})



export {registerUser , loginUser , logoutUser , refreshAccessToken ,  
     changeCurrentPassword , getCurrentUser ,UpdateUser , UpdateUserAvatar , UpdateUserCoverImage ,
     getUserChannelProfile , getWatchHistory} ;





//req.files = {
//    avatar: [
//      {
//        fieldname: 'avatar',
//        originalname: 'profile.png',
//        encoding: '7bit',
//        mimetype: 'image/png',
//        destination: 'uploads/',
//        filename: 'abc123-profile.png',
//        path: 'uploads/abc123-profile.png',
//        size: 12345
//      }
//    ],
//    coverImage: [
//      {
//        fieldname: 'coverImage',
//        originalname: 'cover.jpg',
//        encoding: '7bit',
//        mimetype: 'image/jpeg',
//        destination: 'uploads/',
//        filename: 'def456-cover.jpg',
//        path: 'uploads/def456-cover.jpg',
//        size: 54321
//      }
//    ]
//  };
  


// user.save({ validateBeforeSave: false}); agr koi required fild nahi h abhi bhi so it dosent mattter

// refresh tokens are sent in body or are cookies
// access token sent in cokies or api req headers 


// agregate function returns an array of objects but we have atched with username so ek hi object milega
// we can access channel[0].anything



//{
//    _id: ObjectId("user123"),
//    username: "john_doe",
//    fullname: "John Doe",
//    avatar: "https://cdn.com/avatar/john.jpg",
//    watchHistory: [ObjectId("video111"), ObjectId("video222")],
//    watchHistoryVideos: [
//      {
//        _id: ObjectId("video111"),
//        title: "MongoDB Tutorial",
//        owner: {
//          _id: ObjectId("user999"),
//          username: "creator_mongo",
//          fullname: "Mongo Man",
//          avatar: "https://cdn.com/avatar/mongo.jpg"
//        },
//        ...
//      },
//      {
//        _id: ObjectId("video222"),
//        title: "React Basics",
//        owner: {
//          _id: ObjectId("user888"),
//          username: "react_guru",
//          fullname: "React Queen",
//          avatar: "https://cdn.com/avatar/react.jpg"
//        },
//        ...
//      }
//    ]
//  }
  