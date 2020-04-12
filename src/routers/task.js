const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();



// GET /tasks?completed=true
// GET /tasks?limit=10skip=0
// GET /tasks?sortBy=createdAt_desc
router.get("/tasks",auth, async (req, res) => {

  const match = {};
  const sort = {};

  if(req.query.completed)
    match.completed = req.query.completed === 'true';
    //we do this because we cannot diretly assingn a boolean to match.completed as it will be stored as a string


  if(req.query.sortBy)
  {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc'? -1 : 1;
  }
    

  try {
    
    //const tasks = await Task.find({owner:req.user._id}); 
    //or you could use
    await req.user.populate({
      path:'tasks',
      
      // customizes the search
      match,
      options:{
        limit:+req.query.limit,//limits the searches(+parses string to int)
        skip:+req.query.skip,
        sort
      }
    }).execPopulate();//populates the virtual tasks feild of user model with all the associated tasks
    

    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    
    //finds a task such that it has both the user id and task id matching
    const task = await Task.findOne({_id, owner: req.user._id});

    if (!task) return res.status(404).send();
    res.send(task);
  } catch (e) {
    res.send(500).send(e);
  }
});

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body, //the first two feilds(description,completed) are added using the spread operator
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.patch("/tasks/:id", auth,async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["completed", "description"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation)
    return res.status(404).send({ error: "Invalid updates" });

  try {
    //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });

    const task = await Task.findOne({_id:req.params.id, owner:req.user._id});

    if (!task) return res.status(404).send();

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send();
  }
});

router.delete("/tasks/:id",auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id});

    if (!task) return res.status(404).send();

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
