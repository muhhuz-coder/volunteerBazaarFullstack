import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db-mysql';
import crypto from 'crypto';

// Handle password reset request
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const userSql = `SELECT id FROM users WHERE email = ?`;
    const users = await executeQuery<any>(userSql, [email]);
    
    if (users.length === 0) {
      // Don't reveal that the user doesn't exist for security reasons
      // Just pretend we sent an email
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const userId = users[0].id;
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    
    // Delete any existing reset tokens for this user
    const deleteSql = `
      DELETE FROM password_reset_tokens
      WHERE user_id = ?
    `;
    await executeQuery(deleteSql, [userId]);
    
    // Insert the new token
    const insertSql = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    await executeQuery(insertSql, [userId, token, expiresAt]);
    
    // Generate reset URL
    const resetLink = `http://localhost:9002/reset-password?token=${token}`;
    
    // In a real application, send an email with the reset link
    // For now, we'll just log it
    console.log(`Password reset link for ${email}: ${resetLink}`);
    
    // TODO: Implement email sending logic
    // sendResetEmail(email, resetLink);
    
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      // For development only, remove in production
      devInfo: {
        resetLink: resetLink
      }
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ message: 'An error occurred while processing your request' }, { status: 500 });
  }
} 