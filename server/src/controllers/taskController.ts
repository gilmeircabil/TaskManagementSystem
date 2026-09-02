import { Request, Response } from "express";
import { Server } from "socket.io";
import { Task } from "../models/Task";
import { SOCKET_EVENTS, TaskStatus } from "../types";

// io is attached to the app in index.ts so controllers can broadcast
const getIO = (req: Request): Server => req.app.get("io");

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ status: 1, order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks", error: (err as Error).message });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch task", error: (err as Error).message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // place new task at the end of its column
    const count = await Task.countDocuments({ status: status || "todo" });

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      assignee,
      dueDate: dueDate || null,
      order: count,
    });

    getIO(req).emit(SOCKET_EVENTS.TASK_CREATED, task);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: "Failed to create task", error: (err as Error).message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    getIO(req).emit(SOCKET_EVENTS.TASK_UPDATED, task);
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: "Failed to update task", error: (err as Error).message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    getIO(req).emit(SOCKET_EVENTS.TASK_DELETED, { _id: req.params.id });
    res.json({ message: "Task deleted", _id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task", error: (err as Error).message });
  }
};

// Bulk reorder: used for drag-and-drop between/within columns.
// Expects: [{ _id, status, order }, ...]
export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const updates: { _id: string; status: TaskStatus; order: number }[] = req.body.updates;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "updates must be an array" });
    }

    const ops = updates.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { status: u.status, order: u.order } },
      },
    }));

    if (ops.length) await Task.bulkWrite(ops);

    const tasks = await Task.find().sort({ status: 1, order: 1 });
    getIO(req).emit(SOCKET_EVENTS.TASK_REORDERED, tasks);
    res.json(tasks);
  } catch (err) {
    res.status(400).json({ message: "Failed to reorder tasks", error: (err as Error).message });
  }
};
