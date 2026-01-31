import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { query } from '@/lib/db';
// @ts-ignore
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  } as any;
}
// @ts-ignore
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D { } as any;
}
// @ts-ignore
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData { } as any;
}
// @ts-ignore
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data: any = await new Promise((resolve, reject) => {
      const form = formidable({});
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = data;
    let cvText = fields.cv_text?.[0] || '';

    // Extract text from file if provided
    const cvFile = files.cv_file?.[0];
    if (cvFile) {
      try {
        const buffer = fs.readFileSync(cvFile.filepath);
        if (cvFile.mimetype === 'application/pdf' || cvFile.originalFilename?.endsWith('.pdf')) {
          const pdfData = await pdf(buffer);
          cvText = pdfData.text;
        } else if (
          cvFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          cvFile.originalFilename?.endsWith('.docx')
        ) {
          const result = await mammoth.extractRawText({ buffer });
          cvText = result.value;
        } else {
          // Fallback for text files
          cvText = buffer.toString('utf-8');
        }
      } catch (err) {
        console.error('Text extraction failed:', err);
        // Continue but with empty/partial text, or throw?
        // We'll throw so the user knows
        throw new Error('Failed to extract text from CV file. Please paste text directly.');
      }
    }

    // If still no CV text, try to fetch from DB using email
    if (!cvText && fields.email?.[0]) {
      try {
        const userRes = await query('SELECT cv_text FROM users WHERE email = $1', [fields.email[0]]);
        if (userRes.rows.length > 0 && userRes.rows[0].cv_text) {
          cvText = userRes.rows[0].cv_text;
        }
      } catch (dbErr) {
        console.error('Failed to fetch CV text from DB:', dbErr);
      }
    }

    if (!cvText || cvText.length < 50) {
      return res.status(400).json({ success: false, error: 'CV content is too short or missing. Please upload a CV first.' });
    }

    // Forward to n8n as JSON
    const payload = {
      job_title: fields.job_title?.[0] || '',
      location: fields.location?.[0] || '',
      email: fields.email?.[0] || '',
      name: fields.name?.[0] || '',
      cv_text: cvText,
      // Debug/Testing flags
      use_pinned: process.env.USE_PINNED_APIFY_DATA === 'true',
      pinned_dataset_id: process.env.APIFY_PINNED_DATASET_ID
    };

    let n8nResponse;
    try {
      let targetUrl = process.env.N8N_WEBHOOK_URL!;
      const isTestMode = fields.test_mode?.[0] === 'true';

      if (isTestMode) {
        // Automatically switch to n8n test URL
        targetUrl = targetUrl.replace('/webhook/', '/webhook-test/');
        console.log('🧪 RUNNING IN TEST MODE (N8N)');
      }

      console.log('Triggering n8n at:', targetUrl);
      n8nResponse = await fetch(targetUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
      });
    } catch (fetchErr: any) {
      console.error('n8n Fetch Critical Failure:', fetchErr);
      throw new Error(`Connection to AI Agent failed: ${fetchErr.message}. Is your n8n/ngrok running?`);
    }

    if (!n8nResponse.ok) {
      const contentType = n8nResponse.headers.get('content-type');
      let errorDetail = '';
      if (contentType && contentType.includes('application/json')) {
        const errJson = await n8nResponse.json();
        errorDetail = JSON.stringify(errJson);
      } else {
        errorDetail = await n8nResponse.text();
      }

      console.error('n8n Webhook Error Status:', n8nResponse.status);
      console.error('n8n Webhook Error Body:', errorDetail);
      throw new Error(`AI Agent responded with an error (${n8nResponse.status}). Please check your n8n logs.`);
    }

    const okData = await n8nResponse.json().catch(() => ({ success: true, message: 'N8N started' }));
    console.log('n8n Success Response:', okData);

    return res.status(200).json(okData);
  } catch (error: any) {
    console.error('Start-Matching API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}