import type { NextApiRequest, NextApiResponse } from 'next';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = parseTokenFromReq(req);
        if (!token) {
            return res.status(401).json({ error: 'No token found', code: 'TOKEN_MISSING' });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.id) {
            return res.status(401).json({ error: 'Token verification failed', code: 'TOKEN_INVALID' });
        }

        const result = await query(
            'SELECT id, email, full_name, cv_url, subscription_tier FROM users WHERE id = $1::integer',
            [payload.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User does not exist in database', id: payload.id, code: 'USER_NOT_FOUND' });
        }

        const user = result.rows[0];

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                cv_url: user.cv_url,
                tier: user.subscription_tier
            }
        });

    } catch (error: any) {
        console.error('Session check error:', error);
        return res.status(500).json({
            error: 'Database or server error',
            details: error.message,
            code: 'SERVER_ERROR'
        });
    }
}
