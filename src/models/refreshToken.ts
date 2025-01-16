import mongoose, { model, Schema } from "mongoose";

export interface IRefreshToken extends mongoose.Document {
  token: string;
  expiry: Date;
  id: string;
  type: string;
};

export const ClerkSchema = new Schema({
  token: { type: String, required: true },
  expiry: { type: Date, required: true },
  id: { type: String, required: true },
  type: { type: String, required: true}
});

export const RefreshToken = model<IRefreshToken>("refreshToken", ClerkSchema);