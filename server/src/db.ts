import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Category } from './models/Category.js';
import { Project } from './models/Project.js';
import { Task } from './models/Task.js';
import { User } from './models/User.js';

/** Connect to MongoDB and make sure all indexes (incl. unique ones) exist. */
export async function connectDb() {
  // Drop filter keys that are not in the schema.
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await Promise.all([User.init(), Project.init(), Category.init(), Task.init()]);
}
