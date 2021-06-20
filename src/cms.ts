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

export interface StrapiFood {
  fdc_id: number,
  description: string;
  source: string;
  nutrients: StrapiNutrient[];
  portions?: StrapiPortion[];
  brand?: StrapiBrand;
}

export interface StrapiNutrient {
  amount: number;
  name: string;
  unit_name: string;
}

export interface StrapiPortion {
  amount: number;
  unit: string;
  gram_weight: number;
  portion_description: string;
  modifier: string;
}

export interface StrapiBrand {
  brand_owner: string | null;
  brand_name: string | null;
  subbrand_name: string | null;
  serving_size: number;
  serving_size_unit: string;
  household_serving_fulltext: string;
}

export interface PostFoodsResponse {
  created: StrapiFood[];
  updated: StrapiFood[];
  skipped: number;
  errors: string[];
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
  console.log(`filename: ${filename}`);
  return open({ filename, mode: sqlite3.OPEN_READONLY, driver: sqlite3.cached.Database });
}

export async function uploadFoods(foods: StrapiFood[], host: string, token: JWT) {
  const url = `${host}/foods`;
  return cmsPost<PostFoodsResponse>(foods, url, token);
}

export async function strapiFoodGenerator(db: Database<sqlite3.Database, sqlite3.Statement>, chunkSize = 10) {
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

      const foodData = await db.all<Pick<StrapiFood, 'fdc_id' | 'description' | 'source'>[]>(`
        SELECT fdc_id, description, data_type AS source FROM food
        ORDER BY fdc_id
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      for await (const { fdc_id, description, source } of foodData) {

        // select all the nutrients
        const nutrients = await db.all<StrapiNutrient[]>(`
          SELECT fn.amount, n.name, n.unit_name
          FROM food_nutrient fn
          INNER JOIN nutrient n ON fn.nutrient_id = n.id
          WHERE fn.fdc_id = ${fdc_id}
        `);

        // select all portions
        const portions = await db.all<StrapiPortion[]>(`
          SELECT fp.amount, fp.portion_description, fp.modifier, fp.gram_weight, mu.name AS unit
          FROM food_portion fp
          INNER JOIN measure_unit mu ON fp.measure_unit_id = mu.id
          WHERE fp.fdc_id = ${fdc_id}
        `);

        let brand: StrapiBrand | undefined;
        if (source === 'branded_food') {
          brand = await db.get<StrapiBrand>(`
            SELECT brand_owner, brand_name, subbrand_name, serving_size, serving_size_unit, household_serving_fulltext
            FROM branded_food
            WHERE fdc_id = ${fdc_id}
          `);
        }

        const food: StrapiFood = {
          fdc_id, description, source,
          nutrients,
          portions,
          brand
        }

        foods.push(food);
      }

      yield foods;
    }
  };

  return {
    count: foodCount,
    generator
  };
}
