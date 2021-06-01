import axios from 'axios';
import * as sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

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
}

export interface Food {
  fdc_id: number;
  data_type: string;
  description: string;
}

export interface FoodNutrient {
  fdc_id: number;
  nutrient_id: number;
  amount: number;
}

export interface StrapiFoodNutrient {
  amount: number,
  nutrient: number;
}

export interface StrapiFood {
  fdc_id: number,
  description: string;
  source: string;
  nutrients: StrapiFoodNutrient[];
}

export interface StrapiNutrient {
  id: number;
  nutrient_id: number;
  name: string;
  unit_name: string;
}

export interface PostNutrientResponse {
  created: StrapiNutrient[];
  updated: StrapiNutrient[];
}

export interface PostFoodProfile {
  total: number,
  validation: number,
  findExisting: number,
  findNew: number,
  updated: number,
  created: number,
}

export interface PostFoodsResponse {
  created: StrapiFood[];
  updated: StrapiFood[];
  skipped: number;
  errors: string[];
  profile: PostFoodProfile;
}


export async function login(host: string, credential: Credential) {
  const res = await axios.post<User>(`${host}/auth/local`, credential);
  return res.data.jwt as JWT;
}

export async function cmsPost<R, T = any>(data: T, url: string, token: JWT) {
  const res = await axios.post<R>(url, data, { headers: { 'Authorization': `Bearer ${token}` } });
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  return res.data;
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
  return cmsPost<PostNutrientResponse>(nutrients, url, token);
}

export async function fetchNutrients(host: string, token: JWT) {
  const url = `${host}/nutrients`;
  return cmsGet<StrapiNutrient[]>(url, token);
}

export async function uploadFoods(foods: StrapiFood[], host: string, token: JWT) {
  const url = `${host}/foods`;
  return cmsPost<PostFoodsResponse>(foods, url, token);
}

export async function strapiFoodGenerator(db: Database<sqlite3.Database, sqlite3.Statement>, nutrientDict: Record<number, number>, chunkSize = 10) {
  const countQuery = await db.get<{ count: number }>('SELECT COUNT(fdc_id) as count FROM food');
  const foodCount = countQuery?.count || 0;
  const chunks = Math.floor(foodCount / chunkSize);
  const lastChunkSize = foodCount - (chunks * chunkSize);
  const foodChunks = [...new Array(chunks)].map(() => chunkSize).concat([lastChunkSize]).map((limit, i) => ({
    limit,
    offset: i * chunkSize
  }));

  const generator = async function* () {
    for await (const { limit, offset } of foodChunks) {
      const foods: StrapiFood[] = [];

      const foodData = await db.all<Food[]>(`
        SELECT * FROM food
        ORDER BY fdc_id
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      for await (const { fdc_id, description, data_type: source } of foodData) {
        const foodNutrients = await db.all<StrapiFoodNutrient[]>(`
          SELECT nutrient_id as nutrient, amount FROM food_nutrient
          WHERE fdc_id = ${fdc_id}
        `);

        const strapiFood: StrapiFood = {
          fdc_id,
          description,
          source,
          nutrients: foodNutrients.map(({ amount, nutrient }) => ({ amount, nutrient: nutrientDict[nutrient] }))
        };

        foods.push(strapiFood);
      }

      yield foods;
    }
  };

  return {
    count: foodCount,
    generator
  };
}
