import { flags } from '@oclif/command';

export const user = flags.build({
  char: 'u',
  description: 'username for authentication with the api',
  required: true,
  env: 'OMHH_CMS_USER',
});

export const password = flags.build({
  char: 'p',
  description: 'password for authentication with the api',
  required: true,
  env: 'OMHH_CMS_PASSWORD',
});

export const cms = flags.build({
  description: 'url of the omhh-cms api',
  required: true,
  env: 'OMHH_CMS_URL',
});
