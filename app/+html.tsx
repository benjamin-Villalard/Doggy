import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

const raw = process.env.EXPO_BASE_URL || '/';
const base = raw.endsWith('/') ? raw : `${raw}/`;

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, shrink-to-fit=no"
        />
        <meta name="description" content="Programme d'éducation et suivi santé d'un Yorkshire Terrier de 2 à 12 mois." />
        <meta name="theme-color" content="#6d3fd6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mon Yorkshire" />
        <link rel="manifest" href={`${base}manifest.json`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${base}pwa/icon-180.png`} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: bodyStyle }} />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const bodyStyle = `
html, body { background-color: #f6f4fb; }
body { overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }
* { -webkit-touch-callout: none; }
`;

const swRegister = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('${base}sw.js', { scope: '${base}' }).catch(function () {});
  });
}
`;
