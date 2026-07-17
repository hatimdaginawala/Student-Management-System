const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');

// Sample data
const seedData = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Batch.deleteMany({}),
      Enrollment.deleteMany({}),
      Payment.deleteMany({})
    ]);
    console.log('✅ Existing data cleared\n');

    // ==========================================
    // 1. Create Users
    // ==========================================
    console.log('Creating users...');
    
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      mobile: '9876543210',
      password: 'admin123',
      role: 'Super Admin',
      status: 'Active'
    });

    const admin1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      mobile: '9876543211',
      password: 'admin123',
      role: 'Admin',
      status: 'Active',
      createdBy: superAdmin._id
    });

    const admin2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      mobile: '9876543212',
      password: 'admin123',
      role: 'Admin',
      status: 'Active',
      createdBy: superAdmin._id
    });

    console.log(`✅ Created ${3} users (1 Super Admin, 2 Admins)`);
    console.log('   Super Admin - Email: admin@example.com, Password: admin123\n');

    // ==========================================
    // 2. Create Batches
    // ==========================================
    console.log('Creating batches...');

    const batch1 = await Batch.create({
      batchName: 'WEB-DEV-2024-01',
      courseName: 'Full Stack Web Development',
      fees: 15000,
      duration: '6 Months',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-07-15'),
      timing: '10:00 AM - 12:00 PM',
      faculty: 'Prof. Amit Kumar',
      status: 'Completed',
      description: 'Complete web development course covering HTML, CSS, JavaScript, React, Node.js, and MongoDB',
      maxStudents: 30,
      roomNumber: 'Lab 101',
      createdBy: superAdmin._id
    });

    const batch2 = await Batch.create({
      batchName: 'PYTHON-2024-02',
      courseName: 'Python Programming & Data Science',
      fees: 12000,
      duration: '4 Months',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-07-01'),
      timing: '2:00 PM - 4:00 PM',
      faculty: 'Prof. Sneha Reddy',
      status: 'Running',
      description: 'Python programming from basics to data science with real-world projects',
      maxStudents: 25,
      roomNumber: 'Lab 102',
      createdBy: admin1._id
    });

    const batch3 = await Batch.create({
      batchName: 'JAVA-2024-03',
      courseName: 'Java Enterprise Development',
      fees: 18000,
      duration: '6 Months',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-10-01'),
      timing: '4:00 PM - 6:00 PM',
      faculty: 'Prof. Vikram Singh',
      status: 'Running',
      description: 'Core Java to Spring Boot with microservices architecture',
      maxStudents: 20,
      roomNumber: 'Lab 103',
      createdBy: admin2._id
    });

    const batch4 = await Batch.create({
      batchName: 'DSA-2024-04',
      courseName: 'Data Structures & Algorithms',
      fees: 10000,
      duration: '3 Months',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-09-01'),
      timing: '8:00 AM - 10:00 AM',
      faculty: 'Prof. Rajesh Gupta',
      status: 'Upcoming',
      description: 'Comprehensive DSA course for competitive programming and interviews',
      maxStudents: 35,
      roomNumber: 'Lab 104',
      createdBy: superAdmin._id
    });

    const batch5 = await Batch.create({
      batchName: 'MOBILE-2024-05',
      courseName: 'Mobile App Development',
      fees: 20000,
      duration: '6 Months',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-01'),
      timing: '12:00 PM - 2:00 PM',
      faculty: 'Prof. Neha Gupta',
      status: 'Cancelled',
      description: 'Flutter and React Native for cross-platform mobile development',
      maxStudents: 25,
      roomNumber: 'Lab 105',
      createdBy: admin1._id
    });

    console.log(`✅ Created ${5} batches\n`);

    // ==========================================
    // 3. Create Students (WITH NEW FIELDS)
    // ==========================================
    console.log('Creating students...');

    const student1 = await Student.create({
      studentId: 'STU202401',
      name: 'Arun Kumar',
      mobile: '9876500001',
      parentMobile: '9876500002',
      email: 'arun.kumar@example.com',
      address: '123, Main Street, Bangalore - 560001',
      fatherName: 'Rajesh Kumar',
      motherName: 'Sunita Kumar',
      fatherOccupation: 'Businessman',
      motherOccupation: 'Housewife',
      aadharNumber: '123456789012',
      joiningDate: new Date('2024-01-15'),
      status: 'Active',
      certificateStatus: 'Received',
      certificateAppliedDate: new Date('2024-06-01'),
      certificateReceivedDate: new Date('2024-07-10'),
      certificateNumber: 'CERT-WEB-2024-001',
      createdBy: superAdmin._id,
      notes: 'Excellent student, very dedicated. Completed web development course with distinction.'
    });

    const student2 = await Student.create({
      studentId: 'STU202402',
      name: 'Divya Sharma',
      mobile: '9876500003',
      parentMobile: '9876500004',
      email: 'divya.sharma@example.com',
      address: '456, Park Avenue, Mumbai - 400001',
      fatherName: 'Anil Sharma',
      motherName: 'Rekha Sharma',
      fatherOccupation: 'Government Officer',
      motherOccupation: 'Teacher',
      aadharNumber: '234567890123',
      joiningDate: new Date('2024-02-01'),
      status: 'Active',
      certificateStatus: 'Received',
      certificateAppliedDate: new Date('2024-06-15'),
      certificateReceivedDate: new Date('2024-07-20'),
      certificateNumber: 'CERT-WEB-2024-002',
      createdBy: admin1._id,
      notes: 'Good at frontend development. Completed with excellent performance in React and CSS.'
    });

    const student3 = await Student.create({
      studentId: 'STU202403',
      name: 'Mohammed Ali',
      mobile: '9876500005',
      email: 'mohammed.ali@example.com',
      address: '789, MG Road, Hyderabad - 500001',
      fatherName: 'Abdul Rehman',
      motherName: 'Fatima Begum',
      fatherOccupation: 'Software Engineer',
      motherOccupation: 'Doctor',
      aadharNumber: '345678901234',
      joiningDate: new Date('2024-03-01'),
      status: 'Active',
      certificateStatus: 'Applied',
      certificateAppliedDate: new Date('2024-08-01'),
      createdBy: admin2._id,
      notes: 'Currently pursuing Python course. Has shown great interest in data science modules.'
    });

    const student4 = await Student.create({
      studentId: 'STU202404',
      name: 'Priyanka Reddy',
      mobile: '9876500006',
      parentMobile: '9876500007',
      email: 'priyanka.reddy@example.com',
      address: '321, Brigade Road, Bangalore - 560001',
      fatherName: 'Venkat Reddy',
      motherName: 'Lakshmi Reddy',
      fatherOccupation: 'Farmer',
      motherOccupation: 'Housewife',
      aadharNumber: '456789012345',
      joiningDate: new Date('2024-03-15'),
      status: 'Active',
      certificateStatus: 'Certificate Pending',
      createdBy: superAdmin._id,
      notes: 'Interested in data science. Availing scholarship. Needs to complete course first.'
    });

    const student5 = await Student.create({
      studentId: 'STU202405',
      name: 'Suresh Patel',
      mobile: '9876500008',
      email: 'suresh.patel@example.com',
      address: '654, CG Road, Ahmedabad - 380001',
      fatherName: 'Mahesh Patel',
      motherName: 'Kanta Patel',
      fatherOccupation: 'Shop Owner',
      motherOccupation: 'Housewife',
      aadharNumber: '567890123456',
      joiningDate: new Date('2024-04-01'),
      status: 'Active',
      certificateStatus: 'Certificate Pending',
      createdBy: admin1._id,
      notes: 'Enrolled in Java course. Showing steady progress. Certificate will be issued after course completion.'
    });

    const student6 = await Student.create({
      studentId: 'STU202406',
      name: 'Ananya Gupta',
      mobile: '9876500009',
      parentMobile: '9876500010',
      email: 'ananya.gupta@example.com',
      address: '987, Kalaghoda, Mumbai - 400001',
      fatherName: 'Vivek Gupta',
      motherName: 'Neha Gupta',
      fatherOccupation: 'Chartered Accountant',
      motherOccupation: 'Lawyer',
      aadharNumber: '678901234567',
      joiningDate: new Date('2024-04-15'),
      status: 'Inactive',
      certificateStatus: 'Certificate Pending',
      createdBy: admin2._id,
      notes: 'On break due to personal reasons. Dropped from Java course. May rejoin next batch.'
    });

    console.log(`✅ Created ${6} students\n`);
    console.log('   Certificate Status Distribution:');
    console.log('   - Received: 2 (Arun Kumar, Divya Sharma)');
    console.log('   - Applied: 1 (Mohammed Ali)');
    console.log('   - Pending: 3 (Priyanka Reddy, Suresh Patel, Ananya Gupta)\n');

    // ==========================================
    // 4. Create Enrollments
    // ==========================================
    console.log('Creating enrollments...');

    // Student 1 enrolled in Batch 1 (WEB-DEV - Completed)
    const enrollment1 = await Enrollment.create({
      studentId: student1._id,
      batchId: batch1._id,
      batchFees: 15000,
      discount: 1000,
      finalFees: 14000,
      joiningDate: new Date('2024-01-15'),
      status: 'Completed',
      createdBy: superAdmin._id,
      remarks: 'Completed with distinction. Certificate issued.'
    });

    // Student 2 enrolled in Batch 1 (WEB-DEV - Completed)
    const enrollment2 = await Enrollment.create({
      studentId: student2._id,
      batchId: batch1._id,
      batchFees: 15000,
      discount: 500,
      finalFees: 14500,
      joiningDate: new Date('2024-02-01'),
      status: 'Completed',
      createdBy: admin1._id,
      remarks: 'Successfully completed. Certificate issued.'
    });

    // Student 3 enrolled in Batch 2 (PYTHON - Running)
    const enrollment3 = await Enrollment.create({
      studentId: student3._id,
      batchId: batch2._id,
      batchFees: 12000,
      discount: 0,
      finalFees: 12000,
      joiningDate: new Date('2024-03-01'),
      status: 'Running',
      createdBy: admin2._id,
      remarks: 'Applied for certificate on 2024-08-01'
    });

    // Student 4 enrolled in Batch 2 (PYTHON - Running)
    const enrollment4 = await Enrollment.create({
      studentId: student4._id,
      batchId: batch2._id,
      batchFees: 12000,
      discount: 2000,
      finalFees: 10000,
      joiningDate: new Date('2024-03-15'),
      status: 'Running',
      createdBy: superAdmin._id,
      remarks: 'Got scholarship discount. Certificate pending until course completion.'
    });

    // Student 5 enrolled in Batch 3 (JAVA - Running)
    const enrollment5 = await Enrollment.create({
      studentId: student5._id,
      batchId: batch3._id,
      batchFees: 18000,
      discount: 0,
      finalFees: 18000,
      joiningDate: new Date('2024-04-01'),
      status: 'Running',
      createdBy: admin1._id,
      remarks: 'Certificate pending. Expected completion by October 2024.'
    });

    // Student 1 also enrolled in Batch 2 (PYTHON - Running)
    const enrollment6 = await Enrollment.create({
      studentId: student1._id,
      batchId: batch2._id,
      batchFees: 12000,
      discount: 1000,
      finalFees: 11000,
      joiningDate: new Date('2024-03-01'),
      status: 'Running',
      createdBy: superAdmin._id,
      remarks: 'Enrolled in second course. Already received web dev certificate.'
    });

    // Student 6 enrolled in Batch 3 (JAVA - Dropped)
    const enrollment7 = await Enrollment.create({
      studentId: student6._id,
      batchId: batch3._id,
      batchFees: 18000,
      discount: 0,
      finalFees: 18000,
      joiningDate: new Date('2024-04-15'),
      status: 'Dropped',
      createdBy: admin2._id,
      dropReason: 'Personal reasons, may rejoin next batch',
      dropDate: new Date('2024-05-15'),
      remarks: 'Certificate not applicable due to drop.'
    });

    console.log(`✅ Created ${7} enrollments\n`);

    // ==========================================
    // 5. Create Payments
    // ==========================================
    console.log('Creating payments...');

    // Payments for Enrollment 1 (Completed - Full Payment: 14000)
    await Payment.create({
      enrollmentId: enrollment1._id,
      amount: 5000,
      paymentMode: 'Cash',
      paymentDate: new Date('2024-01-15'),
      receiptNumber: 'RCP240115001',
      remarks: 'First installment - Admission fee',
      receivedBy: superAdmin._id
    });

    await Payment.create({
      enrollmentId: enrollment1._id,
      amount: 5000,
      paymentMode: 'UPI',
      paymentDate: new Date('2024-02-15'),
      receiptNumber: 'RCP240215002',
      remarks: 'Second installment',
      transactionId: 'UPI123456789',
      receivedBy: admin1._id
    });

    await Payment.create({
      enrollmentId: enrollment1._id,
      amount: 4000,
      paymentMode: 'Bank Transfer',
      paymentDate: new Date('2024-03-15'),
      receiptNumber: 'RCP240315003',
      remarks: 'Final payment - Course completed',
      bankName: 'HDFC Bank',
      receivedBy: superAdmin._id
    });

    // Payments for Enrollment 2 (Completed - Full Payment: 14500)
    await Payment.create({
      enrollmentId: enrollment2._id,
      amount: 14500,
      paymentMode: 'Card',
      paymentDate: new Date('2024-02-01'),
      receiptNumber: 'RCP240201004',
      remarks: 'Full payment at admission',
      receivedBy: admin1._id
    });

    // Payments for Enrollment 3 (Running - Partial: 8000/12000)
    await Payment.create({
      enrollmentId: enrollment3._id,
      amount: 5000,
      paymentMode: 'Cash',
      paymentDate: new Date('2024-03-01'),
      receiptNumber: 'RCP240301005',
      remarks: 'First installment',
      receivedBy: admin2._id
    });

    await Payment.create({
      enrollmentId: enrollment3._id,
      amount: 3000,
      paymentMode: 'UPI',
      paymentDate: new Date('2024-04-01'),
      receiptNumber: 'RCP240401006',
      remarks: 'Second installment',
      transactionId: 'UPI987654321',
      receivedBy: superAdmin._id
    });

    // Payments for Enrollment 4 (Running - Partial: 4000/10000)
    await Payment.create({
      enrollmentId: enrollment4._id,
      amount: 4000,
      paymentMode: 'Cash',
      paymentDate: new Date('2024-03-15'),
      receiptNumber: 'RCP240315007',
      remarks: 'First installment with scholarship discount',
      receivedBy: superAdmin._id
    });

    // Payments for Enrollment 5 (Running - Partial: 10000/18000)
    await Payment.create({
      enrollmentId: enrollment5._id,
      amount: 10000,
      paymentMode: 'Cheque',
      paymentDate: new Date('2024-04-01'),
      receiptNumber: 'RCP240401008',
      remarks: 'First installment',
      chequeNumber: 'CHQ123456',
      chequeDate: new Date('2024-04-01'),
      bankName: 'SBI Bank',
      receivedBy: admin1._id
    });

    // Payments for Enrollment 6 (Running - Partial: 5000/11000)
    await Payment.create({
      enrollmentId: enrollment6._id,
      amount: 5000,
      paymentMode: 'UPI',
      paymentDate: new Date('2024-03-01'),
      receiptNumber: 'RCP240301009',
      remarks: 'First installment - Second course',
      transactionId: 'UPI555666777',
      receivedBy: superAdmin._id
    });

    // Payment for dropped enrollment (Partial refund noted)
    await Payment.create({
      enrollmentId: enrollment7._id,
      amount: 5000,
      paymentMode: 'Cash',
      paymentDate: new Date('2024-04-15'),
      receiptNumber: 'RCP240415010',
      remarks: 'First installment - Refund processed due to drop',
      receivedBy: admin2._id
    });

    console.log(`✅ Created ${10} payments\n`);

    // ==========================================
    // Summary
    // ==========================================
    console.log('========================================');
    console.log('🌱 SEED DATA SUMMARY');
    console.log('========================================');
    console.log(`Users: 3 (1 Super Admin, 2 Admins)`);
    console.log(`Batches: 5 (1 Completed, 2 Running, 1 Upcoming, 1 Cancelled)`);
    console.log(`Students: 6 (5 Active, 1 Inactive)`);
    console.log(`Enrollments: 7 (2 Completed, 4 Running, 1 Dropped)`);
    console.log(`Payments: 10`);
    console.log('========================================');
    console.log('');
    console.log('📋 CERTIFICATE STATUS:');
    console.log('   ✅ Received: 2 students');
    console.log('   📝 Applied:  1 student');
    console.log('   ⏳ Pending:  3 students');
    console.log('');
    console.log('📋 NEW STUDENT FIELDS ADDED:');
    console.log('   Father Name, Mother Name');
    console.log('   Father Occupation, Mother Occupation');
    console.log('   Aadhar Card Number');
    console.log('   Certificate Status, Certificate Number');
    console.log('   Certificate Applied Date, Certificate Received Date');
    console.log('========================================\n');

    console.log('📧 LOGIN CREDENTIALS:');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│ Super Admin                                 │');
    console.log('│ Email    : admin@example.com                │');
    console.log('│ Password : admin123                         │');
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ Admin 1                                     │');
    console.log('│ Email    : rahul.sharma@example.com         │');
    console.log('│ Password : admin123                         │');
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ Admin 2                                     │');
    console.log('│ Email    : priya.patel@example.com          │');
    console.log('│ Password : admin123                         │');
    console.log('└─────────────────────────────────────────────┘\n');

    console.log('📊 STUDENT DETAILS:');
    console.log('┌──────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 1. Arun Kumar        | Cert: Received  | CERT-WEB-2024-001              │');
    console.log('│    Father: Rajesh Kumar (Businessman)                                   │');
    console.log('│    Mother: Sunita Kumar (Housewife)                                     │');
    console.log('│    Aadhar: 1234-5678-9012                                               │');
    console.log('├──────────────────────────────────────────────────────────────────────────┤');
    console.log('│ 2. Divya Sharma      | Cert: Received  | CERT-WEB-2024-002              │');
    console.log('│    Father: Anil Sharma (Government Officer)                             │');
    console.log('│    Mother: Rekha Sharma (Teacher)                                       │');
    console.log('│    Aadhar: 2345-6789-0123                                               │');
    console.log('├──────────────────────────────────────────────────────────────────────────┤');
    console.log('│ 3. Mohammed Ali      | Cert: Applied   | Pending since 2024-08-01       │');
    console.log('│    Father: Abdul Rehman (Software Engineer)                             │');
    console.log('│    Mother: Fatima Begum (Doctor)                                        │');
    console.log('│    Aadhar: 3456-7890-1234                                               │');
    console.log('├──────────────────────────────────────────────────────────────────────────┤');
    console.log('│ 4. Priyanka Reddy    | Cert: Pending   | Course not completed yet       │');
    console.log('│    Father: Venkat Reddy (Farmer)                                        │');
    console.log('│    Mother: Lakshmi Reddy (Housewife)                                    │');
    console.log('│    Aadhar: 4567-8901-2345                                               │');
    console.log('├──────────────────────────────────────────────────────────────────────────┤');
    console.log('│ 5. Suresh Patel      | Cert: Pending   | Course in progress             │');
    console.log('│    Father: Mahesh Patel (Shop Owner)                                    │');
    console.log('│    Mother: Kanta Patel (Housewife)                                      │');
    console.log('│    Aadhar: 5678-9012-3456                                               │');
    console.log('├──────────────────────────────────────────────────────────────────────────┤');
    console.log('│ 6. Ananya Gupta      | Cert: Pending   | Dropped from course            │');
    console.log('│    Father: Vivek Gupta (Chartered Accountant)                           │');
    console.log('│    Mother: Neha Gupta (Lawyer)                                          │');
    console.log('│    Aadhar: 6789-0123-4567                                               │');
    console.log('└──────────────────────────────────────────────────────────────────────────┘\n');

    console.log('✅ Database seeding completed successfully!');

    // Close connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

// Run the seed function
console.log('🚀 Starting database seeding with certificate & family data...\n');
seedData();