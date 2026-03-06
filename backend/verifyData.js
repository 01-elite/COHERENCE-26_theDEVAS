/**
 * Verify Database Data
 * Quick script to check if data was seeded successfully
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');
const Budget = require('./models/Budget');
const Transaction = require('./models/Transaction');
const Anomaly = require('./models/Anomaly');
const District = require('./models/District');

dotenv.config();

const verifyData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);

    const userCount = await User.countDocuments();
    const deptCount = await Department.countDocuments();
    const districtCount = await District.countDocuments();
    const budgetCount = await Budget.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const anomalyCount = await Anomaly.countDocuments();

    console.log('\n📊 Database Statistics:');
    console.log('═══════════════════════════════════════');
    console.log(`   Users: ${userCount}`);
    console.log(`   Departments: ${deptCount}`);
    console.log(`   Districts: ${districtCount}`);
    console.log(`   Budgets: ${budgetCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Anomalies: ${anomalyCount}`);
    console.log('═══════════════════════════════════════');

    // Get total budget stats
    const budgetStats = await Budget.aggregate([
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' },
          avgUtilization: { $avg: { $divide: ['$spentAmount', '$allocatedAmount'] } }
        }
      }
    ]);

    if (budgetStats.length > 0) {
      console.log('\n💰 Budget Summary:');
      console.log(`   Total Allocated: ₹${(budgetStats[0].totalAllocated / 10000000).toFixed(2)} Crores`);
      console.log(`   Total Spent: ₹${(budgetStats[0].totalSpent / 10000000).toFixed(2)} Crores`);
      console.log(`   Average Utilization: ${(budgetStats[0].avgUtilization * 100).toFixed(2)}%`);
    }

    // Get anomaly stats
    const anomalyByRisk = await Anomaly.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    if (anomalyByRisk.length > 0) {
      console.log('\n⚠️  Anomalies by Risk Level:');
      anomalyByRisk.forEach(item => {
        console.log(`   ${item._id}: ${item.count}`);
      });
    }

    console.log('\n✅ Data verification complete!\n');

    if (budgetCount < 100) {
      console.log('⚠️  Warning: Expected 100-150 budgets but found', budgetCount);
    } else {
      console.log('✅ Budget count is within expected range (100-150)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
};

verifyData();
