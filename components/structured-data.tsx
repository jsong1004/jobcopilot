import Script from 'next/script'

interface StructuredDataProps {
  data: Record<string, any> | Record<string, any>[]
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd),
      }}
      strategy="beforeInteractive"
    />
  )
}
