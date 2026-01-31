import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Simple health check that doesn't expose secrets
    const checks = {
        nodeEnv: process.env.NODE_ENV || 'not set',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set',
    };

    return res.status(200).json(checks);
}
