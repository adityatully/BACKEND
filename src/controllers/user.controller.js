import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
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
        [username , email , password  ,fullname].some((field)=> field.trim()==="")
    ){
        throw new ApiError("All fields are required", 400);
    }

    const existingUser =User.findOne({
        $or: [{username} , {email}]
    })

    if(existingUser){
        throw new ApiError("Username or Email already exists", 409);
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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

export {registerUser} ;



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
  