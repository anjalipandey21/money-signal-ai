import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoneySignal AI",
  description: "Institutional-grade financial intelligence workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorBackground: "#0d121f",
              colorPrimary: "#adc6ff",
              borderRadius: "0.5rem",
            },
            elements: {
              card:
                "border border-[#424754] bg-[#0d121f] text-[#e0e2ed] shadow-2xl shadow-black/30",
              headerTitle: "!text-[#f8fafc]",
              headerSubtitle: "!text-[#c2c6d6]",
              dividerText: "!text-[#c2c6d6]",
              formFieldLabel: "!text-[#c2c6d6]",
              formButtonPrimary:
                "bg-[#adc6ff] font-semibold !text-[#002e6a] hover:bg-[#d8e2ff]",
              formFieldInput:
                "border-[#cbd5e1] !bg-white !text-[#111827] placeholder:!text-[#64748b] focus:border-[#adc6ff]",
              socialButtonsBlockButtonText: "!text-[#e0e2ed]",
              footerActionText: "!text-[#c2c6d6]",
              footerActionLink: "!text-[#adc6ff] hover:!text-[#d8e2ff]",
              alertText: "!text-[#e0e2ed]",
              formFieldErrorText: "!text-[#ffb4ab]",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
