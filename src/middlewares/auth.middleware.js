// we need to create this for lgout because we dint have userid with us 

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async(req , res , next) =>{
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token) {
            throw new ApiError("Unauthorised ", 401);
        }

        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password -RefreshToken");

        if(!user){
            throw new ApiError("Unauthorised  , Invalid access token ", 404);
        }

        // nowe wek know we have the user , so we add another thing in the req body 
        req.user = user;

        next()
    }
    catch(err){
        throw new ApiError(err.message || "Unauthorised", err.status || 401);
    }


})





// const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
// cokkies mei hoga ya to user ne req header mei bheja 