/**
 * Generate JSON Schema from Zod schema for IDE autocomplete
 */
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ConfigSchema } from '../src/schema/config.ts';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonSchema = zodToJsonSchema(ConfigSchema, {
  name: 'WaConfig',
  target: 'jsonSchema7',
  $refStrategy: 'none',
});

// Add $schema for IDE support
const schemaWithMeta = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'open-wa Configuration',
  description: 'Configuration schema for @open-wa/config (wa.config.json)',
  ...jsonSchema,
};

const outputPath = path.join(__dirname, '..', 'schema.json');
fs.writeFileSync(outputPath, JSON.stringify(schemaWithMeta, null, 2));

console.log(`Generated JSON Schema at ${outputPath}`);
