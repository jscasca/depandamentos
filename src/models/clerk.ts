import mongoose, { model, Schema } from "mongoose";

export interface IClerk extends mongoose.Document {
  name: string;
  password: string;
};

export const ClerkSchema = new Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
});

// Mongoose will pluralize the name of the model for a colletion. To avoid pluralization pass 3rd arg
// model("clerk", ClerkSchema, "clerk")
export const Clerk = model<IClerk>("clerk", ClerkSchema);