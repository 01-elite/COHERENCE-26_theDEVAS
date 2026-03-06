/**
 * Data Generator for Demo/Testing
 * Generates realistic government budget data for demonstration
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/database');
const User = require('../models/User');
const Department = require('../models/Department');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Anomaly = require('../models/Anomaly');
const District = require('../models/District');
const { DEPARTMENTS, STATES, TRANSACTION_TYPES } = require('../utils/constants');

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

// Generate demo data
const generateData = async () => {
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

    // Create budgets (120 records for comprehensive demo)
    console.log('💰 Creating budgets...');
    const budgets = [];
    const currentYear = new Date().getFullYear();
    const budgetStatuses = ['active', 'approved', 'closed', 'draft'];
    const categories = ['infrastructure', 'healthcare', 'education', 'welfare', 'agriculture', 'transport', 'others'];
    
    for (let i = 0; i < 120; i++) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const district = districts[Math.floor(Math.random() * districts.length)];
      const scheme = schemes[Math.floor(Math.random() * schemes.length)];
      
      // Vary amounts significantly for realistic data
      const allocatedAmount = (Math.floor(Math.random() * 100) + 20) * 1000000; // 20-120 million
      const utilizationRate = Math.random() * 0.95; // 0-95% utilization
      const spentAmount = Math.floor(allocatedAmount * utilizationRate);
      
      // Vary financial years for historical data
      const yearOffset = Math.floor(Math.random() * 3); // 0-2 years back
      const fyYear = currentYear - yearOffset;
      const startDate = new Date(fyYear, 3, 1); // April 1
      const endDate = new Date(fyYear + 1, 2, 31); // March 31 next year

      // Determine status based on year and utilization
      let status;
      if (yearOffset === 0) {
        status = utilizationRate > 0.7 ? 'active' : 'approved';
      } else if (yearOffset === 1) {
        status = utilizationRate > 0.9 ? 'closed' : 'active';
      } else {
        status = 'closed';
      }

      const budget = await Budget.create({
        title: `${scheme} - ${district.name} (Phase ${i + 1})`,
        department: department._id,
        financialYear: `${fyYear}-${fyYear + 1}`,
        scheme,
        allocatedAmount,
        spentAmount,
        revisedBudget: allocatedAmount + (Math.random() > 0.7 ? Math.floor(allocatedAmount * 0.1) : 0),
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
      budgets.push(budget);

      // Update department totals
      department.totalAllocatedBudget = (department.totalAllocatedBudget || 0) + allocatedAmount;
      department.totalSpent = (department.totalSpent || 0) + spentAmount;
      await department.save();

      // Update district totals
      district.totalBudgetAllocated = (district.totalBudgetAllocated || 0) + allocatedAmount;
      district.totalBudgetSpent = (district.totalBudgetSpent || 0) + spentAmount;
      await district.save();
    }
    console.log(`✅ Created ${budgets.length} budgets`);

    // Create transactions (average 3-8 per budget for realistic data)
    console.log('💸 Creating transactions...');
    const transactions = [];
    for (const budget of budgets) {
      const txnCount = Math.floor(Math.random() * 6) + 3; // 3-8 transactions per budget
      let remainingAmount = budget.spentAmount;

      for (let i = 0; i < txnCount && remainingAmount > 0; i++) {
        const amount = Math.min(
          Math.floor(remainingAmount / (txnCount - i) + (Math.random() - 0.5) * remainingAmount * 0.3),
          remainingAmount
        );

        if (amount <= 0) continue;

        const daysAgo = Math.floor(Math.random() * 365);
        const transactionDate = new Date(budget.startDate);
        transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 300));

        const beneficiaries = [
          { name: 'Rural Development Council', accountNumber: '1234567890', bankName: 'State Bank of India', ifscCode: 'SBIN0001234' },
          { name: 'State Health Authority', accountNumber: '9876543210', bankName: 'Punjab National Bank', ifscCode: 'PUNB0098765' },
          { name: 'Education Board', accountNumber: '5555555555', bankName: 'Bank of Baroda', ifscCode: 'BARB0005555' },
          { name: 'Infrastructure Corp', accountNumber: '7777777777', bankName: 'HDFC Bank', ifscCode: 'HDFC0007777' },
          { name: 'Social Welfare Trust', accountNumber: '3333333333', bankName: 'ICICI Bank', ifscCode: 'ICIC0003333' },
          { name: 'District Administration', accountNumber: '1111111111', bankName: 'Union Bank', ifscCode: 'UBIN0011111' },
          { name: 'Municipal Corporation', accountNumber: '2222222222', bankName: 'Canara Bank', ifscCode: 'CNRB0002222' },
          { name: 'Public Works Department', accountNumber: '4444444444', bankName: 'Bank of India', ifscCode: 'BKID0004444' }
        ];

        const beneficiary = beneficiaries[Math.floor(Math.random() * beneficiaries.length)];

        // Generate transaction ID
        const year = transactionDate.getFullYear();
        const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        const transactionId = `TXN${year}${month}${random}`;

        const paymentModes = ['NEFT', 'RTGS', 'IMPS', 'Cheque', 'DD'];
        const statuses = i === txnCount - 1 && Math.random() > 0.9 ? 'pending' : 'completed';

        const transaction = await Transaction.create({
          budget: budget._id,
          department: budget.department,
          transactionId,
          type: TRANSACTION_TYPES.EXPENDITURE,
          amount,
          description: `${budget.scheme} - Installment ${i + 1} for ${budget.district}`,
          beneficiary,
          transactionDate,
          paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
          status: statuses,
          approvedBy: admin._id,
          category: budget.category
        });
        transactions.push(transaction);
        remainingAmount -= amount;
      }
    }
    console.log(`✅ Created ${transactions.length} transactions`);

    // Create anomalies (20-25 for comprehensive testing)
    console.log('⚠️  Creating sample anomalies...');
    const anomaliesData = [];
    
    // Add diverse anomalies
    const anomalyTypes = [
      {
        type: 'high_value_transaction',
        title: 'Unusually High Transaction Amount',
        riskLevel: 'high',
        description: 'Transaction amount significantly exceeds average spending pattern'
      },
      {
        type: 'round_figure_transaction',
        title: 'Suspicious Round Figure Payment',
        riskLevel: 'medium',
        description: 'Payment made in exact round figure, potentially indicating fraudulent activity'
      },
      {
        type: 'unusual_spending_pattern',
        title: 'Abnormal Spending Spike',
        riskLevel: 'high',
        description: 'Sudden increase in spending detected compared to historical patterns'
      },
      {
        type: 'duplicate_transaction',
        title: 'Potential Duplicate Payment',
        riskLevel: 'critical',
        description: 'Similar transaction found with same amount and beneficiary'
      },
      {
        type: 'ghost_beneficiary',
        title: 'Suspicious Beneficiary Account',
        riskLevel: 'critical',
        description: 'Beneficiary account shows irregular activity patterns'
      },
      {
        type: 'high_velocity_spending',
        title: 'Rapid Sequential Transactions',
        riskLevel: 'high',
        description: 'Multiple high-value transactions in short time period'
      },
      {
        type: 'threshold_breach',
        title: 'Budget Threshold Exceeded',
        riskLevel: 'high',
        description: 'Transaction causes budget allocation to exceed approved limits'
      },
      {
        type: 'off_hours_transaction',
        title: 'After-Hours Transaction',
        riskLevel: 'medium',
        description: 'Transaction processed outside normal business hours'
      }
    ];

    for (let i = 0; i < 25; i++) {
      const transaction = transactions[Math.floor(Math.random() * transactions.length)];
      const budget = budgets.find(b => b._id.equals(transaction.budget));
      
      if (!budget) continue;

      const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      const statuses = ['open', 'investigating', 'resolved', 'false_positive'];
      const status = i < 15 ? 'open' : statuses[Math.floor(Math.random() * statuses.length)];

      const anomaly = await Anomaly.create({
        transaction: transaction._id,
        budget: budget._id,
        type: anomalyType.type,
        riskLevel: anomalyType.riskLevel,
        title: anomalyType.title,
        description: `${anomalyType.description}. Amount: ₹${(transaction.amount / 10000000).toFixed(2)} Cr in ${budget.district}, ${budget.state}`,
        amount: transaction.amount,
        confidence: Math.floor(Math.random() * 35) + 65, // 65-100%
        status,
        detectedBy: 'AI_System',
        detectedDate: new Date(transaction.transactionDate.getTime() + Math.random() * 86400000), // Within 24 hours of transaction
        investigatedBy: status !== 'open' ? auditor._id : undefined,
        resolvedDate: status === 'resolved' ? new Date() : undefined
      });
      anomaliesData.push(anomaly);
    }
    console.log(`✅ Created ${anomaliesData.length} anomalies`);

    console.log('\n🎉 Data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Departments: ${departments.length}`);
    console.log(`   Districts: ${districts.length}`);
    console.log(`   Budgets: ${budgets.length}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Anomalies: ${anomaliesData.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@govintel.gov.in / admin123');
    console.log('   Auditor: auditor@govintel.gov.in / auditor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating data:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  generateData();
}

module.exports = generateData;
