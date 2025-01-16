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
  fields?: {},
  clear?: {},
  add?: {},
  remove?: {}
};
export const ParseUpdate = (userUpdates: UserUpdates) => {
  return {
    $set: {},
    $push: {},
    $pull: {}
  }
}