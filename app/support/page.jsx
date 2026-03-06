export const metadata = {
  title: 'MyoBound Support'
};

export default function SupportPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>MyoBound Support</h1>
      <p>Need help with MyoBound beta?</p>
      <ul>
        <li>Email: support@myobound.app</li>
        <li>Response time: 1-2 business days</li>
      </ul>
      <h2>Common Issues</h2>
      <p>If sounds or haptics are not active, confirm your in-app settings and device permissions.</p>
      <p>If needed, export a backup before resetting app data.</p>
    </main>
  );
}
