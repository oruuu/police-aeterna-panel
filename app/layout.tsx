import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Aeterna Police Management System', description: 'Panel kepolisian roleplay Indonesia.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}
