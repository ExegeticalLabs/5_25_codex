import './globals.css';

export const metadata = {
  title: 'MyoBound',
  description: 'Systematic Adaptation. Precision Training.'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
