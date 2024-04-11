import * as dotenv from "dotenv";
import express, { Express, Request, Response} from "express";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8008;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});