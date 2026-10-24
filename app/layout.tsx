import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const viewport: Viewport = {
  themeColor: "#08080b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ahadanimates.com"),
  title: "Ahad Animates | 3D Animation & Product Visualization",
  description:
    "Explore 3D product visualization, luxury fragrance animation, and cinematic CGI advertising by Abdul Ahad, founder of Ahad Animates in Islamabad, Pakistan.",
  keywords: [
    "3D Product Visualization",
    "CGI Advertising",
    "3D Animation",
    "Blender 3D",
    "Product Renders",
    "Abdul Ahad",
    "Ahad Animates",
  ],
  authors: [{ name: "Abdul Ahad", url: "https://people.connectedpakistan.pk/abdul-ahad" }],
  creator: "Abdul Ahad",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ahadanimates.com",
    siteName: "Ahad Animates",
    title: "Ahad Animates | 3D Animation & Product Visualization",
    description:
      "Premium 3D product visualization, luxury fragrance animation, and cinematic CGI advertising by Abdul Ahad in Islamabad, Pakistan.",
    images: [
      {
        url: "/og-image.jpg",
        width: 800,
        height: 1000,
        alt: "Ahad Animates 3D Product Visualization Render",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ahad Animates | 3D Animation & Product Visualization",
    description:
      "3D product visualization, luxury fragrance animation, and CGI advertising by Ahad Animates.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#08080b] text-white">
        {children}
      </body>
    </html>
  );
}
