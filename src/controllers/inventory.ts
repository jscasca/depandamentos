import { Request, Response} from "express";
import { IListDevelopment, ListDevelopment } from "../models/listDevelopment";
import { getShortId, ParseFilters, ParseProjection, ParseSorting, ParseUpdate } from "./util";
import { IListProperty, ListProperty } from "../models/listProperty";
import busboy from 'busboy';
import B2 from 'backblaze-b2';

import Ajv from 'ajv';
import { HydratedDocument } from "mongoose";

const ajv = new Ajv({removeAdditional: true});

const b2 = new B2({
  applicationKeyId: process.env.STORAGE_KEYID || '',
  applicationKey: process.env.STORAGE_KEY || '',
});

const getSizeNum = (n: any, fallback = 10) => {
  return Number.isNaN(n) ? fallback : Number(n);
};

export async function getDevelopments(req: Request, res: Response) {
  //
  const {filters, sorting, size, projection } = req.query;
  const pageSize = getSizeNum(size, 20);

  try {
    const [total, developments] = await Promise.all([
      ListDevelopment.countDocuments({}),
      ListDevelopment.find(ParseFilters(filters), ParseProjection(projection)).sort(ParseSorting(sorting)).limit(pageSize)
    ]);
    // const developments = await ListDevelopment.find(ParseFilters(filters), ParseProjection(projection)).sort(ParseSorting(sorting)).limit(pageSize);
    res.send({data: developments, total: total});
  } catch(e) {
    res.status(500).send('Failure to run query');
  }
}

export async function getDevelopment(req: Request, res: Response) {
  const developmentId = req.params.id;
  const { projection } = req.query;

  try {
    const development = await ListDevelopment.findById(developmentId).populate({ path: 'listings', select: 'name address location.street features.rooms'});
    res.send({ data: development });
  } catch (e) {
    console.error(e);
    res.status(500).send('Failure to run query');
  }
}

export async function getProperty(req: Request, res: Response) {
  const propertyId = req.params.id;
  const { projection } = req.query;

  try {
    const property = await ListProperty.findById(propertyId);
    res.send({ data: property });
  } catch (e) {
    console.error(e);
    res.status(500).send('Failure to run query');
  }
}

export async function getProperties(req: Request, res: Response) {
  const {filters, sorting, size, projection } = req.query;
  const pageSize = getSizeNum(size, 20);

  try {
    const [total, properties] = await Promise.all([
      ListProperty.countDocuments({}),
      ListProperty.find(ParseFilters(filters), ParseProjection(projection)).sort(ParseSorting(sorting)).limit(pageSize)
    ]);
    res.send({data: properties, total: total});
  } catch(e) {
    res.status(500).send('Failure to run query');
  }
};

const propertyValidation = {
  type: 'object',
  additionalProperties: false,
  properties: {
    property: {type: 'string'},
    development: {type: 'string'},
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
  required: [
    'street',
    'exterior',
    'suburb',
    'city',
    'province',
    'zip',
    'property'
  ]
};

type Address = {
  property: string; // CASA/DEPTO
  development: string;
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

const getUnitName = (address: Address) => {
  if (address.property === 'DEPTO') {
    return address.development + (address.building ? ` ${address.building}` : '') + ' ' + address.interior;
  } else {
    return address.street + ' ' + address.exterior;
  }
};

async function updateDevelopmentWithProperty(property: HydratedDocument<IListProperty>) {
  console.log('updating development for: ', property);
  const existingDevelopment = await ListDevelopment.findOne({ address: property.address });
  console.log('existing: ', existingDevelopment);
  if (existingDevelopment === null) {
    // make a new one
    const development: IListDevelopment = {
      name: property.development,
      address: property.address,
      street: property.street,
      exterior: property.exterior,
      suburb: property.suburb,
      municipality: property.municipality,
      city: property.city,
      province: property.province,
      zip: property.zip,
      lat: property.lat,
      lng: property.lng,
      link: property.glink,
      listings: [ property._id ]
    };
    ListDevelopment.create(development);
    console.log('created new one');
  } else {
    // push into existing
    console.log('updating push');
    ListDevelopment.findByIdAndUpdate(existingDevelopment._id, { $push: {listings: property._id}});
  }
};

async function addNewProperty(address: Address) {
  // check for development with same name
  const newProperty = {
    name: getUnitName(address),
    address: getAddress(address),
    postal_address: getPostalAddress(address),
    street: address.street,
    exterior: address.exterior,
    building: address.building,
    interior: address.interior,
    suburb: address.suburb,
    municipality: address.municipality,
    city: address.city,
    province: address.province,
    zip: address.zip,
    lat: address.lat,
    lng: address.lng,
    glink: address.link,
    property: address.property
  };
  try {
    const property = await ListProperty.create(newProperty);
    updateDevelopmentWithProperty(property);
    return { data: property };
  } catch (e) {
    if ((e as any).code === 11000) {
      // TODO: Update field value
      return {status: 400, error: `Duplicate field`}
    }
    return { error: 'Failed to save new element', status: 500}
  }
}

export async function putProperty(req: Request, res: Response) {
  const user = (req as any).user; // TODO: Log user
  const body = req.body;

  const validation = ajv.validate(propertyValidation, body);
  if (!validation) {
    res.status(400).send('Invalid form data');
  } else {
    try {
      const saveProperty = await addNewProperty(body);
      if (saveProperty.error) {
        res.status(saveProperty.status).send(saveProperty.error);
      } else {
        res.send(saveProperty);
      }
    } catch (e) {
      // TODO: log error
      res.status(500).send('Failed to save proeprty');
    }
  }
};

export async function updateProperty(req: Request, res: Response) {
  const propertyId = req.params.id;
  const data = req.body;
  // validate body?
  console.log(data);
  const updates = ParseUpdate(data);
  console.log(updates);
  if (Object.keys(updates).length === 0) {
    return res.status(400).send('Missing parameters');
  }
  try {
    const updated = await ListProperty.findByIdAndUpdate(propertyId, updates, { new: true });
    console.log(updated);
    res.send({ data: updated });
  } catch (e) {
    res.status(500).send('Failed to update property');
  }
};

const getImageMimeTypes = (): string[] => {
  return [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
};

const getImageExtension = (mimetype: string): string => {
  return {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp'
  }[mimetype] || '';
};

const addPropertyImage = async (propertyId: string, imageUrl: string, res: Response) => {
  const updates = {$push: { pictures: imageUrl}};
  const opts = { new: true };
  try {
    const updated = await ListProperty.findByIdAndUpdate(propertyId, updates, opts);
    res.send({data: updated});
  } catch (e) {
    res.status(500).send('Failed to update property')
  };
};

// TODO: Update this fn
export async function imageUpload(req: Request, res: Response) {
  const propertyId = req.params.id;
  const bb = busboy({ headers: req.headers });

  let isDone = false;
  let isError = false;
  let isFinished = false;
  let finishedFile: any = undefined;

  function finished(output: any) {
    console.log('Is finished, prepare for B2');
    if (isDone) return;
    isDone = true;
    if (output.error) {
      console.log('Upload encountered error');
      return res.status(output.status || 500).send(output.error);
    } else {
      b2Upload(finishedFile).then((b2result) => {
        console.log('b2 uploaded: ', b2result);
        // save image into propertyId
        if (b2result.error) {
          console.log('error from b2 fn');
          res.status(500).send({ error: b2result.error });
        } else {
          // const picUrl = '';
          // ListProperty.findByIdAndUpdate(propertyId, { $push: { 'pictures': picUrl}});
          console.log('uploaded!!! ', b2result);
          const imageUrl = "https://images.goosemate.com/" + b2result.data;
          addPropertyImage(propertyId, imageUrl as string, res);
        }
      }).catch((err) => {
        console.log('Failed to b2upload: ', err);
        return res.status(500).json({ error: err });
      });
    }
  };
  function finishOut() {
    console.log('Checking if finish is ready');
    if (isFinished && finishedFile !== undefined) finished({ data: finishedFile });
  };
  function errorOut(errorMsg: string) {
    console.log('Checking for error');
    if (isError) return;
    isError = true;
    finished({ error: 'Failed: ' + errorMsg});
  };

  // only care about the first file
  console.log('Setting the file upload');
  bb.on('file', (name, file, info) => {
    //
    const { filename, encoding, mimeType } = info;
    console.log('checking imme types: ', mimeType);
    if (!getImageMimeTypes().includes(mimeType)) {
      errorOut('Incorrect file type: ' + mimeType);
    }
    const ext = getImageExtension(mimeType);
    const uploadName = propertyId + '-' + getShortId() + `.${ext}`;
    // TODO: filter by mimeType?
    let buffers: any = [];
    let size = 0;
    console.log('Uploading file: ', name);
    file.on('data', (data) => {
      console.log('Adding data: ', data.length);
      buffers.push(data);
      size += data.length;
    });
    file.on('error', (err) => {
      console.log('error: ', err);
      errorOut('Failed to load file');
    });
    file.on('end', () => {
      console.log('End for file: ', filename);
      const buffer = Buffer.concat(buffers);
      finishedFile = {
        data: buffer,
        fileName: uploadName,
        mimeType,
        contentLength: size
      };
      finishOut();
    });
  });
  bb.on('finish', () => {
    console.log('Finished busboy...');
    isFinished = true;
    finishOut();
  });
  bb.on('error', (err) => {
    console.error('Encoutenred error on bb: ', err);
    return res.status(500).json({ error: 'Failed to upload form'});
  });
  console.log('Pipe busboy....');
  req.pipe(bb);
}

interface uploadFile {
  fileName: string;
  contentLength: number;
  mimeType: string;
  data: any
};

async function b2Upload(file: uploadFile) {
  console.log('Uploading to b2: ', file);
  try {
    await b2.authorize();
    console.log('b2 authorized');
    const bucketId = process.env.STORAGE_BUCKET || '4c9ddc182b16286e9107011a';
    const uploadUrl = await b2.getUploadUrl({ bucketId });
    console.log('upload url: ', uploadUrl.data);
    const upload = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: "images/" + file.fileName,
      contentLength: file.contentLength,
      mime: file.mimeType,
      data: file.data
    });
    console.log('uploaded: ', upload.data);
    return { data: file.fileName };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to upload to b2'};
  }
}

// TODO: explore sharp() for image editing https://github.com/lovell/sharp
// TODO: make clean utility
export async function cleanInventory(req: Request, res: Response) {
  // const devs = await ListDevelopment.find({});
  // console.log('desarrollos: ', devs);
  // for (const dev of devs) {
  //   console.log('cleaning: ', dev);
  //   await ListDevelopment.findByIdAndUpdate(dev._id, {$pull: {'listings': dev.listings[0]}})
  // }
};