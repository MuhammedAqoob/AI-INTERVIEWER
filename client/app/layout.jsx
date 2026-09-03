import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';

export const metadata = {
  title: 'AI Interviewer',
  description: 'AI Interviewer Portfolio Project',
};

// Inline bootstrap: apply the saved (or system) theme before the first paint so the
// page never flashes from light to dark after hydration. Runs synchronously while the
// HTML is parsed, before React hydrates. ThemeProvider later re-applies the same
// class from the same source, so the two always agree.
const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var t=s==='light'||s==='dark'?s:'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen transition-colors duration-200">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
