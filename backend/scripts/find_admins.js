import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admins = await mongoose.connection.db.collection('users').find({ role: 'admin' }).toArray();
    console.log('Admins found:', admins.length);
    console.log(admins.map(a => ({ name: a.name, email: a.email, role: a.role, _id: a._id })));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Check error:', err);
  }
}

check();
