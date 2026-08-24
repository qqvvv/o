const urlParse = {};
const data = {};

// 常见的二级后缀
data.secondLevelDomains = new Set([
  'com.cn', 'net.cn',
]);

urlParse.extractDecURLs = (text) => {
  const urlRegex = /\b((?:https?|ftp|file)(?:%3A%2F%2F|:\/\/)|(www|ftp)\.)(?:[A-Z0-9+&@#%\/%?=~_|$!:,.;-])*[A-Z0-9+&@#%=~_|$]/ig;
  return (text.match(urlRegex) || []).map(url => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  });
};

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

urlParse.trimQueryPara = (urlIn) => {
  const url = new URL(urlIn);
  return url.origin + url.pathname;
};

export { urlParse };
