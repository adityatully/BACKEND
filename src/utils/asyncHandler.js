const asyncHandler = (reqHandler) => {
    return (req , res , next) => {
        Promise.resolve(
            reqHandler(req , res , next)
        ).catch((err)=>next(err))
        
    }
}

// acts as a wrapper for a function that executes it asynchronously
export {asyncHandler} ;



//const asyncHandler = (fn) => async (req , res , next) => {
//    try{
//        await fn(req , res , next)
//    }
//    catch(error) {
//       res.status(err.code || 500).json({
//            success: false,
//            message: error.message || 'Internal Server Error',
//       })
//    }
//}