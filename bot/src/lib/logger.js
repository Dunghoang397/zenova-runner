// ZENOVA SHOP - Logger
// In log mau ra terminal

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function ts() {
  return new Date().toLocaleTimeString('vi-VN');
}

export const logger = {
  info: (m) => console.log(C.dim + '[' + ts() + ']' + C.reset + ' ' + C.cyan + 'i' + C.reset + '  ' + m),
  ok:   (m) => console.log(C.dim + '[' + ts() + ']' + C.reset + ' ' + C.green + 'OK' + C.reset + ' ' + m),
  warn: (m) => console.log(C.dim + '[' + ts() + ']' + C.reset + ' ' + C.yellow + '!!' + C.reset + ' ' + m),
  err:  (m) => console.log(C.dim + '[' + ts() + ']' + C.reset + ' ' + C.red + 'XX' + C.reset + ' ' + m),
  cmd:  (m) => console.log(C.dim + '[' + ts() + ']' + C.reset + ' ' + C.magenta + '>>' + C.reset + ' ' + m),
  dbg:  (m) => process.env.DEBUG === 'true' && console.log(C.dim + '[' + ts() + ']' + C.reset + ' ' + C.blue + 'dbg' + C.reset + ' ' + m)
};