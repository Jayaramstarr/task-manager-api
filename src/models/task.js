
//require database connection
const mongoose = require('mongoose');
const validator = require('validator');

const taskSchema = new mongoose.Schema({

    description:{
        trim:true,
        require:true,
        type:String
    },
    completed:{
        default:false,
        type:Boolean
    },

    // creates a owner feild which stores the id of the user object which created the task 
    // it is tored in database as opposed to virtual reference of tasks in users model
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        /* the ref contains a reference of the user object that created the task,
        populate function converts the user id to the entire user profile*/
        ref:'User'
    }
},    
{
    timestamps:true
});
const Task = mongoose.model('Task',taskSchema);


module.exports = Task;