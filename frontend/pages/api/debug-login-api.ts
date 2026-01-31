// pages/api/debug-login.ts
// DEBUG API - Check everything before login
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('🔍 Starting debug check...');

    const checks: any = {
        environment: {
            JWT_SECRET: !!process.env.JWT_SECRET,
            NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
            DATABASE_URL: !!process.env.DATABASE_URL,
            NODE_ENV: process.env.NODE_ENV,
        },
        cookies: {
            hasCookieHeader: !!req.headers.cookie,
            presentCookies: req.headers.cookie ? Object.keys(require('cookie').parse(req.headers.cookie)) : [],
            authTokenFound: false,
            tokenDecodable: false,
            tokenVerified: false,
            decodedPayload: null as any,
            error: null as any
        },
        imports: {
            canImportDb: false,
            canImportAuth: false,
        },
        database: {
            canConnect: false,
            usersTableExists: false,
            userCount: 0
        }
    };

    // Check cookies
    try {
        const cookie = require('cookie');
        const cookies = cookie.parse(req.headers.cookie || '');
        if (cookies.auth_token) {
            checks.cookies.authTokenFound = true;
            const jwt = require('jsonwebtoken');
            try {
                // Peek inside without verification
                const decoded = jwt.decode(cookies.auth_token);
                if (decoded) {
                    checks.cookies.tokenDecodable = true;
                    checks.cookies.decodedPayload = decoded;
                }

                // Try to verify
                const { verifyToken } = await import('@/lib/auth');
                const verified = verifyToken(cookies.auth_token);
                if (verified) {
                    checks.cookies.tokenVerified = true;
                }
            } catch (err: any) {
                checks.cookies.error = err.message;
            }
        }
    } catch (err: any) {
        checks.cookies.error = `Cookie parsing error: ${err.message}`;
    }

    // Check if we can import db
    try {
        const { query } = await import('@/lib/db');
        checks.imports.canImportDb = true;

        const result = await query('SELECT NOW()');
        checks.database.canConnect = true;

        const usersResult = await query('SELECT COUNT(*) as count FROM users');
        checks.database.usersTableExists = true;
        checks.database.userCount = parseInt(usersResult.rows[0].count);
    } catch (err: any) {
        checks.database.error = err.message;
    }

    // Check if we can import auth
    try {
        const { signToken } = await import('@/lib/auth');
        checks.imports.canImportAuth = true;
    } catch (err: any) {
        checks.imports.authError = err.message;
    }

    const allGood =
        checks.environment.JWT_SECRET &&
        checks.database.canConnect &&
        checks.database.usersTableExists &&
        (checks.cookies.authTokenFound ? checks.cookies.tokenVerified : true);

    return res.status(allGood ? 200 : 500).json({
        status: allGood ? '✅ Checks passed' : '❌ Some checks failed',
        checks,
        advice: [
            !checks.environment.JWT_SECRET && 'URGENT: Add JWT_SECRET to Vercel environment variables immediately.',
            checks.cookies.hasCookieHeader && !checks.cookies.authTokenFound && 'Cookie header found but auth_token is missing. Browser might be blocking it.',
            checks.cookies.authTokenFound && !checks.cookies.tokenVerified && 'Auth token found but verification failed. Secret mismatch?',
            !checks.database.canConnect && 'Database connection failed. Check DATABASE_URL.'
        ].filter(Boolean)
    });
}
