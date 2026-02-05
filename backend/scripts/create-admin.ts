import bcrypt from 'bcryptjs';
import { db } from '../src/db/index.js';

async function createAdminUser() {
  try {
    const email = 'admin@nextlink.com';
    const password = 'admin123';
    const fullName = 'Admin User';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Check if admin exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, fullName, 'admin', 1]
    );

    console.log('✅ Admin user created successfully');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
