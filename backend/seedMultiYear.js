/**
 * Multi-Year Data Generator with AI Fault Detection
 * Creates realistic budget data for current year and past 2 years
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const User = require('./models/User');
const Department = require('./models/Department');
const Budget = require('./models/Budget');
const Transaction = require('./models/Transaction');
const Anomaly = require('./models/Anomaly');
const District = require('./models/District');
const { DEPARTMENTS, TRANSACTION_TYPES, ANOMALY_TYPES, RISK_LEVELS } = require('./utils/constants');

dotenv.config();

// Sample data
const sampleDistricts = [
  { name: 'Mumbai', state: 'Maharashtra', code: 'MH-MUM', latitude: 19.0760, longitude: 72.8777, population: 12442373 },
  { name: 'Delhi Central', state: 'Delhi', code: 'DL-CEN', latitude: 28.6139, longitude: 77.2090, population: 11009300 },
  { name: 'Bangalore Urban', state: 'Karnataka', code: 'KA-BLR', latitude: 12.9716, longitude: 77.5946, population: 8443675 },
  { name: 'Hyderabad', state: 'Telangana', code: 'TG-HYD', latitude: 17.3850, longitude: 78.4867, population: 7749334 },
  { name: 'Chennai', state: 'Tamil Nadu', code: 'TN-CHE', latitude: 13.0827, longitude: 80.2707, population: 7088000 },
  { name: 'Kolkata', state: 'West Bengal', code: 'WB-KOL', latitude: 22.5726, longitude: 88.3639, population: 4496694 },
  { name: 'Pune', state: 'Maharashtra', code: 'MH-PUN', latitude: 18.5204, longitude: 73.8567, population: 3124458 },
  { name: 'Ahmedabad', state: 'Gujarat', code: 'GJ-AMD', latitude: 23.0225, longitude: 72.5714, population: 5577940 },
  { name: 'Jaipur', state: 'Rajasthan', code: 'RJ-JAI', latitude: 26.9124, longitude: 75.7873, population: 3046163 },
  { name: 'Lucknow', state: 'Uttar Pradesh', code: 'UP-LKO', latitude: 26.8467, longitude: 80.9462, population: 2817105 }
];

const schemes = [
  'Pradhan Mantri Awas Yojana',
  'Swachh Bharat Mission',
  'Ayushman Bharat',
  'PM-KISAN',
  'National Rural Employment Guarantee',
  'Mid-Day Meal Scheme',
  'Sarva Shiksha Abhiyan',
  'National Health Mission',
  'Smart Cities Mission',
  'Digital India Programme'
];

const categories = ['infrastructure', 'healthcare', 'education', 'welfare', 'agriculture', 'transport', 'others'];

// Helper to detect potential faults in budget patterns
const detectBudgetFaults = (currentBudget, historicalBudgets) => {
  const faults = [];
  
  if (historicalBudgets.length > 0) {
    const lastYearBudget = historicalBudgets[0];
    const avgHistoricalAllocation = historicalBudgets.reduce((sum, b) => sum + b.allocatedAmount, 0) / historicalBudgets.length;
    
    // Fault 1: Unusual growth (>100% increase)
    const growth = ((currentBudget.allocatedAmount - lastYearBudget.allocatedAmount) / lastYearBudget.allocatedAmount) * 100;
    if (growth > 100) {
      faults.push({
        type: 'unusual_budget_growth',
        severity: 'high',
        description: `Budget increased by ${growth.toFixed(2)}% compared to last year`,
        needsVerification: true
      });
    }
    
    // Fault 2: Unusual decrease (>50% decrease)
    if (growth < -50) {
      faults.push({
        type: 'unusual_budget_decrease',
        severity: 'medium',
        description: `Budget decreased by ${Math.abs(growth).toFixed(2)}% compared to last year`,
        needsVerification: true
      });
    }
    
    // Fault 3: Significant deviation from historical average (>75%)
    const deviation = Math.abs((currentBudget.allocatedAmount - avgHistoricalAllocation) / avgHistoricalAllocation) * 100;
    if (deviation > 75) {
      faults.push({
        type: 'historical_deviation',
        severity: 'medium',
        description: `Budget deviates ${deviation.toFixed(2)}% from historical average`,
        needsVerification: true
      });
    }
    
    // Fault 4: Utilization pattern change
    const lastYearUtil = parseFloat(lastYearBudget.utilizationPercentage || 0);
    const currentUtil = parseFloat(currentBudget.utilizationPercentage || 0);
    const utilizationChange = Math.abs(currentUtil - lastYearUtil);
    if (utilizationChange > 30) {
      faults.push({
        type: 'utilization_pattern_change',
        severity: 'low',
        description: `Utilization changed by ${utilizationChange.toFixed(2)}% compared to last year`,
        needsVerification: false
      });
    }
  }
  
  // Fault 5: Very low utilization (<30%)
  const util = parseFloat(currentBudget.utilizationPercentage || 0);
  if (util < 30 && currentBudget.status === 'active') {
    faults.push({
      type: 'low_utilization',
      severity: 'medium',
      description: `Only ${util.toFixed(2)}% of budget utilized`,
      needsVerification: true
    });
  }
  
  // Fault 6: Very high utilization (>95% with time remaining)
  const daysRemaining = Math.ceil((new Date(currentBudget.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (util > 95 && daysRemaining > 30) {
    faults.push({
      type: 'premature_exhaustion',
      severity: 'high',
      description: `${util.toFixed(2)}% utilized with ${daysRemaining} days remaining`,
      needsVerification: true
    });
  }
  
  return faults;
};

// Generate multi-year data
const generateMultiYearData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Budget.deleteMany({});
    await Transaction.deleteMany({});
    await Anomaly.deleteMany({});
    await District.deleteMany({});

    // Create admin user
    console.log('👤 Creating users...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@govintel.gov.in',
      password: 'admin123',
      role: 'admin'
    });

    const auditor = await User.create({
      name: 'Auditor Kumar',
      email: 'auditor@govintel.gov.in',
      password: 'auditor123',
      role: 'auditor'
    });

    console.log('✅ Users created');

    // Create departments
    console.log('🏢 Creating departments...');
    const departments = [];
    for (let i = 0; i < DEPARTMENTS.length; i++) {
      const dept = await Department.create({
        name: DEPARTMENTS[i],
        code: `DEPT-${String(i + 1).padStart(3, '0')}`,
        ministry: 'Ministry of Finance',
        description: `${DEPARTMENTS[i]} department`,
        isActive: true
      });
      departments.push(dept);
    }
    console.log(`✅ Created ${departments.length} departments`);

    // Create districts
    console.log('🗺️  Creating districts...');
    const districts = [];
    for (const districtData of sampleDistricts) {
      const district = await District.create({
        ...districtData,
        coordinates: {
          latitude: districtData.latitude,
          longitude: districtData.longitude
        },
        area: Math.floor(Math.random() * 5000) + 500,
        headquarters: districtData.name
      });
      districts.push(district);
    }
    console.log(`✅ Created ${districts.length} districts`);

    // Generate budgets for 3 years (current + 2 past years)
    console.log('💰 Creating multi-year budgets...');
    const allBudgets = [];
    const currentYear = new Date().getFullYear();
    const budgetsBySchemeAndDept = new Map(); // Track budgets by scheme+department for comparison
    
    // Generate for each year (current, last year, 2 years ago)
    for (let yearOffset = 2; yearOffset >= 0; yearOffset--) {
      const fyYear = currentYear - yearOffset;
      const financialYear = `${fyYear}-${fyYear + 1}`;
      const startDate = new Date(fyYear, 3, 1); // April 1
      const endDate = new Date(fyYear + 1, 2, 31); // March 31 next year
      
      console.log(`  📅 Generating data for FY ${financialYear}...`);
      
      // Create 40 budgets per year for good comparison
      for (let i = 0; i < 40; i++) {
        const department = departments[Math.floor(Math.random() * departments.length)];
        const district = districts[Math.floor(Math.random() * districts.length)];
        const scheme = schemes[Math.floor(Math.random() * schemes.length)];
        
        const key = `${scheme}-${department._id}`;
        
        // Get historical budgets for this scheme+department
        const historicalBudgets = budgetsBySchemeAndDept.get(key) || [];
        
        // Base amount with realistic year-over-year growth
        let baseAmount = (Math.floor(Math.random() * 80) + 40) * 1000000; // 40-120 million
        
        if (historicalBudgets.length > 0) {
          const lastBudget = historicalBudgets[historicalBudgets.length - 1];
          // Natural growth: -10% to +20% year-over-year
          const growthFactor = 1 + (Math.random() * 0.3 - 0.1);
          baseAmount = lastBudget.allocatedAmount * growthFactor;
          
          // Introduce some faults: 10% chance of unusual growth
          if (Math.random() < 0.1) {
            baseAmount = lastBudget.allocatedAmount * (1.5 + Math.random() * 0.8); // 150-230% of last year
          }
          
          // 5% chance of unusual decrease
          if (Math.random() < 0.05) {
            baseAmount = lastBudget.allocatedAmount * (0.3 + Math.random() * 0.2); // 30-50% of last year
          }
        }
        
        const allocatedAmount = Math.floor(baseAmount);
        
        // Utilization rate varies by year
        let utilizationRate;
        if (yearOffset === 2) {
          // 2 years ago: completed, high utilization
          utilizationRate = 0.75 + Math.random() * 0.24; // 75-99%
        } else if (yearOffset === 1) {
          // Last year: mostly completed
          utilizationRate = 0.70 + Math.random() * 0.29; // 70-99%
        } else {
          // Current year: in progress
          utilizationRate = 0.25 + Math.random() * 0.60; // 25-85%
        }
        
        const spentAmount = Math.floor(allocatedAmount * utilizationRate);
        
        // Determine status based on year
        let status;
        if (yearOffset === 2) {
          status = 'closed';
        } else if (yearOffset === 1) {
          status = utilizationRate > 0.9 ? 'closed' : 'active';
        } else {
          status = 'active';
        }

        const budget = await Budget.create({
          title: `${scheme} - ${district.name} (FY${fyYear})`,
          department: department._id,
          financialYear,
          scheme,
          allocatedAmount,
          spentAmount,
          revisedBudget: allocatedAmount + (Math.random() > 0.8 ? Math.floor(allocatedAmount * 0.05) : 0),
          status,
          startDate,
          endDate,
          district: district.name,
          state: district.state,
          category: categories[Math.floor(Math.random() * categories.length)],
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
          description: `Budget allocation for ${scheme} in ${district.name} - FY${fyYear}-${fyYear + 1}`,
          targetBeneficiaries: Math.floor(Math.random() * 100000) + 10000,
          actualBeneficiaries: Math.floor(Math.random() * 80000) + 8000,
          completionPercentage: Math.min(utilizationRate * 100, 100),
          approvedBy: admin._id,
          approvedDate: new Date(fyYear, 2, Math.floor(Math.random() * 28) + 1)
        });
        
        allBudgets.push(budget);
        
        // Store for historical comparison
        if (!budgetsBySchemeAndDept.has(key)) {
          budgetsBySchemeAndDept.set(key, []);
        }
        budgetsBySchemeAndDept.get(key).push(budget);
      }
    }
    
    console.log(`✅ Created ${allBudgets.length} budgets across 3 years`);

    // Create transactions
    console.log('💸 Creating transactions...');
    const allTransactions = [];
    const beneficiaries = [
      { name: 'Rural Development Council', accountNumber: '1234567890', bankName: 'State Bank of India', ifscCode: 'SBIN0001234' },
      { name: 'State Health Authority', accountNumber: '9876543210', bankName: 'Punjab National Bank', ifscCode: 'PUNB0098765' },
      { name: 'Education Board', accountNumber: '5555555555', bankName: 'Bank of Baroda', ifscCode: 'BARB0005555' },
      { name: 'Infrastructure Corp', accountNumber: '7777777777', bankName: 'HDFC Bank', ifscCode: 'HDFC0007777' },
      { name: 'Social Welfare Trust', accountNumber: '3333333333', bankName: 'ICICI Bank', ifscCode: 'ICIC0003333' }
    ];
    
    for (const budget of allBudgets) {
      const txnCount = Math.floor(Math.random() * 5) + 3; // 3-7 transactions per budget
      let remainingAmount = budget.spentAmount;

      for (let i = 0; i < txnCount && remainingAmount > 0; i++) {
        const amount = Math.min(
          Math.floor(remainingAmount / (txnCount - i) + (Math.random() - 0.5) * remainingAmount * 0.3),
          remainingAmount
        );

        if (amount <= 0) continue;

        const transactionDate = new Date(budget.startDate);
        transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 300));

        const beneficiary = beneficiaries[Math.floor(Math.random() * beneficiaries.length)];

        const year = transactionDate.getFullYear();
        const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        const transactionId = `TXN${year}${month}${random}`;

        const transaction = await Transaction.create({
          budget: budget._id,
          department: budget.department,
          transactionId,
          type: TRANSACTION_TYPES.EXPENDITURE,
          amount,
          description: `${budget.scheme} - Payment ${i + 1}`,
          beneficiary,
          transactionDate,
          paymentMode: ['NEFT', 'RTGS', 'IMPS'][Math.floor(Math.random() * 3)],
          status: 'completed',
          approvedBy: admin._id,
          category: budget.category
        });
        allTransactions.push(transaction);
        remainingAmount -= amount;
      }
    }
    
    console.log(`✅ Created ${allTransactions.length} transactions`);

    // Detect faults and create anomalies
    console.log('🔍 Detecting faults using AI logic...');
    const detectedAnomalies = [];
    
    // Check each current year budget against its historical data
    const currentYearBudgets = allBudgets.filter(b => b.financialYear === `${currentYear}-${currentYear + 1}`);
    
    for (const budget of currentYearBudgets) {
      const key = `${budget.scheme}-${budget.department}`;
      const allBudgetsForKey = budgetsBySchemeAndDept.get(key) || [];
      const historicalBudgets = allBudgetsForKey.filter(b => b.financialYear !== budget.financialYear);
      
      const faults = detectBudgetFaults(budget, historicalBudgets);
      
      for (const fault of faults) {
        if (fault.needsVerification) {
          const anomaly = await Anomaly.create({
            budget: budget._id,
            type: fault.type,
            riskLevel: fault.severity,
            title: `Budget Verification Required: ${fault.type.replace(/_/g, ' ')}`,
            description: fault.description,
            detectedDate: new Date(),
            amount: budget.allocatedAmount,
            confidence: 75 + Math.floor(Math.random() * 20), // 75-95%
            status: 'pending',
            verificationStatus: 'needs_review',
            aiRiskScore: fault.severity === 'high' ? 75 + Math.floor(Math.random() * 25) : 50 + Math.floor(Math.random() * 25)
          });
          detectedAnomalies.push(anomaly);
        }
      }
    }
    
    // Add some transaction-based anomalies
    const currentYearTransactions = allTransactions.filter(t => {
      const budget = allBudgets.find(b => b._id.equals(t.budget));
      return budget && budget.financialYear === `${currentYear}-${currentYear + 1}`;
    });
    
    // Create 10-15 transaction anomalies
    for (let i = 0; i < Math.min(15, currentYearTransactions.length); i++) {
      const transaction = currentYearTransactions[Math.floor(Math.random() * currentYearTransactions.length)];
      const budget = allBudgets.find(b => b._id.equals(transaction.budget));
      
      const anomalyType = [
        { type: 'high_value_transaction', risk: 'high', title: 'High Value Transaction Detected' },
        { type: 'round_figure_transaction', risk: 'medium', title: 'Suspicious Round Figure' },
        { type: 'duplicate_transaction', risk: 'high', title: 'Potential Duplicate Payment' }
      ][Math.floor(Math.random() * 3)];
      
      const anomaly = await Anomaly.create({
        transaction: transaction._id,
        budget: budget._id,
        type: anomalyType.type,
        riskLevel: anomalyType.risk,
        title: anomalyType.title,
        description: `Transaction of ₹${transaction.amount.toLocaleString('en-IN')} flagged for verification`,
        detectedDate: new Date(),
        amount: transaction.amount,
        confidence: 60 + Math.floor(Math.random() * 30),
        status: 'pending',
        verificationStatus: 'needs_review',
        aiRiskScore: 50 + Math.floor(Math.random() * 40)
      });
      detectedAnomalies.push(anomaly);
    }
    
    console.log(`✅ Created ${detectedAnomalies.length} anomalies requiring verification`);
    console.log(`   - ${detectedAnomalies.filter(a => a.riskLevel === 'high').length} High Risk`);
    console.log(`   - ${detectedAnomalies.filter(a => a.riskLevel === 'medium').length} Medium Risk`);
    console.log(`   - ${detectedAnomalies.filter(a => a.riskLevel === 'low').length} Low Risk`);

    console.log('\n✨ Multi-year data generation complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${allBudgets.length} budgets across 3 financial years`);
    console.log(`   - ${allTransactions.length} transactions`);
    console.log(`   - ${detectedAnomalies.length} anomalies detected for verification`);
    console.log(`   - ${currentYearBudgets.length} current year budgets with historical comparison`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: admin@govintel.gov.in');
    console.log('   Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating multi-year data:', error);
    process.exit(1);
  }
};

generateMultiYearData();
