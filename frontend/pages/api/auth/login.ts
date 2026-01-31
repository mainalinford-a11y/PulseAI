import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, createAuthCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // 1. Find user (case-insensitive email search)
        const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 3. Create token
        const token = signToken({
            id: user.id,
            email: user.email,
            name: user.full_name
        });

        // 4. Set secure cookie + a simple non-httpOnly debug cookie
        res.setHeader('Set-Cookie', [
            createAuthCookie(token),
            `pulse_debug=login_success; Path=/; Max-Age=3600; SameSite=Lax; Secure`
        ]);

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                cv_url: user.cv_url,
                is_verified: user.is_verified
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}