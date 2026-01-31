import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';
import { parseTokenFromReq, verifyToken } from '@/lib/auth';
// @ts-ignore
if (typeof global.DOMMatrix === 'undefined') {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix { };
}
// @ts-ignore
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

// IMPORTANT: Disable Next.js body parsing so formidable can handle the file stream
export const config = {
  api: {
    bodyParser: false,
  },
};

const allowedMime = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

async function parseForm(req: NextApiRequest) {
  const form = formidable({
    maxFileSize: MAX_SIZE,
    keepExtensions: true,
    multiples: false
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Authenticate User
    const token = parseTokenFromReq(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyToken(token);
    if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token' });

    // 2. Parse File
    const { files } = await parseForm(req);
    const file = (Array.isArray(files.cv_file) ? files.cv_file[0] : files.cv_file) as any;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // 3. Read File Content
    // @ts-ignore - 'filepath' is standard in new formidable, 'path' in old
    const filePath = file.filepath || file.path;
    const fileContent = fs.readFileSync(filePath);

    // @ts-ignore
    const originalName = file.originalFilename || file.name || 'cv.pdf';
    const mimeType = file.mimetype || 'application/pdf';

    // 4. Extract Text for AI processing
    let cvText = '';
    try {
      if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
        const pdfData = await pdf(fileContent);
        cvText = pdfData.text;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        originalName.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer: fileContent });
        cvText = result.value;
      } else {
        cvText = fileContent.toString('utf-8');
      }
    } catch (extractErr) {
      console.error('Text extraction failed during upload:', extractErr);
    }

    // 5. Save to Database (PostgreSQL BYTEA)
    const cvRes = await query(
      `INSERT INTO cv_files (user_id, filename, mime_type, file_content, uploaded_at, is_current) 
       VALUES ($1, $2, $3, $4, NOW(), true) 
       RETURNING id`,
      [payload.id, originalName, mimeType, fileContent]
    );

    const cvId = cvRes.rows[0].id;
    const cvUrl = `/api/user/cv/${cvId}`;

    // 6. Update User Profile with new CV Link and Text
    await query(
      'UPDATE users SET cv_url = $1, cv_text = $2, cv_uploaded_at = NOW() WHERE id = $3::integer',
      [cvUrl, cvText, payload.id]
    );

    return res.status(200).json({
      success: true,
      cvUrl,
      cvId,
      filename: originalName
    });

  } catch (err) {
    console.error('CV upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}