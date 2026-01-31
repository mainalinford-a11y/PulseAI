import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, createAuthCookie } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, fullName, password, phone } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate verification token (even if we don't send email yet)
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const result = await query(
      `INSERT INTO users (email, full_name, password_hash, phone, subscription_tier, subscription_status, verification_token, is_verified)
       VALUES ($1, $2, $3, $4, 'free', 'active', $5, false)
       RETURNING id, email, full_name, subscription_tier`,
      [email.toLowerCase(), fullName, hashedPassword, phone || null, verificationToken]
    );

    const newUser = result.rows[0];

    // TODO: Send verification email here
    // console.log(`Verification token for ${email}: ${verificationToken}`);

    const token = signToken({
      id: newUser.id,
      email: newUser.email
    });

    res.setHeader('Set-Cookie', createAuthCookie(token));

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        tier: newUser.subscription_tier,
      },
      token: process.env.DEBUG_AUTH === 'true' ? token : undefined
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}