const urlParse = {};
urlParse.getCoreDomain = (urlString) => {
  const url = new URL(urlString.startsWith('http') ? urlString : 'http://' + urlString);
  const hostname = url.hostname;
  const parts = hostname.split('.');

  if (parts.length <= 2) return hostname;

  // 检查是否是二级后缀
  const lastTwo = parts.slice(-2).join('.');
  if (data.secondLevelDomains.has(lastTwo)) {
    return parts.slice(-3).join('.');
  }

  return lastTwo;
};

urlParse.getFileName = (urlString) => {
  return new URL(urlString).pathname
    .split('/')
    .pop()
    .split('.')[0];
};

export {urlParse};
