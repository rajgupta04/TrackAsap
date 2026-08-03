import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createLogger, format, transports } from 'winston';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Ensure logs directory exists ────────────────────────────────────────────
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── Chalk color map per log level ───────────────────────────────────────────
const levelColors = {
  error: (t) => chalk.bold.red(t),
  warn:  (t) => chalk.bold.yellow(t),
  info:  (t) => chalk.bold.cyan(t),
  http:  (t) => chalk.bold.green(t),
  debug: (t) => chalk.bold.magenta(t),
};

// ── Custom console format with Chalk ────────────────────────────────────────
const consoleFormat = format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const colorFn = levelColors[level] || ((t) => chalk.white(t));
  const ts       = chalk.dim(`[${timestamp}]`);
  const lvl      = colorFn(`[${level.toUpperCase().padEnd(5)}]`);

  let metaStr = '';
  // Only print meta JSON for debug, warn, or error levels (keeps info/http clean)
  if (level === 'error' || level === 'warn' || level === 'debug') {
    const cleaned = Object.fromEntries(
      Object.entries(meta).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    if (Object.keys(cleaned).length > 0) {
      metaStr = chalk.dim(`\n    ↳ ${JSON.stringify(cleaned)}`);
    }
  }

  // If it's an error with a stack, append it dimmed
  const stackStr = stack ? `\n${chalk.dim(stack)}` : '';

  return `${ts} ${lvl} ${message}${metaStr}${stackStr}`;
});

// ── Winston Logger ───────────────────────────────────────────────────────────
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'http',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
  ),
  transports: [
    // ── Console: Chalk-colored, human-readable ──────────────────────────
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: 'HH:mm:ss' }),
        consoleFormat,
      ),
    }),

    // ── File: JSON structured — all levels ──────────────────────────────
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),

    // ── File: errors only ────────────────────────────────────────────────
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// ── Morgan stream — pipes HTTP logs into Winston at 'http' level ─────────────
logger.morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
