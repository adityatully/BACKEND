// file from userto local server , from there to cloudnary 
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';  // file system 

cloudinary.config({ 
    cloud_name: 'drwyymrla', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async(localfilepath) => {
    try {
        if(!localfilepath) return null 
        const response = await cloudinary.uploader.upload(localfilepath , {
            resource_type : "auto"
        })
        console.log("file uploaded succesfully" , response.url)
        return response 
    }
    catch(error){
        fs.unlinkSync(localfilepath) // remove the uplaoded file from ocal disk 
        return null 
    }
}

export {uploadOnCloudinary}