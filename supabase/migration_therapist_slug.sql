-- migration_therapist_slug.sql
-- Agrega columna slug a therapist_profiles para URLs SEO-friendly

ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generar slugs desde full_name (minúsculas, espacios → guiones, sin caracteres especiales)
UPDATE therapist_profiles
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(full_name, '[áàäâ]', 'a', 'gi'),
      '[éèëê]', 'e', 'gi'
    ),
    '[íìïî]', 'i', 'gi'
  )
)
WHERE full_name IS NOT NULL AND slug IS NULL;

UPDATE therapist_profiles
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(full_name, '[áàäâÁÀÄÂ]', 'a', 'g'),
            '[éèëêÉÈËÊ]', 'e', 'g'),
          '[íìïîÍÌÏÎ]', 'i', 'g'),
        '[óòöôÓÒÖÔ]', 'o', 'g'),
      '[úùüûÚÙÜÛ]', 'u', 'g'),
    '[^a-z0-9\s]', '', 'g')
)
WHERE full_name IS NOT NULL AND slug IS NULL;

-- Segunda pasada: espacios → guiones y trim
UPDATE therapist_profiles
SET slug = regexp_replace(trim(slug), '\s+', '-', 'g')
WHERE slug IS NOT NULL AND slug ~ '\s';

-- RLS: permitir lectura pública del slug para anon
-- (ya cubierto por la política "Public can view verified therapists")
