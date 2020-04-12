const express = require("express");
const sharp = require('sharp');
const multer = require("multer");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail,sendCancellationEmail } = require('../emails/account');

const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email,user.name);
    const token = await user.generateAuthToken(); //sends back the web authentication token
    res.status(201).send({ user, token }); // is executed if above statement is successful
  } catch (e) {
    res.status(400).send(e); // is executed if await user.save() statement is unsuccessful
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken(); //sends back the web authentication token
    res.send({ user, token }); // executed only if account exists else catch is executed
  } catch (e) {
    res.status(400).send();
  }
});

// router to logout
router.post("/users/logout", auth, async (req, res) => {
  try {
    // removes the current token from the tokens array and hence logs out the user
    // filter removes the element from the array when return value is false
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );

    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// router to logout of all the sessions
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = []; //logs out all sessions
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// when the request below is made firt the middleware function runs after which the route handler function runs
// the route handler function runs only is auth runs the next() function
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid updates" });

  try {
    // this line bypasses mongoose that is middleware is not run

    /*const user = await User.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });*/

    // this is a problem as when password is updated it does not pass through the hashing function
    // to overcome this we use this line instead

    updates.forEach((update) => (req.user[update] = req.body[update]));
    // middleware runs here
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    
    
    sendCancellationEmail(user.email,user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});


const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){

        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(new Error('Please upload an image'))

        cb(undefined,true);
    }
  });
  
// saves the binary data of the image to the user instance
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req,res)=>{
    
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer; //buffer contains binary data of the image
    await req.user.save();
    res.send();
},(error,req,res,next)=>{
    res.status(400).send({ error:error.message });
});

router.delete('/users/me/avatar', auth, async(req,res)=>{
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

// get the image from binary data
router.get('/users/:id/avatar',  async(req,res)=>{
    try{

        const user =  await User.findById(req.params.id);
        if(!user || !user.avatar) throw new Error();

        res.set('Content-Type','image/jpg');
        res.send(user.avatar);
    }
    catch(e){
        res.status(404).send();
    }
}); 
  

module.exports = router;
