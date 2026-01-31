import { neon } from '@neondatabase/serverless';

// This creates a connection using the URL from your Environment Variables
const sql = neon(process.env.DATABASE_URL!);

export const query = async (text: string, params: any[] = []) => {
    try {
        // We execute the query. Neon returns the rows directly as an array.
        const result = await sql(text, params);

        // We return it in the { rows: [] } format so your API calls don't break.
        return { rows: Array.isArray(result) ? result : [result] };
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};