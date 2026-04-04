import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  keywords,
  ogImage,
  ogType = 'website',
}) => {
  const siteName = 'PrepDosth';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'PrepDosth - Your ultimate destination for Exam Preparation, Job Notifications, and Mock Tests in Telangana and Andhra Pradesh.';
  const defaultKeywords = 'exam preparation, job notifications, mock tests, TSPSC, APPSC, ECET, competitive exams, Telangana jobs';
  
  const metaDescription = (description || defaultDescription).replace(/<[^>]*>?/gm, ''); // Strip HTML tags
  const metaKeywords = keywords || defaultKeywords;
  
  return (
    <Helmet>
      {/* Search Engine Optimization */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription.substring(0, 160)} />
      <meta name="keywords" content={metaKeywords} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription.substring(0, 200)} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription.substring(0, 200)} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default SEO;
