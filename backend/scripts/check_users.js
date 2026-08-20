import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
    console.log('Total users:', users.length);
    console.log(users);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Check error:', err);
  }
}

check();
