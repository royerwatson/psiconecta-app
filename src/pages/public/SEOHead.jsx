/**
 * SEOHead.jsx
 *
 * Componente reutilizable de metadatos SEO para Psiconecta.
 * Requiere react-helmet-async instalado y <HelmetProvider> en main.jsx.
 *
 * Instalación:
 *   npm install react-helmet-async
 *
 * En main.jsx, envolver la app:
 *   import { HelmetProvider } from 'react-helmet-async'
 *   <HelmetProvider><App /></HelmetProvider>
 *
 * Uso básico (landing):
 *   <SEOHead />
 *
 * Uso en página de terapeuta:
 *   <SEOHead
 *     title="Dra. Ana López — Psicóloga clínica | Psiconecta"
 *     description="Agenda una sesión online con Dra. Ana López, psicóloga clínica verificada especializada en ansiedad y depresión."
 *     url="https://psiconecta.app/patient/therapist/ana-lopez"
 *   />
 */

import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Psiconecta'
const BASE_URL = 'https://psiconecta.app'

const DEFAULT_TITLE =
  'Psiconecta — Psicoterapia online con terapeutas verificados'

const DEFAULT_DESCRIPTION =
  'Conecta con psicólogos y terapeutas verificados en República Dominicana y Latinoamérica. ' +
  'Agenda videosesiones, recibe seguimiento con IA y cuida tu salud mental desde donde estés.'

const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`   // 1200×630 px — crear y subir a /public

export default function SEOHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  url = BASE_URL,
  image = DEFAULT_OG_IMAGE,
  type = 'website',           // 'website' | 'article' | 'profile'
  noIndex = false,
  children,                   // schema.org adicional o meta tags extra
}) {
  /* ── Schema.org: WebSite ────────────────────────────────────── */
  const schemaWebsite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/patient/find?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  /* ── Schema.org: MedicalBusiness (organización) ─────────────── */
  const schemaMedical = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': BASE_URL,
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    medicalSpecialty: [
      'Psychiatry',
      'Psychology',
      'MentalHealth',
    ],
    availableLanguage: ['es'],
    areaServed: [
      { '@type': 'Country', name: 'Dominican Republic' },
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'Country', name: 'Mexico' },
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'Country', name: 'Peru' },
    ],
    sameAs: [
      // Agregar URLs de redes sociales cuando estén disponibles
      // 'https://www.instagram.com/psiconecta',
      // 'https://www.facebook.com/psiconecta',
    ],
  }

  return (
    <Helmet>
      {/* ── Básicos ─────────────────────────────────────────────── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── OpenGraph ───────────────────────────────────────────── */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE_NAME} — ${description.slice(0, 80)}`} />
      <meta property="og:locale" content="es_DO" />

      {/* ── Twitter Card ────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {/* <meta name="twitter:site" content="@psiconecta" /> */}

      {/* ── Schema.org ──────────────────────────────────────────── */}
      <script type="application/ld+json">
        {JSON.stringify(schemaWebsite)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(schemaMedical)}
      </script>

      {/* Slots para schema adicional desde cada página */}
      {children}
    </Helmet>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Helpers para páginas específicas
───────────────────────────────────────────────────────────────── */

/**
 * Schema.org para el perfil público de un terapeuta.
 * Usar dentro de SEOHead como children en TherapistProfilePage.
 *
 * Ejemplo:
 *   <SEOHead title="..." description="..." url="...">
 *     <script type="application/ld+json">
 *       {JSON.stringify(therapistSchema(therapist))}
 *     </script>
 *   </SEOHead>
 */
export function therapistSchema(therapist) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: therapist.full_name,
    description: therapist.bio,
    url: `${BASE_URL}/patient/therapist/${therapist.id}`,
    image: therapist.avatar_url,
    medicalSpecialty: therapist.specialty,
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Título Profesional',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Exequátur',
      },
    ],
    priceRange: `$${therapist.price_per_session} USD`,
    availableService: {
      '@type': 'MedicalTherapy',
      name: 'Psicoterapia online',
      description: 'Sesión individual de videollamada',
    },
  }
}

/**
 * Meta tags para páginas que NO deben indexarse (dashboard, admin, etc.).
 * Usar en ProtectedRoute o en cada página privada.
 *
 * Ejemplo:
 *   <SEOHead title="Mi agenda | Psiconecta" noIndex />
 */
export { DEFAULT_TITLE, DEFAULT_DESCRIPTION, BASE_URL }
