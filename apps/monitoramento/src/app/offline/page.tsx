import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline',
};

export default function OfflinePage() {
  return (
    <main>
      <h1>Você está offline</h1>
      <p>Por favor, verifique sua conexão com a internet.</p>
    </main>
  );
}
