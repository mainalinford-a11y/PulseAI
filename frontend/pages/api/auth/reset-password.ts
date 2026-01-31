import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        // 1. Find user by token and check expiry
        const userRes = await query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );

        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const userId = userRes.rows[0].id;

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update password and clear reset token
        await query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [hashedPassword, userId]
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
