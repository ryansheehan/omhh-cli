import { Command, flags } from '@oclif/command'
import { cli } from 'cli-ux';
import { user, password, cms } from '../../flags';
import { resolve } from 'path';
import { login, openDB, strapiFoodGenerator, uploadFoods } from '../../cms';

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
      default: 50,
      required: false,
    }),

    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args, flags } = this.parse(DbPush);
    const { db: dbFile } = args;
    const { cms, user, password, batch } = flags;

    const dbPath = resolve(dbFile);

    try {
      console.log(`processing ${dbPath}`)
      const db = await openDB(dbPath);

      const token = await login(cms as string, { identifier: user as string, password: password as string });

      const foodProgressBar = cli.progress({
        format: 'Processing Foods: [{bar}] {percentage}% | errors: {errors} | created: {created} | updated: {updated} | skipped: {skipped}',
        hideCursor: true,
      })

      let createdFoods = 0;
      let updatedFoods = 0;
      let skippedFoods = 0;
      const foodUploadErrors: string[] = [];

      const { count: foodCount, generator } = await strapiFoodGenerator(db, batch);
      console.log(`found ${foodCount} foods`);
      let processedFoods = 0;
      foodProgressBar.start(foodCount, 0, {
        percentage: 0,
        errors: 0,
        created: 0,
        updated: 0,
        skipped: 0,
      });


      for await (const strapiFoods of generator()) {
        const { created, updated, skipped, errors } = await uploadFoods(strapiFoods, cms as string, token);
        createdFoods += created.length;
        updatedFoods += updated.length;
        skippedFoods += skipped;
        processedFoods += created.length + updated.length + skipped + errors.length;
        foodUploadErrors.concat(errors);
        foodProgressBar.update(processedFoods, {
          percentage: Math.round(processedFoods / foodCount),
          errors: foodUploadErrors.length,
          created: createdFoods,
          updated: updatedFoods,
          skipped: skippedFoods,
        });
      }

      foodProgressBar.stop();
    } catch (error) {
      console.log(error)
    }
  }
}
