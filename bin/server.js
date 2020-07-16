#! /usr/bin/env node
require('ts-node').register(
    Object.assign(
      {
        ignore: [/\.js/],
      },
    ),
  );

require('./index.ts');