function generateUrlArray(urlTemplate) {
  // 1) 找到扩展名
  const extMatch = urlTemplate.match(/(\.\w+)$/);
  if (!extMatch) {
    throw new Error('找不到文件扩展名');
  }
  
  const extension = extMatch[1]; // .jpg
  const urlWithoutExt = urlTemplate.slice(0, -extension.length); // 去掉扩展名
  
  // 2) 提取最后的数字
  const numMatch = urlWithoutExt.match(/(\d+)([^/]*)$/);
  if (!numMatch) {
    throw new Error('找不到数字');
  }
  
  const targetNum = parseInt(numMatch[1]);
  const suffix = numMatch[2]; // 数字后的部分，如 ")"
  const baseUrl = urlWithoutExt.slice(0, -numMatch[0].length); // 去掉数字和后缀
  
  // 3) 生成URL数组
  const urlArray = [];
  for (let i = 0; i <= targetNum; i++) {
    urlArray.push(`${baseUrl}${i}${suffix}${extension}`);
  }
  
  return urlArray;
}

// 使用示例
const inputUrl = 'https://msn.cn/static/images/2025/03/08/织 121P/1 (121).jpg';
const result = generateUrlArray(inputUrl);

console.log(`总共生成 ${result.length} 个URL`);
console.log('第一个:', result[0]);
console.log('最后一个:', result[result.length - 1]);
