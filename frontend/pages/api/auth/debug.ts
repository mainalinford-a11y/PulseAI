import { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import { verifyToken } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    let verification = null;
    if (token) {
        try {
            verification = verifyToken(token);
        } catch (e: any) {
            verification = { error: e.message };
        }
    }

    return res.status(200).json({
        hasCookieHeader: !!req.headers.cookie,
        allCookies: Object.keys(cookies),
        tokenFound: !!token,
        tokenExcerpt: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : null,
        verification,
        env: {
            nodeEnv: process.env.NODE_ENV,
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            n8nWebhookPreview: process.env.N8N_WEBHOOK_URL ? `${process.env.N8N_WEBHOOK_URL.substring(0, 15)}...${process.env.N8N_WEBHOOK_URL.slice(-15)}` : 'missing'
        }
    });
}
