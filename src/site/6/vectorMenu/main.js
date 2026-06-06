function generateUrlArray(urlTemplate) {
  // 1) 找到扩展名
  const extMatch = urlTemplate.match(/(\.[^.]+)$/);
  if (!extMatch) {
    throw new Error('无法从URL中提取文件扩展名');
  }
  const extension = extMatch[1]; // 如 ".jpg"

  // 2) 在扩展名前的部分找出最后一个数字串
  const basePart = urlTemplate.slice(0, -extension.length);
  const digitSeq = basePart.match(/\d+/g);
  if (!digitSeq || digitSeq.length === 0) {
    throw new Error('无法在扩展名前找到数字序列');
  }
  const lastNumStr = digitSeq[digitSeq.length - 1]; // 最后一个数字串，如 "121"
  const targetNum = parseInt(lastNumStr, 10);

  // 3) 找到最后一个数字串的位置
  const startIndex = basePart.lastIndexOf(lastNumStr);
  const endIndex = startIndex + lastNumStr.length;

  // 4) 分离前缀、后缀
  const prefix = basePart.substring(0, startIndex);
  const suffix = basePart.substring(endIndex); // 如 " (", ")", 等

  // 5) 生成 URL 数组
  const urlArray = [];
  for (let i = 0; i <= targetNum; i++) {
    urlArray.push(`${prefix}${i}${suffix}${extension}`);
  }

  return urlArray;
}

// 使用示例
const inputUrl = 'https://msn.cn/static/images/2025/03/08/织 121P/1 (121).jpg';
const result = generateUrlArray(inputUrl);

console.log(`总共生成 ${result.length} 个URL`);
console.log('第一个:', result[0]);
console.log('最后一个:', result[result.length - 1]);
