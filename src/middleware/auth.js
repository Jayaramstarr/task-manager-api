// middleware functions,it runs in the middle of the actions of the request coming in and the route handler running 

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req,res,next)=>{

    try{

        const token = req.header('Authorization').replace('Bearer ',''); //extracts the token from the header

        const decoded = jwt.verify(token,'secretValueCanBeAnything'); //verifies the token

        /*finds the user (with the help of the id which is a part of the token)
        who has the authentication token stored in the array of tokens*/
        const user = await User.findOne({ _id: decoded._id, 'tokens.token':token});

        if(!user) throw new Error();

        req.token = token;
        req.user = user;//attaches the user to request
        next();//it indicates the end of the function without which the execution never ends
    }
    catch(e){
        res.status(401).send("Please authenticate");
    }

}


module.exports = auth;