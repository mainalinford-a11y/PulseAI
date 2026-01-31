import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { userId, jobTitle, location, minSalary } = req.body;

  try {
    const result = await query(
      `INSERT INTO job_searches (user_id, job_title, location, min_salary) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, jobTitle, location, minSalary]
    );

    return res.status(201).json({ message: 'Search created!', search: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Failed to create search' });
  }
}