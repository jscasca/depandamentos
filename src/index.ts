import * as dotenv from "dotenv";

// Make sure env variables are loaded before importing anything that uses them
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import express, { Express, Request, Response} from "express";
import bodyParser, { BodyParser } from "body-parser";
// import * as fileUpload from 'express-fileupload';
import setRoutes from "./routes";
import multer from "multer";

const mongoURI = process.env.NODE_ENV === 'dev' ?
  (process.env.MONGO_TEST || 'mongodb://localhost:27017/test') :
  (process.env.MONGO_DB || 'mongodb://localhost:27017/prod')

const app: Express = express();
const port = process.env.PORT || 8008;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Secure using helmet defaults
// app.use(helmet());

app.use(jsonParser);
app.use(urlencodedParser);

// const corsDefault = process.env.NODE_ENV === 'dev' ? {
//   // origin: 'https://app.domain'
//   origin: '*'
// } : {
//   origin: ''
// };

const corsDefault = {
  origin: ['http://localhost:3000', 'https://encasaportal.goosemate.com']
};
app.use(cors(corsDefault));

// Set all routes
setRoutes(app);

mongoose.connect(mongoURI).then(() => {
  console.log('Connected to db ', mongoURI);
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}).catch((e) => {
  console.error('Failed to connect to DB', e);
  process.exit(1)
});

process.on('SIGINT', () => {
  console.log('closing gracefully');
  process.exit(0);
});