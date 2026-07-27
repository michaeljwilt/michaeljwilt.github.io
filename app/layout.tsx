import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// variable axis (wght 300–700) enables the kinetic-type hover on the hero
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Michael Wilt — dbt Teardowns for Data Teams',
  description:
    'Analytics engineer helping teams fix slow, expensive, and fragile dbt projects — and get their data AI-ready. One-week teardowns, fixed price, prioritized fix list.',
  openGraph: {
    title: 'Michael Wilt — dbt Teardowns',
    description:
      'One-week teardowns of dbt projects. Find out what your models really cost and what is going to break next.',
    type: 'website',
    url: 'https://michaelwilt.online',
  },
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Michael Wilt',
  jobTitle: 'Analytics Engineer',
  email: 'mailto:michaeljwilt@outlook.com',
  url: 'https://michaelwilt.online',
  sameAs: [
    'https://github.com/michaeljwilt',
    'https://www.linkedin.com/in/michaeljwilt/',
    'https://public.tableau.com/app/profile/michaeljwilt',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'Brilliant Disruptions',
    url: 'https://brilliantdisruptions.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
