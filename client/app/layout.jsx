import './globals.css';

export const metadata = {
  title: 'AI Interviewer',
  description: 'AI Interviewer Portfolio Project',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
