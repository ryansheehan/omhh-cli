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

export async function post<T = any>(data: T, url: string, token: JWT) {
  await axios.post(url, data, { headers: { 'Authorization': `Bearer ${token}` } });
}

export async function uploadNutrients(nutrients: Nutrient[], host: string, token: JWT) {
  const url = `${host}/nutrients`;
  return post(nutrients, url, token);
}

export async function openDB(filename: string) {
  return open({ filename, mode: sqlite3.OPEN_READONLY, driver: sqlite3.cached.Database });
}
