import { sealData, unsealData } from 'iron-session';

const SESSION_SECRET = process.env.SESSION_SECRET || 'temp-insecure-secret';

export async function createSession(email: string) {
    // Create sealed session data containing user email
    return await sealData({ email }, { password: SESSION_SECRET });
}

export async function getSession(cookie: string) {
    // Unseal session cookie to retrieve user data
    return await unsealData(cookie, { password: SESSION_SECRET });
}

// In login.ts
return res.status(200).json({
    user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
    }
});
