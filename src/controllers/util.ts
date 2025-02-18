import ShortUniqueId from "short-unique-id";

const { randomUUID } = new ShortUniqueId({ length: 10 });

export const getShortId = () => {
  return randomUUID();
};

export interface Result<T> {
  data?: T;
  error?: ResultError;
}
export interface ResultError {
  status: number;
  error: string;
}

export const ParseFilters = (userFilter: any) => {
  return userFilter ? userFilter : {};
}

export const ParseSorting = (userSorting: any) => {
  return userSorting ? userSorting : { _id: 1 };
}

export const ParseProjection = (userProjection: any) => {
  return userProjection ? userProjection : { __v: 0 };
};

type UserUpdates = {
  update?: [],
  delete?: [],
  add?: [],
  remove?: []
};

const parseUpdate = (values: Record<string, any>[], vFn = (v: any) => v) => {
  const obj: Record<string, any> = {};
  // values.forEach(({field, value}) => {
  for (const [key, value] of Object.entries(values)) {
    obj[key] = value;
  };
  return obj;
};

export const ParseUpdate = (userUpdates: UserUpdates) => {
  if (!userUpdates) return {};
  const toSet = userUpdates?.update ? { $set: parseUpdate(userUpdates.update)} : {};
  const toUnset = userUpdates?.delete ? { $unset: parseUpdate(userUpdates.delete)} : {};
  const toPush = userUpdates?.add ? { $push: parseUpdate(userUpdates.add)} : {};
  const toPull = userUpdates?.remove ? { $pull: parseUpdate(userUpdates.remove)} : {};
  return {
    ...toSet,
    ...toUnset,
    ...toPush,
    ...toPull
  }
}