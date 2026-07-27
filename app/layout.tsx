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
  title: 'Michael Wilt — Builder, Data Guy, Dad',
  description:
    'Michael Wilt builds websites, dashboards, and AI-powered tools. Data analyst turned AI-first builder. Husband, father, archer.',
  openGraph: {
    title: 'Michael Wilt',
    description: 'I build useful things with data, code, and AI.',
    type: 'website',
    url: 'https://michaelwilt.online',
  },
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Michael Wilt',
  jobTitle: 'Data Analyst & AI-First Builder',
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
