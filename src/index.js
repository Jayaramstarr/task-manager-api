const express = require('express');

//require database connection
require('./db/mongoose');

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT || 3000;

// middleware function,it runs in the middle of the actions of the request coming in and the route handler running  


// app.use((req,res,next)=>{

//     if(req.method === 'GET'){
//         res.send("GET requests are disabled");
//     }
//     else{
//         next();
//     }

//     //next();
// });


// app.use((req,res,next)=>{

//     res.status(503).send('Servers are down');

// });


app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port,()=>{
    console.log(`Server is up on port ${port}`);
});

const Task = require('./models/task');
const User = require('./models/user');

const main = async () =>{

    const user = await User.findById();
    await user.populate('tasks').execPopulate();
    console.log(user.tasks);
}

main();