import { NextApiRequest, NextApiResponse } from 'next';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const token = parseTokenFromReq(req as any);
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const payload = verifyToken(token as string);
        if (!payload) return res.status(401).json({ message: 'Invalid token' });

        const { url } = req.body;
        if (!url) return res.status(400).json({ message: 'Missing url' });

        // Update users.cv_url to the provided url
        await query('UPDATE users SET cv_url = $1, cv_uploaded_at = NOW() WHERE email = $2', [url, payload.email]);

        return res.status(200).json({ success: true, cvUrl: url });
    } catch (err) {
        console.error('set current cv error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
