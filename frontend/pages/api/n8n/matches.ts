import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib'; // Using absolute alias for reliability

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, type = 'high' } = req.query;

    if (!userId) return res.status(400).json({ success: false, error: 'Valid userId is required' });

    const sql = type === 'high'
      ? `SELECT id, job_title, company_name, location, job_url, match_score, user_status, found_at as evaluated_at 
         FROM job_matches 
         WHERE user_id = $1 AND match_score >= 70
         ORDER BY match_score DESC LIMIT 50`
      : `SELECT id, job_title, company_name, location, job_url, match_score, user_status, found_at as evaluated_at 
         FROM job_matches 
         WHERE user_id = $1 
         ORDER BY match_score DESC LIMIT 100`;

    const result = await query(sql, [userId]);
    return res.status(200).json({ success: true, matches: result.rows });
  } catch (error) {
    console.error('Matches API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
}