export type Json = string | number | boolean | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export function parseJson(_text: string): Json {
  throw new Error('not implemented');
}
