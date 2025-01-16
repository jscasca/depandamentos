import { Request, Response} from "express";
import Ajv from 'ajv';
import { ISaleListing, SaleListing, validateSchemaFields } from "../models/saleListing";
import { Result, ResultError } from "./util";
import { IListDevelopment, ListDevelopment } from "../models/listDevelopment";
import { NetworkManager } from "aws-sdk";
import { HydratedDocument } from "mongoose";

const ajv = new Ajv({removeAdditional: true});

const listingValidation = {};

const parseFilters = (userFilters: any) => {
  // validate user filters
  // return userFilters;
  console.log(userFilters);
  return userFilters ? userFilters : {};
};

const parseSorting = (userSort: any): { [key: string]: any} => {
  // validate userSort: price up | price down
  if (userSort) {
    const toSort = userSort.split(':');
    if (toSort.length === 2) {
      return { [toSort[0]]: toSort[1] }
    }
  }
  return { _id: 1 };
};

export async function getAllListings(req: Request, res: Response) {
  //
  const { filters, sorting, size } = req.body;
  const pageSize = size ? size : 10;
  try {
    const listings = await SaleListing.find(parseFilters(filters)).sort(parseSorting(sorting)).limit(pageSize);
    res.send({data: listings});
  } catch (e) {
    res.status(500).send('Failure to run query');
  }
}

export async function getListing(req: Request, res: Response) {
  const listingId = req.params.id;
  try {
    const listing = await SaleListing.findById(listingId);
    res.send({ data: listing });
  } catch (e) {
    res.status(500).send('Failure to run query');
  }
}

export async function newListing(req: Request, res: Response) {
  // Save new listing
  const listing = req.body.listing;
  const isValid = ajv.validate(listingValidation, listing);
  if (!isValid) {
    // console.log instead
    res.status(400).send(ajv.errorsText());
    return;
  }
  try {
    const saved = await SaleListing.create(listing);
    res.send(saved);
  } catch(e) {
    res.status(400).send();
    return;
  }
}

export async function updateListing(req: Request, res: Response) {
  // Update existing listing
  // const listing: ISaleListing = req.body;
  console.log('Updating listing');
  const id = req.params.id;
  const rawUpdates = req.body.updates;
  const validUpdates = validateSchemaFields(rawUpdates);
  const updates = {
    $set: validUpdates,
    $currentDate: { updatedAt: true }
  };
  try {
    const updated = await SaleListing.findByIdAndUpdate(id, updates, {new: true});
    res.send(updated);
  } catch (e) {
    res.status(400);
  }
  res.status(400);
};

const newListingImage = async (listingId: string) => {
  // get listing
  // const listing = await Listing
  // send image to backblazer or aws
  // update listing with img url
  // return updated listing
};

export function updateListingImage(req: Request, res: Response) {
  const id = req.params.id;
  const user = (req as any).user;
  newListingImage(id).then().catch((e) => {
    res.status(400).send(e.message);
  });
  res.send();
};

interface Address {
  property: string;
  name: string;
  street: string;
  exterior: string;
  building?: string;
  interior?: string;
  suburb: string;
  municipality?: string;
  city: string;
  province: string;
  zip: string;
  lat?: number;
  lng?: number;
  link?: string;
}

const gettingComplexes = async (filters: any, limit: number) => {
  try {
  const complexes = await ListDevelopment.find(filters).limit(limit).sort({ _id: 1 });
  return { data: complexes };
  } catch(e) {
    return {error: { status: 400, error: (e as Error).message}};
  }
};

const getComplexFilters = (last: any, filter: any) => {
  let filters = {};
  if (last) {
    filters = {...filters, ...{ _id: { $gt: last }}}
  }
  if (filter) {
    filters = {...filters, ...{name: { '$regex': filter, '$options': 'i'}}}
  }
  return filters;
};

export const getComplexes = (req: Request, res: Response) => {
  const { limit, last, filter } = req.body; // filters and so
  // get filters from body
  const filters = getComplexFilters(last, filter);
  gettingComplexes(filters, limit).then((r) => {

  }).catch((e) => {
    res.status(500).send();
  });
}

const saveComplex = async (listing: HydratedDocument<ISaleListing>): Promise<any> => {
  const devComplex = await ListDevelopment.findOne({ address: listing.address});
  if (devComplex == null) {
    // update with new listing
    const newComplex: IListDevelopment = {
      name: listing.name,
      address: listing.address,
      street: listing.location.street,
      exterior: listing.location.exterior,
      suburb: listing.location.suburb,
      municipality: listing.location.municipality,
      city: listing.location.city,
      province: listing.location.province,
      zip: listing.location.zip,
      lat: listing.location.lat,
      lng: listing.location.lng,
      link: listing.location.link,
      listings: [ listing._id ]
    };
    ListDevelopment.create(newComplex);
  } else {
    // save a new one
    ListDevelopment.findByIdAndUpdate(devComplex._id, { $push: { listings: listing._id }});
  }
};

const getAddress = (address: Address) => {
  const optMunicipality = address.municipality ? `, ${address.municipality}` : '';
  return `${address.street} ${address.exterior}, ${address.suburb}${optMunicipality}, ${address.zip}, ${address.city}, ${address.province}`;
};

const getPostalAddress = (address: Address) => {
  const optMunicipality = address.municipality ? `, ${address.municipality}` : '';
  const optInner = ((address.building || address.interior) ? ',' : '') + (address.building ? ` ${address.building}` : '') + (address.interior ? ` ${address.interior}` : '');
  return `${address.street} ${address.exterior}${optInner}, ${address.suburb}${optMunicipality}, ${address.zip}, ${address.city}, ${address.province}`;
};

const saveNewAddress = async (newAddress: Address): Promise<Result<any>> => {
  // search by name or postal address?
  const newListingValues = {
    postal_address: getPostalAddress(newAddress),
    address: getAddress(newAddress),
    name: newAddress.name,
    location: {
      street: newAddress.street,
      exterior: newAddress.exterior,
      building: newAddress.building,
      interior: newAddress.interior,
      suburb: newAddress.suburb,
      municipality: newAddress.municipality,
      city: newAddress.city,
      province: newAddress.province,
      zip: newAddress.zip,
      lat: newAddress.lat,
      lng: newAddress.lng,
      link: newAddress.link
    }
  };
  try {
    const newListing = await SaleListing.create(newListingValues);
    console.log('saved: ', newListing);
    saveComplex(newListing);
    return { data: newListing };
  } catch (e: unknown) {
    return { error: {
      status: 400,
      error: 'Failed: ' + (e as Error).message
    } }
  }
};

export function newListingFullAddress(req: Request, res: Response) {
  const user = (req as any).user; // Log the user adding stuff?
  console.log('adding address by user:', user);
  // const { name, password } = req.body;
  const body = req.body;

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      // postal_address: {type: 'string'},
      // address: {type: 'string'},
      property: {type: 'string'},
      name: {type: 'string'},
      street: {type: 'string'},
      exterior: {type: 'string'},
      building: {type: 'string'},
      interior: {type: 'string'},
      suburb: {type: 'string'},
      municipality: {type: 'string'},
      city: {type: 'string'},
      province: {type: 'string'},
      zip: {type: 'string'},
      lat: {type: 'number'},
      lng: { type: 'number' },
      link: {type: 'string'}
    },
    required: [ 'street', 'exterior', 'suburb', 'city', 'province', 'zip', 'property' ],
  };
  // validate body
  console.log('validating: ', body);
  const valid = ajv.validate(schema, body);
  if (!valid) {
    console.log(ajv.errors);
    res.status(400).send('Invalid body');
    return;
  }
  saveNewAddress(body as Address).then((r) => {
    if (r.error) {
      res.status(r.error.status).send(r.error.error);
    }
    res.send(r.data);
  }).catch((e) => {
    res.status(500).send();
  }); 
  // res.status(400).send('TBD: under construction');

}