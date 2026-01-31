import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse_ai_secret_2026_xyz';

export const signToken = (payload: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
};

export const createAuthCookie = (token: string, options: { maxAge?: number } = {}) => {
    // For Vercel preview environments, sometimes strictly Secure cookies on sub-sub-domains fail.
    // We'll set it to true only if we are specifically on production or if we want it.
    // However, most modern browsers REQUIRE secure for sameSite: 'none'. 
    // We'll use Lax which is fine for same-origin.
    return cookie.serialize('auth_token', token, {
        httpOnly: true,
        secure: true, // Always true since we are on HTTPS
        sameSite: 'lax',
        maxAge: options.maxAge !== undefined ? options.maxAge : 60 * 60 * 24 * 7,
        path: '/',
    });
};

export const parseTokenFromReq = (req: NextApiRequest) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    return cookies.auth_token;
};
