import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { openApiDocument } from '../src/docs/openapi.js';

const outputPath = resolve(process.cwd(), 'openapi.json');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');

console.log(`OpenAPI exported to ${outputPath}`);
