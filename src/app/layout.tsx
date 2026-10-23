import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

export const metadata: Metadata = {
  title: 'SponsorDesk — College Fest Sponsorship CRM & AI Pitch Studio',
  description:
    'Every sponsor. Every follow-up. Under control. The complete B2B sponsorship workspace for college fest organizers, clubs, and student committees.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ToastProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
