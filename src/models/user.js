const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require('./task');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true,
  },
  email: {
    type: String,
    require: true,
    trim: true,
    lowercase: true,
    unique: true, //all emails are unique
    validate(value) {
      if (!validator.isEmail(value)) throw new Error("Email is not valid");
    },
  },
  password: {
    type: String,
    require: true,
    trim: true,
    validate(value) {
      if (!validator.isLength(value, { min: 7, max: undefined }))
        throw new Error("Password size should be greater than 6");
      if (value.toLowerCase().includes("password"))
        throw new Error("Password cannot be the word 'password'");
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) throw new Error("Age should be a positive number");
    },
  },

  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar:{
    type:Buffer
  }
},
  {
    timestamps: true //creates the feilds the feild "created at" and "updated at"
});


/* this feild is not stored in the database 
but is present virtually for mongoose to identifiy ehich user owns which task*/

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

//use standard function as it requires this binding which is not given by arrow functions
//methods functions accesible only on instance of the model
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign( { _id: user._id.toString() },process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;//deletes the pic cause there's no need to send the pic as it slows down the operation 

  return userObject;
};

// function checks if an account with the email and password exits
// if it does it sends an instance of the user or throws an error
// statics function accessible on the models directly
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Unable to login");

  // checks if plain text password is same as hashed password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Unable to login");

  return user;
};

//function is executed pre save occurs
//so we can hash the password before it is saved
userSchema.pre("save", async function (next) {
  const user = this;

  // password is hashed here
  if (user.isModified("password"))
    user.password = await bcrypt.hash(user.password, 8);

  console.log("just before saving");
  //the function keeps on executing forever unless next is callled
  next();
});


// delete all the user's tasks when the user is deleted
userSchema.pre('remove', async function(next){
  
  const user = this;
  await Task.deleteMany({owner:user._id});
  next();
});



const User = mongoose.model("User", userSchema);

module.exports = User;
