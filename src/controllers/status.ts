import { Request, Response} from "express";
import mongoose from "mongoose";

export function getStatus(req: Request, res: Response) {
  res.send('Active server');
}

export async function testDatabase(req: Request, res: Response) {
  const status = mongoose.connection.readyState;
  res.send(`${status}`);
}