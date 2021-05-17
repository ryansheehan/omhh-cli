import axios from 'axios';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export type JWT = string;
export interface Credential {
  identifier: string;
  password: string;
}
interface User {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    role: {
      id: number;
      name: string;
      description: string;
      type: string;
    };
    created_at: string;
    updated_at: string;
  }
}

export interface Nutrient {
  id: number;
  name: string;
  unit_name: string;
  nutrient_id: number;
}


export async function login(host: string, credential: Credential) {
  const res = await axios.post<User>(`${host}/auth/local`, credential);
  return res.data.jwt as JWT;
}

export async function cmsPost<T = any>(data: T, url: string, token: JWT) {
  const res = await axios.post(url, data, { headers: { 'Authorization': `Bearer ${token}` } });
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  return true;
}

export async function cmsGet<T = any>(url: string, token: JWT) {
  const res = await axios.get<T>(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  return res.data;
}

export async function openDB(filename: string) {
  return open({ filename, mode: sqlite3.OPEN_READONLY, driver: sqlite3.cached.Database });
}

export async function uploadNutrients(nutrients: Nutrient[], host: string, token: JWT) {
  const url = `${host}/nutrients`;
  return cmsPost(nutrients, url, token);
}

export async function fetchNutrients(host: string, token: JWT) {
  const url = `${host}/nutrients`;
  return cmsGet(url, token);
}
