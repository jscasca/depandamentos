import mongoose, { model, Schema } from "mongoose";

/**

 */

const listDevelopmentSchema = new Schema({
  name: { type: String },
  address: { type: String, unique: true },
  street: { type: String }, // Calle
  exterior: { type: String }, // Numero exterior
  suburb: { type: String }, // Colonia
  municipality: { type: String }, // Delegacion o municipio
  city: { type: String }, // Ciudad
  province: { type: String },
  zip: { type: String }, // CP codigo postal
  lat: { type: Number },
  lng: { type: Number },
  link: { type: String }, // Link google maps
  listings: [{ type: Schema.Types.ObjectId, ref: 'list_property'}]
}, { timestamps: true });

export interface IListDevelopment {
  name: string;
  street: string;
  exterior: string;
  suburb: string; // Colonia
  municipality: string; // Delegacion
  city: string; // Ciudad
  province: string; // Estado
  zip: string; // Codigo Postal
  lat: number;
  lng: number;
  link: string;
  address: string;
  listings: any[];
}

export const ListDevelopment = model<IListDevelopment>("list_development", listDevelopmentSchema);