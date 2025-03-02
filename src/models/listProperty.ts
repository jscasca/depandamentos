import mongoose, { model, Schema } from "mongoose";

const listPropertySchema = new Schema({
  name: { type: String },
  sku: { type: String },
  // indexing by listing
  forSale: { type: Boolean },
  forRent: { type: Boolean },
  // location
  address: { type: String },
  postal_address: { type: String, unique: true },
  street: { type: String }, // Calle
  exterior: { type: String }, // Numero exterior
  building: { type: String }, // Edificio
  interior: { type: String }, // Interior
  suburb: { type: String }, // Colonia
  municipality: { type: String }, // Delegacion o municipio
  city: { type: String }, // Ciudad
  province: { type: String },
  zip: { type: String }, // CP codigo postal
  lat: { type: Number },
  lng: { type: Number },
  glink: { type: String }, // Link google maps
  // features
  property: { type: String},
  sqft: { type: Number },
  rooms: { type: Number },
  bathrooms: { type: Number },
  parking: { type: Number },
  parktype: { type: String },
  furnished: { type: String }, // igual y se quita?
  features: [], // cualrquier otra caracterisstica en tag
  // images
  coverimage: { type: String },
  pictures: [],
  // development
  development: { type: String }, // Nombre del edifcio
  showroom: { type: Boolean },
  totalunits: { type: Number },
  notes: { type: String },
  duedate: { type: Date },
  antiq: { type: Date },
  // amenities
  amenities: []
  // metrics
  // other
}, { timestamps: true });

export interface IListProperty {
  name: string;
  sku: string;
  address: string;
  postal_address: string;
  street: string;
  exterior: string;
  building: string;
  interior: string;
  suburb: string; // Colonia
  municipality: string; // Delegacion
  city: string; // Ciudad
  province: string; // Estado
  zip: string; // Codigo Postal
  lat: number;
  lng: number;
  glink: string;
  development: string;
  property: string;
}

export const ListProperty = model<IListProperty>("list_property", listPropertySchema);