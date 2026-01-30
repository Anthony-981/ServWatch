/**
 * Seed: Create default admin user
 */

import { User } from '../models/index.js';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('Creating default admin user...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Password: admin123 (default)`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@servwatch.local',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log(`Username: ${admin.username}`);
    console.log(`Password: admin123`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

seed();
