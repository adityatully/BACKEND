class ApiError extends Error {
    constructor(message = "Something went wrong", statusCode , errors = [] , stack="") {
        super(message); // Call parent Error class constructor
        this.statusCode = statusCode;
        this.data = null ;
        this.message = message ;
        this.success = false;
        this.errors = errors;
    }
}


// super(message); means message ko to override karna hai 

//You directly assign values using this.propertyName = value, and JavaScript automatically creates that 
//property on the object. There is no need to declare the properties before using them.

//✳️ Important: super(message)
//super() is used to call the constructor of the parent class.
//In our case, the parent is Error, which only takes one argument — message.
//So we call super(message) to let Error handle the message and create a proper error object.
//


export {ApiError}