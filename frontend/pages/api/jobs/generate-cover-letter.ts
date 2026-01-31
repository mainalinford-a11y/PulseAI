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

        // Check tier
        const userRes = await query('SELECT subscription_tier FROM users WHERE id = $1', [payload.id]);
        const tier = userRes.rows[0]?.subscription_tier;

        if (tier !== 'pro' && tier !== 'premium') {
            return res.status(403).json({ error: 'Pro subscription required for AI Cover Letters' });
        }

        const { matchId } = req.body;
        if (!matchId) return res.status(400).json({ error: 'Missing matchId' });

        const matchRes = await query('SELECT * FROM job_matches WHERE id = $1 AND user_id = $2', [matchId, payload.id]);
        if (matchRes.rows.length === 0) return res.status(404).json({ error: 'Match not found' });

        const match = matchRes.rows[0];

        // MOCK AI Generation (Normally you'd call OpenAI/Ollama here)
        const content = `[Your Name]\n[Your Contact Information]\n\nDear Hiring Manager at ${match.company_name},\n\nI am writing to express my strong interest in the ${match.job_title} position. With my background and the specific requirements listed for this role, I am confident I would be a great fit.\n\n${match.match_reason}\n\nThank you for your time and consideration.\n\nSincerely,\n${payload.email}`;

        // Save to DB
        await query('INSERT INTO cover_letters (user_id, match_id, content) VALUES ($1, $2, $3)', [payload.id, matchId, content]);

        return res.status(200).json({ success: true, content });

    } catch (error) {
        console.error('Cover letter error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
