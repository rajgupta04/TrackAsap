import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const adminEmails = [
  'rajguptaaesthetic@gmail.com',
  'rajguptaaeshthetic@gmail.com',
  'admin@trackasap.in',
  'admin@trackasap.com',
  'test@trackasap.com',
  'works.ashwanikumar@gmail.com'
];

async function updateRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await mongoose.connection.db.collection('users').updateMany(
      { email: { $in: adminEmails } },
      { $set: { role: 'admin' } }
    );
    console.log('Updated users to admin role:', result.modifiedCount);
    const updated = await mongoose.connection.db.collection('users').find({ role: 'admin' }).toArray();
    console.log('Current Admins in DB:', updated.map(u => ({ email: u.email, name: u.name, role: u.role })));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Update error:', err);
  }
}

updateRoles();
