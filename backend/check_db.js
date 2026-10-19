import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/cbdp');
    console.log('Successfully connected to MongoDB 127.0.0.1:27017/cbdp');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in local MongoDB:');
    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`  - ${c.name}: ${count} documents`);
    }

    const employees = await mongoose.connection.db.collection('employees').find().toArray();
    console.log('\nEmployees in DB (' + employees.length + '):');
    employees.forEach(e => {
      console.log(`  - ID: ${e._id}, Code: ${e.employeeCode}, Name: ${e.personalDetails?.firstName} ${e.personalDetails?.lastName}, Email: ${e.email || e.personalDetails?.email}`);
    });

    const users = await mongoose.connection.db.collection('users').find().toArray();
    console.log('\nUsers in DB (' + users.length + '):');
    users.forEach(u => {
      console.log(`  - ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, ProfileId: ${u.employeeProfileId}, Active: ${u.isActive}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
