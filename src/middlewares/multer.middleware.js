import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  

const upload = multer({ storage })

export {upload}


//✅ 1. It parses multipart/form-data (which Express can't do by itself)
//It reads the form body.
//Extracts the files for the field names you specified.
//Saves them to disk (you used multer.diskStorage()).
//Adds file metadata into req.files.
