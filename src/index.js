import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path : './.env'
});

// app.listen starts the server and listens for incoming requests
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process with failure
})


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