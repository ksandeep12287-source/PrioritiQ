const Task = require("../models/Task");

// Helper: Normalize payload - sab jagah same use hoga
const normalizeTaskData = (data) => ({
  title: data.title?.trim() || 'Untitled Task',
  description: data.description || '',
  deadline: data.deadline || null,
  priority: ['low', 'medium', 'high'].includes(data.priority) ? data.priority : 'medium', // <-- KEY FIX
  status: ['pending', 'in-progress', 'completed'].includes(data.status) ? data.status : 'pending',
  category: data.category || 'general'
});

// CREATE TASK
exports.createTask = async (req, res) => {
  try {
    const taskData = normalizeTaskData(req.body); // <-- NORMALIZE FIRST
    const task = await Task.create(taskData);
    res.status(201).json({ success: true, data: task }); // <-- Unified response
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET ALL TASKS
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    
    // Safety: Ensure no undefined reaches frontend
    const safeTasks = tasks.map(t => ({
      ...t,
      priority: t.priority || 'medium', // <-- GET SAFETY
      status: t.status || 'pending'
    }));
    
    res.status(200).json({ success: true, data: safeTasks }); // <-- Unified response
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
  try {
    const updateData = normalizeTaskData(req.body); // <-- NORMALIZE HERE ALSO
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE TASK - ye theek hai
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};