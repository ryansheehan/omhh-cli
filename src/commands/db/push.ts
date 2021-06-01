import { Command, flags } from '@oclif/command'
import { cli } from 'cli-ux';
import { user, password, cms } from '../../flags';
import { resolve } from 'path';
import { login, uploadNutrients, uploadFoods, openDB, strapiFoodGenerator, Nutrient } from '../../cms';

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

    batch: flags.integer({
      char: 'b',
      description: 'chunk size for an upload batch',
      default: 10,
      required: false,
    }),

    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args, flags } = this.parse(DbPush);
    const { db: dbFile } = args;
    const { cms, user, password, batch } = flags;

    const dbPath = resolve(dbFile);
    // this.log(`db: ${dbPath}`);
    // this.log(`cms: ${cms}`);
    // this.log(`user: ${user}`);
    // this.log(`password: ${password}`);

    const db = await openDB(dbPath);

    const token = await login(cms as string, { identifier: user as string, password: password as string });
    // this.log(`token: ${token}`);

    // const nutrients = await db.all<Nutrient[]>(`SELECT * FROM nutrient`);
    // // this.log(`nutrients: ${JSON.stringify(nutrients)}`);

    // const res = await uploadNutrients(nutrients, cms as string, token);
    // // this.log(`upload nutrients res: ${JSON.stringify(res)}`);

    this.log(`batch=${batch}`);

    const foodProgressBar = cli.progress({
      format: 'Processing Foods: [{bar}] {percentage}% | errors: {errors} | created: {created} | updated: {updated}',
      hideCursor: true,
    })

    let createdFoods = 0;
    let updatedFoods = 0;
    const foodUploadErrors: string[] = [];

    const { count: foodCount, generator } = await strapiFoodGenerator(db, batch);
    let processedFoods = 0;
    foodProgressBar.start(foodCount, 0, {
      percentage: 0,
      errors: 0,
      created: 0,
      updated: 0,
    });

    for await (const strapiFoods of generator()) {
      const { created, updated, errors } = await uploadFoods(strapiFoods, cms as string, token);
      createdFoods += created.length;
      updatedFoods += updated.length;
      processedFoods = strapiFoods.length;
      foodUploadErrors.concat(errors);
      foodProgressBar.update(strapiFoods.length, {
        percentage: Math.round(processedFoods / foodCount),
        errors: foodUploadErrors.length,
        created: createdFoods,
        updated: updatedFoods,
      });
    }

    foodProgressBar.stop();
  }
}
