omhh-cli
========

cli utility for pushing data to omhh-cms

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/omhh-cli.svg)](https://npmjs.org/package/omhh-cli)
[![Downloads/week](https://img.shields.io/npm/dw/omhh-cli.svg)](https://npmjs.org/package/omhh-cli)
[![License](https://img.shields.io/npm/l/omhh-cli.svg)](https://github.com/ryansheehan/https://github.com/ryansheehan/omhh-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g omhh-cli
$ omhh COMMAND
running command...
$ omhh (-v|--version|version)
omhh-cli/0.0.1 linux-x64 node-v14.15.4
$ omhh --help [COMMAND]
USAGE
  $ omhh COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`omhh db:push DB`](#omhh-dbpush-db)
* [`omhh hello [FILE]`](#omhh-hello-file)
* [`omhh help [COMMAND]`](#omhh-help-command)

## `omhh db:push DB`

process a sqlite file and push the contents to the cms

```
USAGE
  $ omhh db:push DB

ARGUMENTS
  DB  file path of the nutritional db sqlite3 file

OPTIONS
  -c, --chunkSize=chunkSize  [default: 10] chunk size for an upload batch
  -h, --help                 show CLI help
  -p, --password=password    (required) password for authentication with the api
  -u, --user=user            (required) username for authentication with the api
  --cms=cms                  (required) url of the omhh-cms api

EXAMPLE
  $ omhh db push food.sqlite3
```

_See code: [src/commands/db/push.ts](https://github.com/ryansheehan/omhh-cli/blob/v0.0.1/src/commands/db/push.ts)_

## `omhh hello [FILE]`

describe the command here

```
USAGE
  $ omhh hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ omhh hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/ryansheehan/omhh-cli/blob/v0.0.1/src/commands/hello.ts)_

## `omhh help [COMMAND]`

display help for omhh

```
USAGE
  $ omhh help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_
<!-- commandsstop -->
