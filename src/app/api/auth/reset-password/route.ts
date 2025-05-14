import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeQuery } from '@/lib/db-mysql';

// Verify token and update password
export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if token exists and is valid
    const tokenSql = `
      SELECT * FROM password_reset_tokens
      WHERE token = ? AND expires_at > NOW()
    `;
    
    const tokens = await executeQuery<any>(tokenSql, [token]);
    
    if (tokens.length === 0) {
      return NextResponse.json({ 
        message: 'Invalid or expired token. Please request a new password reset link.' 
      }, { status: 400 });
    }

    const resetToken = tokens[0];
    const userId = resetToken.user_id;

    // Hash the new password using crypto instead of bcryptjs
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    // Hash the password with the salt using SHA-256
    const hash = crypto
      .createHash('sha256')
      .update(newPassword + salt)
      .digest('hex');
    
    // Store password as salt:hash
    const hashedPassword = `${salt}:${hash}`;

    // Update the user's password
    const updateSql = `
      UPDATE users
      SET hashed_password = ?
      WHERE id = ?
    `;
    
    await executeQuery(updateSql, [hashedPassword, userId]);

    // Delete the used token
    const deleteSql = `
      DELETE FROM password_reset_tokens
      WHERE token = ?
    `;
    
    await executeQuery(deleteSql, [token]);

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ message: 'An error occurred while resetting password' }, { status: 500 });
  }
} 