/**
 * Create Sample Anomalies for Testing
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Budget = require('./models/Budget');
const Anomaly = require('./models/Anomaly');
const Transaction = require('./models/Transaction');

dotenv.config();

const createAnomalies = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🗑️  Clearing existing anomalies...');
    await Anomaly.deleteMany({});
    
    console.log('🔍 Finding current year budgets...');
    const currentYear = new Date().getFullYear();
    const currentFY = `${currentYear}-${currentYear + 1}`;
    
    const budgets = await Budget.find({ financialYear: currentFY }).limit(20);
    console.log(`Found ${budgets.length} budgets for ${currentFY}`);
    
    const transactions = await Transaction.find({ 
      budget: { $in: budgets.map(b => b._id) } 
    });
    console.log(`Found ${transactions.length} transactions`);
    
    const anomalies = [];
    
    // Create budget-level anomalies
    for (let i = 0; i < Math.min(15, budgets.length); i++) {
      const budget = budgets[i];
      const types = [
        {
          type: 'unusual_spending_pattern',
          riskLevel: 'high',
          title: 'Unusual Budget Growth Detected',
          description: `Budget allocation increased significantly compared to previous year`
        },
        {
          type: 'threshold_breach',
          riskLevel: 'medium',
          title: 'Low Budget Utilization',
          description: `Only ${parseFloat(budget.utilizationPercentage || 0).toFixed(2)}% of budget utilized`
        },
        {
          type: 'unusual_spending_pattern',
          riskLevel: 'medium',
          title: 'Historical Pattern Deviation',
          description: `Budget deviates significantly from historical average`
        }
      ];
      
      const anomalyType = types[Math.floor(Math.random() * types.length)];
      
      const anomaly = await Anomaly.create({
        budget: budget._id,
        type: anomalyType.type,
        riskLevel: anomalyType.riskLevel,
        title: anomalyType.title,
        description: anomalyType.description,
        detectedDate: new Date(),
        amount: budget.allocatedAmount,
        confidence: 70 + Math.floor(Math.random() * 25),
        status: 'pending',
        verificationStatus: 'needs_review',
        aiRiskScore: 60 + Math.floor(Math.random() * 30)
      });
      
      anomalies.push(anomaly);
    }
    
    // Create transaction-level anomalies
    for (let i = 0; i < Math.min(10, transactions.length); i++) {
      const transaction = transactions[Math.floor(Math.random() * transactions.length)];
      
      const types = [
        {
          type: 'high_value_transaction',
          riskLevel: 'high',
          title: 'High Value Transaction Detected'
        },
        {
          type: 'round_figure_transaction',
          riskLevel: 'medium',
          title: 'Suspicious Round Figure Payment'
        },
        {
          type: 'duplicate_transaction',
          riskLevel: 'high',
          title: 'Potential Duplicate Transaction'
        }
      ];
      
      const anomalyType = types[Math.floor(Math.random() * types.length)];
      
      const anomaly = await Anomaly.create({
        transaction: transaction._id,
        budget: transaction.budget,
        type: anomalyType.type,
        riskLevel: anomalyType.riskLevel,
        title: anomalyType.title,
        description: `Transaction of ₹${transaction.amount.toLocaleString('en-IN')} requires verification`,
        detectedDate: new Date(),
        amount: transaction.amount,
        confidence: 65 + Math.floor(Math.random() * 25),
        status: 'pending',
        verificationStatus: 'needs_review',
        aiRiskScore: 55 + Math.floor(Math.random() * 35)
      });
      
      anomalies.push(anomaly);
    }
    
    console.log(`\n✅ Created ${anomalies.length} anomalies`);
    console.log(`   - High Risk: ${anomalies.filter(a => a.riskLevel === 'high').length}`);
    console.log(`   - Medium Risk: ${anomalies.filter(a => a.riskLevel === 'medium').length}`);
    console.log(`   - Low Risk: ${anomalies.filter(a => a.riskLevel === 'low').length}`);
    
    console.log('\n✨ Anomalies created successfully!');
    console.log('You can now view them in the Budget Verification page.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAnomalies();
