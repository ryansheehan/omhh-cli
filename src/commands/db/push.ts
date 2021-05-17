import { Command, flags } from '@oclif/command'
import { user, password, cms } from '../../flags';
import { resolve } from 'path';
import { login, uploadNutrients, openDB, Nutrient } from '../../cms';

export default class DbPush extends Command {
  static description = 'process a sqlite file and push the contents to the cms';

  static examples = [
    `$ omhh db push food.sqlite3`,
  ];

  static args = [
    {
      name: 'db',
      description: 'file path of the nutritional db sqlite3 file',
      required: true,
    }
  ];

  static flags = {
    cms: cms(),
    user: user(),
    password: password(),

    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args, flags } = this.parse(DbPush);
    const { db: dbFile } = args;
    const { cms, user, password } = flags;

    const dbPath = resolve(dbFile);
    this.log(`db: ${dbPath}`);
    this.log(`cms: ${cms}`);
    this.log(`user: ${user}`);
    this.log(`password: ${password}`);

    const db = await openDB(dbPath);
    const nutrients = await db.all<Nutrient[]>(`SELECT * FROM nutrient`);
    this.log(`nutrients: ${JSON.stringify(nutrients)}`);

    const token = await login(cms as string, { identifier: user as string, password: password as string });
    this.log(`token: ${token}`);

    const res = await uploadNutrients(nutrients, cms as string, token);
    this.log(`res: ${res}`);
  }
}
