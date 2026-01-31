import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cvId = req.query.id as string;
        if (!cvId) {
            return res.status(400).json({ error: 'CV ID is required' });
        }

        // Extract user email from JWT cookie
        let userEmail: string | null = null;
        try {
            const token = parseTokenFromReq(req as any);
            if (token) {
                const payload = verifyToken(token as string);
                if (payload && payload.email) {
                    userEmail = payload.email;
                }
            }
        } catch (e) {
            // User not authenticated; allow public access for now
            // In production, you may want to require authentication
        }

        // Query CV file from database
        const cvRes: any = await query(
            'SELECT id, user_id, filename, mime_type, file_content FROM cv_files WHERE id = $1',
            [parseInt(cvId, 10)]
        );

        if (!cvRes.rows || cvRes.rows.length === 0) {
            return res.status(404).json({ error: 'CV file not found' });
        }

        const cv = cvRes.rows[0];

        // If user is authenticated, ensure they own this CV (optional: comment out for public access)
        if (userEmail) {
            const ownerRes: any = await query(
                'SELECT id FROM users WHERE email = $1 AND id = $2',
                [userEmail, cv.user_id]
            );
            if (!ownerRes.rows || ownerRes.rows.length === 0) {
                return res.status(403).json({ error: 'Not authorized to access this CV' });
            }
        }

        // Set response headers for file download
        res.setHeader('Content-Type', cv.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${cv.filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(cv.file_content));

        return res.status(200).send(cv.file_content);
    } catch (err) {
        console.error('CV fetch error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
