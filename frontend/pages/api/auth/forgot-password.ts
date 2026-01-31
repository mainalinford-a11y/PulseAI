import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import crypto from 'crypto';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Check if user exists
        const userRes = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (userRes.rows.length === 0) {
            // Return success even if email not found to prevent user enumeration
            return res.status(200).json({ success: true });
        }

        const userId = userRes.rows[0].id;

        // 2. Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now

        // 3. Save to DB
        await query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetToken, expiry, userId]
        );

        // 4. Send email (placeholder logic)
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

        // Log for debugging (remove in production)
        console.log(`Password reset requested for ${email}. Link: ${resetUrl}`);

        // TODO: Use an email provider like Postmark, SendGrid, or Resend
        // await sendEmail({
        //   to: email,
        //   subject: 'Reset your PulseAI password',
        //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
        // });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
