const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true 
    },
    description: { 
      type: String,
      default: '' 
    },
    deadline: { 
      type: Date,
      default: null 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: "medium",
      required: true
    },
    status: { 
      type: String, 
      enum: ['pending', 'in-progress', 'completed', 'overdue'], // <-- 'overdue' add kiya Phase 6 ke liye
      default: "pending" 
    },
    category: {
      type: String,
      default: 'general'
    }
  },
  { timestamps: true }
);

// Pre-save hook - Extra safety layer
taskSchema.pre('save', function(next) {
  if (!this.priority || !['low', 'medium', 'high'].includes(this.priority)) {
    this.priority = 'medium';
  }
  if (!this.status) this.status = 'pending';
  next();
});

module.exports = mongoose.model("Task", taskSchema);