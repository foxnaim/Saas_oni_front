import type { DefaultSeoProps } from "next-seo";
import { APP_CONFIG } from "./constants";

const defaultSeo: DefaultSeoProps = {
  title: `${APP_CONFIG.NAME} — Anonymous Feedback`,
  description:
    "Anonymous feedback platform for companies. Send and receive honest feedback safely.",
  canonical: APP_CONFIG.SITE_URL,
  additionalMetaTags: [
    {
      name: "keywords",
      content:
        "sayless, anonymous feedback, company feedback, honest feedback, HR, feedback platform"
    }
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: APP_CONFIG.SITE_URL,
    siteName: APP_CONFIG.NAME,
    images: [
      {
        url: `${APP_CONFIG.SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.NAME} Preview`
      }
    ]
  },
  twitter: {
    handle: "@sayless",
    site: "@sayless",
    cardType: "summary_large_image"
  }
};

export default defaultSeo;

