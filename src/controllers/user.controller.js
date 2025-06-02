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
            $set :{
                RefreshToken : undefined
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
        if(user.RefreshToken !== Incomingtoken){
            throw new ApiError("Invalid refresh token", 401);
        }

        const options = {
            httpOnly: true ,
            secure: true
        }
        const {newAccessToken, newRefreshToken} = await generateAccessandRefreshTokens(user._id);
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


export {registerUser , loginUser , logoutUser , refreshAccessToken} ;





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