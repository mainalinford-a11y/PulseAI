import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify auth
        const token = parseTokenFromReq(req);
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        const payload = verifyToken(token);
        if (!payload?.id) return res.status(401).json({ error: 'Invalid token' });

        const { jobId, status } = req.body;

        if (!jobId || !status) {
            return res.status(400).json({ error: 'Missing jobId or status' });
        }

        // Update status
        await query(
            'UPDATE job_matches SET user_status = $1, applied_at = CASE WHEN $1 = \'applied\' THEN NOW() ELSE applied_at END WHERE id = $2 AND user_id = $3',
            [status, jobId, payload.id]
        );

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Update status error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
