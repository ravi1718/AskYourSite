export function SchemaOrg() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://askyoursite.in/#organization",
        "name": "AskYourSite",
        "url": "https://askyoursite.in/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://askyoursite.in/logo.png",
          "width": 512,
          "height": 512,
        },
        "description":
          "AI-powered chatbot platform for automated customer support, lead capture, and sales qualification.",
        "foundingDate": "2024",
        "sameAs": [
          "https://twitter.com/askyoursite",
          "https://linkedin.com/company/askyoursite",
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "url": "https://askyoursite.in/contact",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://askyoursite.in/#website",
        "url": "https://askyoursite.in/",
        "name": "AskYourSite",
        "description": "AI Sales & Support Agent for Your Website",
        "publisher": { "@id": "https://askyoursite.in/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://askyoursite.in/?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
