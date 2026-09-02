/**
 * Две сборки из одного кода:
 *
 *   npm run build         — обычное приложение Next с сервером:
 *                           API сохранения расчётов, режим менеджера на cookie,
 *                           скидочная сетка не покидает сервер.
 *
 *   npm run build:static  — статический экспорт для GitHub Pages:
 *                           серверных частей нет, расчёт кодируется в самой ссылке,
 *                           страница менеджера и скидочная сетка в сборку не попадают.
 *
 * Серверные файлы называются page.node.tsx / route.node.ts и подключаются
 * через pageExtensions только в обычной сборке.
 */

const isStatic = process.env.STATIC_EXPORT === '1';
const basePath = process.env.BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  pageExtensions: isStatic ? ['tsx', 'ts'] : ['node.tsx', 'node.ts', 'tsx', 'ts'],
  ...(isStatic
    ? {
        output: 'export',
        trailingSlash: true,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        env: {
          NEXT_PUBLIC_STATIC: '1',
          NEXT_PUBLIC_BASE_PATH: basePath,
        },
      }
    : {}),
};

export default nextConfig;
