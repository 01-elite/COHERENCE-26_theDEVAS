/**
 * Update District Budget Totals
 * Calculates and updates totalBudgetAllocated and totalBudgetSpent for each district
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Budget = require('./models/Budget');
const District = require('./models/District');

dotenv.config();

const updateDistrictTotals = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    console.log('🔍 Finding all districts...');
    const districts = await District.find();
    console.log(`Found ${districts.length} districts`);

    let updated = 0;
    for (const district of districts) {
      // Find all budgets for this district
      const budgets = await Budget.find({ district: district.name });
      
      const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
      const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
      
      // Update district totals
      if (budgets.length > 0) {
        district.totalBudgetAllocated = totalAllocated;
        district.totalBudgetSpent = totalSpent;
        await district.save();
        updated++;
        console.log(`✓ ${district.name}: ${budgets.length} budgets, ₹${(totalAllocated / 10000000).toFixed(2)} Cr allocated`);
      }
    }

    console.log(`\n✨ Updated ${updated} districts with budget totals`);
    console.log('Districts now have proper budget allocations for map visualization!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateDistrictTotals();
