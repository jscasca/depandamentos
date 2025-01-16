import { Request, Response} from "express";
import { Clerk, IClerk } from "../models/clerk";
import { RefreshToken, IRefreshToken } from "../models/refreshToken";
import bcrypt from "bcrypt";
import { default as jwt } from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';
import { TOKEN_KEY, verifyToken } from "../middleware/auth";

const REFRESH_EXPIRE = 60 * 60 * 24 * 15; // 2 Week expiration
const TOKEN_EXPIRATION = '45m'; // JWT expiration time '5m'

interface IAuth {
  id: string;
  name: string;
  token: string;
  refresh: string;
}

const getLoginClerk = async (name: string, pass: string) => {
  const clerk = await Clerk.findOne({name});
  if (!clerk) { throw new Error("No clerk on DB");}
  const valid = await bcrypt.compare(pass, clerk.password);
  if (!valid) { throw new Error("User or password do not match");}
  const signedClerk = await signInClerk(clerk);
  return signedClerk;
};

const signInClerk = async (clerk: IClerk) => {
  const refresh = await createRefreshToken(clerk._id?.toString() as string, 'clerk');
  const token = jwt.sign({
    id: clerk._id?.toString() as string,
    name: clerk.name,
    type: 'clerk'
  }, TOKEN_KEY, { expiresIn: TOKEN_EXPIRATION});
  const authClerk: IAuth = {
    id: clerk.id?.toString(),
    name: clerk.name,
    token,
    refresh: refresh.token,
  };
  return authClerk;
};

const createRefreshToken = async (id: string, type: string) => {
  const expiry = (new Date()).setSeconds(new Date().getSeconds() + REFRESH_EXPIRE);
  const token = uuidv4();
  const refreshToken = await RefreshToken.create({
    token,
    expiry,
    id,
    type,
  });
  return refreshToken;
};

export function loginClerk(req: Request, res: Response) {
  console.log(req.body);
  const { name, password } = req.body;
  getLoginClerk(name, password).then((auth) => {
    res.status(200).send(auth);
  }).catch((e) => {
    res.status(401).send(e.message);
  });
};

export function loginUser(req: Request, res: Response) {
  res.status(501);
}

export function registerClerk(req: Request, res: Response) {
  res.status(501);
}

export function registerUser(req: Request, res: Response) {
  res.status(501);
};

function verifyExpirationDate(token: IRefreshToken): boolean {
  // console.log('verifying refresh token expiration: ', token.expiry.getTime(), new Date().getTime());
  return token.expiry.getTime() > new Date().getTime();
}

const refreshUserAsync = async (id: string, token: string) => {
  //
};

const refreshClerkAsync = async (id: string, token: string) => {
  const found = await RefreshToken.findOne({id, token});
  if (!found || !verifyExpirationDate(found)) {
    throw new Error('Failed');
  }
  await RefreshToken.findByIdAndDelete(found._id);
  const clerk = await Clerk.findById(id);
  if (!clerk) {
    throw new Error('Failed');
  }
  const signedIn = await signInClerk(clerk);
  return signedIn;
};

export function refreshUser(req: Request, res: Response) {
  const { id, token} = req.body;
  refreshUserAsync(id, token).then((u: any) => {
    //
  }).catch((e) => {
    res.status(400).send(e.message);
  });
};

export function refreshClerk(req: Request, res: Response) {
  const { id, token} = req.body;
  refreshClerkAsync(id, token).then((auth: any) => {
    return res.json(auth);
  }).catch((e) => {
    res.status(400).send(e.message);
  });
};