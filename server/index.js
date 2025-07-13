import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';

import connectDB from './config/connectDB.js';

const app = express();

// middleware
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URI,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// connection to DB
connectDB().then(() => {
  // run server
  app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
});
