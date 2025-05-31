import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path : './.env'
});



connectDB()


// ()() iffyfuncton automatcially gets executed
/*;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)


    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
        throw err;
    }
})()*/