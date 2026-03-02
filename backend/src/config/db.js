import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const mongoUri = process.env.MONGODB_URI || '';
    let host = 'unknown-host';
    let database = 'unknown-db';

    try {
      const parsed = new URL(mongoUri);
      host = parsed.host || host;
      database = parsed.pathname?.replace(/^\//, '') || database;
    } catch {
      // ignore parsing issues and show generic values
    }

    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error(`   Host: ${host}`);
    console.error(`   Database: ${database}`);

    if (String(error.message).toLowerCase().includes('bad auth')) {
      console.error('   Fix checklist:');
      console.error('   1) Atlas > Database Access: verify username/password for your DB user');
      console.error('   2) Atlas > Network Access: allow your current IP (or 0.0.0.0/0 for quick test)');
      console.error('   3) Ensure user has readWrite role on the target database');
    }

    process.exit(1);
  }
};

export default connectDB;
