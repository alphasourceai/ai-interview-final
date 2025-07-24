import express from 'express';
import multer from 'multer';
import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import uploadRouter from './routes/upload.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

initializeApp({ storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com` });

app.use('/upload-resume', upload.single('resume'), uploadRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
