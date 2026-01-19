import { APP_CONFIG } from '@/constants/Config';
import React from 'react';

interface SeoHeadProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

export function SeoHead({ 
  title, 
  description = APP_CONFIG.description, 
  path = '', 
  image = '/assets/images/icon.png' // Default to app icon
}: SeoHeadProps) {
  const fullTitle = title ? `${title} | ${APP_CONFIG.name}` : APP_CONFIG.name;
  const url = `${APP_CONFIG.domain}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${APP_CONFIG.domain}${image}`;

  return (
    <head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={APP_CONFIG.keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
    </head>
  );
}
