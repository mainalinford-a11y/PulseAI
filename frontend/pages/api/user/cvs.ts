import { NextApiRequest, NextApiResponse } from 'next';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const token = parseTokenFromReq(req as any);
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const payload = verifyToken(token as string);
        if (!payload) return res.status(401).json({ message: 'Invalid token' });

        // Prefer to return versioned CVs if the user_cvs table exists
        try {
            const cvsRes: any = await query(
                'SELECT uc.url, uc.uploaded_at FROM user_cvs uc JOIN users u ON u.id = uc.user_id WHERE u.email = $1 ORDER BY uc.uploaded_at DESC',
                [payload.email]
            );
            const cvsRows = cvsRes.rows || [];
            if (cvsRows.length > 0) {
                return res.status(200).json({ cvs: cvsRows.map((r: any) => ({ url: r.url, uploaded_at: r.uploaded_at })) });
            }
        } catch (e) {
            // user_cvs may not exist — we'll fallback to single cv_url
        }

        const result = await query('SELECT cv_url, cv_uploaded_at FROM users WHERE email = $1', [payload.email]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        const cvs = [] as Array<{ url: string; uploaded_at: string | null }>;
        if (user.cv_url) cvs.push({ url: user.cv_url, uploaded_at: user.cv_uploaded_at });

        return res.status(200).json({ cvs });
    } catch (err) {
        console.error('cvs error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
