import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib'; // Using absolute alias

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId } = req.query;
    const userIdNum = parseInt(userId as string, 10);
    if (!userId || isNaN(userIdNum)) return res.status(400).json({ success: false, error: 'Valid userId is required' });

    const result = await query(
      `SELECT u.id, u.jobs_processed, u.last_processed_at, 
              COUNT(DISTINCT hm.id) as high_matches_count,
              COALESCE(MAX(am.match_score), 0) as best_score
       FROM users u
       LEFT JOIN high_matches hm ON u.id = hm.user_id
       LEFT JOIN all_matches am ON u.id = am.user_id
       WHERE u.id = $1 GROUP BY u.id`,
      [userIdNum]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    return res.status(200).json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Stats API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
}