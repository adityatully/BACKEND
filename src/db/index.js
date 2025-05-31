import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB = async () =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}` , {family:4})
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);

    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Exit the process with failure
    }
}

export default connectDB; 