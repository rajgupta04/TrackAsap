import mongoose from 'mongoose';
import chalk from 'chalk';
import logger from './logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green.bold(`✅ MongoDB Connected: ${chalk.cyan(conn.connection.host)}`));
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
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

    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    logger.error(`   Host: ${host}`);
    logger.error(`   Database: ${database}`);

    if (String(error.message).toLowerCase().includes('bad auth')) {
      logger.error('   Fix checklist:');
      logger.error('   1) Atlas > Database Access: verify username/password for your DB user');
      logger.error('   2) Atlas > Network Access: allow your current IP (or 0.0.0.0/0 for quick test)');
      logger.error('   3) Ensure user has readWrite role on the target database');
    }

    process.exit(1);
  }
};

export default connectDB;
