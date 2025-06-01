import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({

    username : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index : true
    } , 
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    } ,
    fullname : {
        type: String,
        required: true,
        trim: true,
        index : true 
    } , 
    avatar : {
        type: String, // cloudinary url
        required : true  
    },
    coverImage : {
        type: String, // cloudinary url
        
    },
    watchHistory : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ] , 
    password : {
        type: String,
        required: [true, "Password is required"],
        minlength: 6
    } , 
    RefreshToken : {
        type: String
    }

} ,{timestamps: true});

userSchema.pre("save" , async function(next){
    if(!this.isModified("password")) next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAcessToken = function(){
    return jwt.sign({
        _id : this._id , 
        email : this.email,
        username : this.username ,
        fullname : this.fullname
    } , 
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY || "1h"
    })
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id 
    } , 
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY || "7d"
    })
}

export const User = mongoose.model("User", userSchema);



// payload , kya data rahna in jwt token 



// index true when zyada search krna usse

// arrow function dosent know context so cant use this.with it