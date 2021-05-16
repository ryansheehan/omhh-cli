import { Command, flags } from '@oclif/command'
import { user, password, cms } from '../../flags';

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
    const { db } = args;
    const { cms, user, password } = flags;

    this.log(`db: ${db}`);
    this.log(`cms: ${cms}`);
    this.log(`user: ${user}`);
    this.log(`password: ${password}`);
  }
}
