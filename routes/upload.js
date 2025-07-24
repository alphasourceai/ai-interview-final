import { OpenAI } from 'openai';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import sgMail from '@sendgrid/mail';
import { Router } from 'express';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = getFirestore();
const bucket = getStorage().bucket();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { originalname, buffer } = req.file;
    const { candidateName = 'Unnamed Candidate' } = req.body;
    const filePath = `resumes/${Date.now()}-${originalname}`;

    await bucket.file(filePath).save(buffer);

    const prompt = `Analyze the following resume for job relevance. Respond with a brief summary and a score out of 100.\n\n${buffer.toString('utf8')}`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
    });

    const result = completion.choices[0].message.content;
    const docRef = db.collection('resumeAnalysis').doc();
    await docRef.set({ candidateName, filePath, result, analyzedAt: new Date().toISOString() });

    await sgMail.send({
      to: process.env.SENDER_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: `New Resume Uploaded - ${candidateName}`,
      text: result,
    });

    res.status(200).json({ success: true, message: 'Resume uploaded and analyzed', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
