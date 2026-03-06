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

    // Create budgets
    console.log('💰 Creating budgets...');
    const budgets = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 30; i++) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const district = districts[Math.floor(Math.random() * districts.length)];
      const scheme = schemes[Math.floor(Math.random() * schemes.length)];
      
      const allocatedAmount = (Math.floor(Math.random() * 50) + 10) * 1000000; // 10-60 million
      const spentAmount = Math.floor(allocatedAmount * (Math.random() * 0.8)); // 0-80% spent
      
      const startDate = new Date(currentYear, 3, 1); // April 1
      const endDate = new Date(currentYear + 1, 2, 31); // March 31 next year

      const budget = await Budget.create({
        title: `${scheme} - ${district.name}`,
        department: department._id,
        financialYear: `${currentYear}-${currentYear + 1}`,
        scheme,
        allocatedAmount,
        spentAmount,
        status: 'active',
        startDate,
        endDate,
        district: district.name,
        state: district.state,
        description: `Budget allocation for ${scheme} in ${district.name}`,
        approvedBy: admin._id,
        approvedDate: new Date()
      });
      budgets.push(budget);

      // Update department totals
      department.totalAllocatedBudget += allocatedAmount;
      department.totalSpent += spentAmount;
      await department.save();

      // Update district totals
      district.totalBudgetAllocated += allocatedAmount;
      district.totalBudgetSpent += spentAmount;
      await district.save();
    }
    console.log(`✅ Created ${budgets.length} budgets`);

    // Create transactions
    console.log('💸 Creating transactions...');
    const transactions = [];
    for (const budget of budgets) {
      const txnCount = Math.floor(Math.random() * 15) + 5; // 5-20 transactions per budget
      let remainingAmount = budget.spentAmount;

      for (let i = 0; i < txnCount && remainingAmount > 0; i++) {
        const amount = Math.min(
          Math.floor(Math.random() * (budget.allocatedAmount / 10)),
          remainingAmount
        );

        const daysAgo = Math.floor(Math.random() * 300);
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - daysAgo);

        const beneficiaries = [
          { name: 'Rural Development Council', accountNumber: '1234567890' },
          { name: 'State Health Authority', accountNumber: '9876543210' },
          { name: 'Education Board', accountNumber: '5555555555' },
          { name: 'Infrastructure Corp', accountNumber: '7777777777' },
          { name: 'Social Welfare Trust', accountNumber: '3333333333' }
        ];

        const beneficiary = beneficiaries[Math.floor(Math.random() * beneficiaries.length)];

        // Generate transaction ID
        const txnDate = new Date();
        const year = txnDate.getFullYear();
        const month = String(txnDate.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        const transactionId = `TXN${year}${month}${random}`;

        const transaction = await Transaction.create({
          budget: budget._id,
          transactionId,
          type: TRANSACTION_TYPES.EXPENDITURE,
          amount,
          description: `Payment for ${budget.scheme} - Phase ${i + 1}`,
          beneficiary,
          transactionDate,
          paymentMode: ['NEFT', 'RTGS', 'IMPS'][Math.floor(Math.random() * 3)],
          status: 'completed',
          approvedBy: admin._id
        });
        transactions.push(transaction);
        remainingAmount -= amount;
      }
    }
    console.log(`✅ Created ${transactions.length} transactions`);

    // Create some anomalies
    console.log('⚠️  Creating sample anomalies...');
    const anomaliesData = [];
    
    // Add some suspicious transactions
    for (let i = 0; i < 10; i++) {
      const transaction = transactions[Math.floor(Math.random() * transactions.length)];
      const budget = budgets.find(b => b._id.equals(transaction.budget));
      
      const anomalyTypes = [
        {
          type: 'high_value_transaction',
          title: 'Unusually High Transaction Amount',
          description: `Transaction amount of ₹${transaction.amount.toLocaleString('en-IN')} is significantly higher than average.`,
          riskLevel: 'high'
        },
        {
          type: 'round_figure_transaction',
          title: 'Suspicious Round Figure',
          description: `Transaction of exactly ₹${transaction.amount.toLocaleString('en-IN')} appears suspicious.`,
          riskLevel: 'medium'
        },
        {
          type: 'unusual_spending_pattern',
          title: 'Unusual Spending Pattern',
          description: 'Sudden spike in spending detected.',
          riskLevel: 'medium'
        }
      ];

      const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];

      const anomaly = await Anomaly.create({
        transaction: transaction._id,
        budget: budget._id,
        type: anomalyType.type,
        riskLevel: anomalyType.riskLevel,
        title: anomalyType.title,
        description: anomalyType.description,
        amount: transaction.amount,
        confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
        status: 'open',
        detectedDate: new Date()
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
