import type {Metadata} from "next";
import "./globals.css";

export const metadata = {
	title: "The Pool",
	description: "Hi, I'm Seongeun. Welcome to my interactive developer portfolio with animations, canvas effects, and pixel transitions.",
	keywords: ["front-end", "portfolio", "developer", "seoeongeueun"],
	openGraph: {
		title: "The Pool",
		description: "Hi, I'm Seongeun. Welcome to my interactive developer portfolio with animations, canvas effects, and pixel transitions.",
		url: "https://seongeunpark.com",
		siteName: "The Pool",
		images: [
			{
				url: "/assets/portfolio_main.png",
				width: 1200,
				height: 630,
				alt: "The Pool Preview",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "The Pool",
		description: "Hi, I'm Seongeun. Welcome to my interactive developer portfolio with animations, canvas effects, and pixel transitions.",
		images: ["/assets/portfolio_main.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased font-tenada">{children}</body>
		</html>
	);
}
