
//require database connection
const mongoose = require('mongoose');
const validator = require('validator');


const Task = mongoose.model('Task',{
    description:{
        trim:true,
        require:true,
        type:String
    },
    completed:{
        default:false,
        type:Boolean
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    }
});


module.exports = Task;