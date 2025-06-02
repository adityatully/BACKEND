import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
app.use(cors( 
    {
        origin : process.env.CORS_ORIGIN ,
        credentials : true
    }
))
app.use(express.json(  // form se data ko json mein convert karne ke liye
    {
        limit: "16kb" 
    }
))
// confg -> app.use()
app.use(express.urlencoded({extended:true}))  // url se data ko json mein convert karne ke liye 
app.use(cookieParser()) // cred op on cookies 
app.use(express.static("public")) // static files ko serve karne ke liye assets 

 
import userRouter from "./routes/user.routes.js"
// routes declaration  
app.use("/api/v1/users" , userRouter)
// yaha pe https://localhost:8000/api/v1/users

export {app} 


// not app.gt or smth app.use bcs router bahr se laarhe 