import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { DynamicallySharedLayout } from "@/components/layouts";
import { OnboardingPopover } from "@/components/onboarding-popover";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bud.app"),
  title: {
    default: "Bud - Supercharge Your Financial Insights",
    template: "%s | Bud",
  },
  description:
    "Supercharge your financial insights with powerful budget analytics. Track expenses, manage budgets, and achieve your financial goals with real-time tracking, category insights, and smart alerts.",
  keywords: [
    "budget tracker",
    "expense tracking",
    "financial analytics",
    "budget management",
    "personal finance",
    "money management",
    "budget app",
    "expense manager",
    "financial planning",
    "budget analytics",
  ],
  authors: [{ name: "Bud" }],
  creator: "Bud",
  publisher: "Bud",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Bud",
    title: "Bud - Supercharge Your Financial Insights",
    description:
      "Supercharge your financial insights with powerful budget analytics. Track expenses, manage budgets, and achieve your financial goals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bud - Budget Tracking and Financial Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bud - Supercharge Your Financial Insights",
    description:
      "Supercharge your financial insights with powerful budget analytics. Track expenses, manage budgets, and achieve your financial goals.",
    images: ["/og-image.png"],
    creator: "@budapp",
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
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DynamicallySharedLayout>{children}</DynamicallySharedLayout>
          <OnboardingPopover />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
