#!/usr/bin/env node
// Validates every process YAML file against schemas/process.schema.json.
// Intended for `npm run validate:processes` and CI.
//
// Exit code 0 = all files valid.
// Exit code 1 = one or more files have schema errors (or loader errors).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SCHEMA_PATH = join(REPO_ROOT, 'schemas', 'process.schema.json');

const DEFAULT_TARGETS = [
  'nextjs_space/data/processes',
  'nextjs_space/__tests__/fixtures',
];

// Files inside targets that should be skipped (e.g. purposely invalid fixtures).
const SKIP_BASENAMES = new Set(['invalid-yaml.yaml']);

const color = {
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
};

function loadSchema() {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(color.red(`Schema not found: ${SCHEMA_PATH}`));
    process.exit(1);
  }
  return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
}

function collectYamlFiles(targets) {
  const files = [];
  for (const target of targets) {
    const abs = resolve(REPO_ROOT, target);
    if (!existsSync(abs)) {
      console.warn(color.yellow(`Skipping missing path: ${target}`));
      continue;
    }
    const stat = statSync(abs);
    if (stat.isFile()) {
      if (/\.ya?ml$/i.test(abs) && !SKIP_BASENAMES.has(basename(abs))) files.push(abs);
      continue;
    }
    if (stat.isDirectory()) {
      for (const name of readdirSync(abs)) {
        if (!/\.ya?ml$/i.test(name)) continue;
        if (SKIP_BASENAMES.has(name)) continue;
        files.push(join(abs, name));
      }
    }
  }
  return files.sort();
}

function basename(p) {
  return p.split(/[\\/]/).pop() ?? p;
}

function formatErrors(errors) {
  return errors
    .map((err) => {
      const loc = err.instancePath || '/';
      const detail =
        err.keyword === 'additionalProperties'
          ? ` (unexpected "${err.params?.additionalProperty}")`
          : err.keyword === 'enum'
          ? ` (allowed: ${JSON.stringify(err.params?.allowedValues)})`
          : err.keyword === 'pattern'
          ? ` (pattern: ${err.params?.pattern})`
          : '';
      return `    ${color.dim('at')} ${color.cyan(loc)} — ${err.message}${detail}`;
    })
    .join('\n');
}

function main() {
  const cliTargets = process.argv.slice(2);
  const targets = cliTargets.length > 0 ? cliTargets : DEFAULT_TARGETS;

  const schema = loadSchema();
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const files = collectYamlFiles(targets);
  if (files.length === 0) {
    console.warn(color.yellow('No YAML files found to validate.'));
    process.exit(0);
  }

  console.log(color.cyan(`Validating ${files.length} process YAML file(s) against ${relative(REPO_ROOT, SCHEMA_PATH)}...`));

  let failed = 0;
  for (const file of files) {
    const rel = relative(REPO_ROOT, file);
    let data;
    try {
      data = yaml.load(readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`${color.red('FAIL')} ${rel}`);
      console.error(`    YAML parse error: ${err.message}`);
      failed++;
      continue;
    }

    const ok = validate(data);
    if (ok) {
      console.log(`${color.green('PASS')} ${rel}`);
    } else {
      failed++;
      console.log(`${color.red('FAIL')} ${rel}`);
      console.log(formatErrors(validate.errors ?? []));
    }
  }

  const total = files.length;
  const passed = total - failed;
  console.log('');
  console.log(
    failed === 0
      ? color.green(`All ${total} file(s) passed.`)
      : color.red(`${failed} of ${total} file(s) FAILED (${passed} passed).`),
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
