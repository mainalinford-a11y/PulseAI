import { NextApiRequest, NextApiResponse } from 'next';
import { createAuthCookie } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    // Clear cookie by setting maxAge=0
    const cookie = createAuthCookie('', { maxAge: 0 });
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });
}
