export const getFileName = (urlString) => {
  const pathname = new URL(urlString).pathname;
  const fileName = pathname.split('/').pop().split('.')[0];
  return fileName;
};