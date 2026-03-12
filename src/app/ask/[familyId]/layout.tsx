import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask a Question — Embers',
  description:
    'Help your loved one preserve their memories by asking a meaningful question.',
  openGraph: {
    title: 'Ask a Question — Embers',
    description:
      'Help your loved one preserve their memories by asking a meaningful question.',
    siteName: 'Embers',
    type: 'website',
  },
};

export default function AskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
