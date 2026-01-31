import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = parseTokenFromReq(req);
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        const payload = verifyToken(token);
        if (!payload?.id) return res.status(401).json({ error: 'Invalid token' });

        const { tier } = req.body;
        const validTiers = ['free', 'starter', 'pro', 'premium'];

        if (!tier || !validTiers.includes(tier)) {
            return res.status(400).json({ error: 'Invalid tier' });
        }

        await query('UPDATE users SET subscription_tier = $1 WHERE id = $2', [tier, payload.id]);

        return res.status(200).json({ success: true, tier });

    } catch (error) {
        console.error('Update tier error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
