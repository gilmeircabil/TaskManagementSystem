import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './db.js';

async function main() {
  try {
    await connectDb();
  } catch (err) {
    console.error('Failed to connect to MongoDB. Check MONGODB_URI and your Atlas network access settings.');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
  console.log('Connected to MongoDB');

  createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

void main();
