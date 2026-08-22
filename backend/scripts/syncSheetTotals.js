import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Sheet = mongoose.model('Sheet', new mongoose.Schema({}, { strict: false }));
    const SheetProblem = mongoose.model('SheetProblem', new mongoose.Schema({}, { strict: false }));

    const sheets = await Sheet.find({});
    console.log(`Found ${sheets.length} sheets`);

    for (const s of sheets) {
      const total = await SheetProblem.countDocuments({ sheet: s._id });
      const solved = await SheetProblem.countDocuments({ sheet: s._id, status: 'solved' });
      const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
      console.log(`Sheet "${s.name}": ${solved}/${total} (${percent}%)`);

      await Sheet.updateOne(
        { _id: s._id },
        { $set: { totalProblems: total, solvedProblems: solved } }
      );
    }

    console.log('All sheets updated successfully in database!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error syncing sheet totals:', err);
  }
}

run();
