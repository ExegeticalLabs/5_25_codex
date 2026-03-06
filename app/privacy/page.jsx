export const metadata = {
  title: 'MyoBound Privacy Policy'
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>Privacy Policy</h1>
      <p>Effective date: March 5, 2026</p>
      <p>
        MyoBound stores workout data locally on your device. In the current beta, the app does not create user accounts,
        does not sync data to a remote server, and does not use third-party analytics or ad tracking SDKs.
      </p>
      <h2>Data You Control</h2>
      <p>
        You can export your local data as a JSON backup file and import it again on your device. You can also reset all app
        data from within the app.
      </p>
      <h2>Contact</h2>
      <p>For privacy questions, contact: support@myobound.app</p>
    </main>
  );
}
