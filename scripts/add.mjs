#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCliArgs, validateAndBuildLesson } from './add-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LESSONS_PATH = path.resolve(__dirname, '../src/data/lessons.json');

function readStdin() {
  if (process.stdin.isTTY) {
    return '';
  }
  return fs.readFileSync(0, 'utf8');
}

function main() {
  const { jsonInput, filePath, shouldPush } = parseCliArgs(process.argv.slice(2));

  let rawJson = jsonInput;
  if (!rawJson && filePath) {
    rawJson = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  }
  if (!rawJson) {
    rawJson = readStdin().trim();
  }

  if (!rawJson) {
    console.error(
      'Cách dùng: npm run add -- \'{"category":"ai","title":"...","summary":"...","points":["..."],"quiz":"...","answer":"..."}\' [--push]'
    );
    process.exit(1);
  }

  let parsedPayload;
  try {
    parsedPayload = JSON.parse(rawJson);
  } catch (err) {
    console.error(`Lỗi cú pháp JSON: ${err.message}`);
    process.exit(1);
  }

  const existingRaw = fs.readFileSync(LESSONS_PATH, 'utf8');
  const existingLessons = JSON.parse(existingRaw);

  let newLesson;
  try {
    newLesson = validateAndBuildLesson(parsedPayload, existingLessons);
  } catch (err) {
    console.error(`Dữ liệu không hợp lệ: ${err.message}`);
    process.exit(1);
  }

  const updatedLessons = [...existingLessons, newLesson];
  fs.writeFileSync(LESSONS_PATH, `${JSON.stringify(updatedLessons, null, 2)}\n`, 'utf8');

  console.log(
    `Đã thêm bài #${newLesson.id} [${newLesson.category}]: "${newLesson.title}" vào src/data/lessons.json`
  );

  if (shouldPush) {
    const repoRoot = path.resolve(__dirname, '..');
    const commitMessage = `docs: add ${newLesson.title}`;
    execFileSync('git', ['add', 'src/data/lessons.json'], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    execFileSync('git', ['commit', '-m', commitMessage], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    execFileSync('git', ['push', 'origin', 'main'], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    console.log('Đã đồng bộ lên GitHub (origin/main) để Vercel tự động rebuild.');
  }
}

main();
