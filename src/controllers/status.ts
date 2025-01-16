import { Request, Response} from "express";
import { Clerk } from "../models/clerk";

export function getStatus(req: Request, res: Response) {
  res.send('Active server');
}

export async function testDatabase(req: Request, res: Response) {
  const users = await Clerk.find({}, null, {limit: 3});
  console.log(users);
  res.send(users);
}