#! /usr/bin/env node
require('ts-node').register(
    Object.assign(
      {
        ignore: [/\.js/],
      },
      require('./tsconfig.json'),
    ),
  );

require('./index.ts');