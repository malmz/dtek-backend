import { dotenv, pg } from '../deps.ts';
import { News } from './news.ts';

dotenv.config({ export: true });

const globalPool = new pg.Pool(
  {
    tls: {
      caCertificates: [
        await Deno.readTextFile(
          new URL('../prod-ca-2021.crt', import.meta.url)
        ),
      ],
    },
  },
  3,
  true
);

export class Db {
  #pool: pg.Pool;
  constructor(pool: pg.Pool) {
    this.#pool = pool;
  }

  async init() {
    const conn = await this.#pool.connect();
    //const sql = conn.queryObject;
    try {
      await conn.queryObject`
        CREATE TABLE IF NOT EXISTS posts (
          id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          title text NOT NULL,
          body text NOT NULL,
          published timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
          place text,
          startDate timestamp with time zone,
          endDate timestamp with time zone
        )
      `;
    } finally {
      conn.release();
    }
  }

  async fetchNews(): Promise<News[]> {
    const conn = await this.#pool.connect();

    try {
      const result = await conn.queryObject<News>`SELECT * FROM posts`;
      console.log('result', result.rows);

      return result.rows;
    } finally {
      conn.release();
    }
  }

  async createNews(news: News): Promise<void> {
    const conn = await this.#pool.connect();

    try {
      await conn.queryObject`
        INSERT INTO posts (title, body, place, startDate, endDate)
        VALUES (${news.title}, ${news.body}, ${news.place}, ${news.startDate}, ${news.endDate})
      `;
    } finally {
      conn.release();
    }
  }
}

export const db = new Db(globalPool);