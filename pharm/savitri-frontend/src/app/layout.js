import { Inter, Roboto_Mono } from "next/font/google";
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import CartFAB from '../components/CartFAB';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Savitri AI - Pharmacy Management",
  description: "AI-Powered Pharmacy Management and Medicine Finder",
  manifest: "/manifest.json",
  themeColor: "#1a2b6b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a2b6b" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
            <CartFAB />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

