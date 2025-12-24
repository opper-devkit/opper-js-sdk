const { flatSrc } = require('./flat-src');
const { withExt } = require('./with-ext');

const [pkgName] = process.argv.slice(2);

(async () => {
  await flatSrc(pkgName);
  // TODO 兼容 taro webpack5 compiler
  await withExt(pkgName);
})();
