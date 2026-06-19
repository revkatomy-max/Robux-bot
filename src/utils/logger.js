const levels = { info: '🔵', warn: '🟡', error: '🔴', debug: '⚪' };

function log(level, ...args) {
  const time = new Date().toLocaleTimeString('id-ID');
  console.log(`[${time}] ${levels[level] || '⚪'} [${level.toUpperCase()}]`, ...args);
}

export const logger = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
  debug: (...args) => log('debug', ...args),
};
