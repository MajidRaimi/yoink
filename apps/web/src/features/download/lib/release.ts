export const fileNameFromUrl = (url: string): string => url.slice(url.lastIndexOf("/") + 1);

const isHttpsUrl = (url: string): url is `https://${string}` => url.startsWith("https://");

export const toDownloadHref = (url: string, fallback: `https://${string}`): `https://${string}` =>
  isHttpsUrl(url) ? url : fallback;
