/**
 * useScrollReveal — lenguaje de animación premium de Psiconecta.
 *
 * Observa los elementos `.fade-in` y los revela en cascada (90ms entre
 * los que entran juntos al viewport). Los estilos viven en index.css
 * (transform/opacity, GPU, sin forced reflow, respeta reduced-motion).
 *
 * Acepta deps para contenido asíncrono: cuando los datos cargan y se
 * renderizan tarjetas nuevas con .fade-in, el hook las re-observa.
 *
 *   useScrollReveal()            // contenido estático
 *   useScrollReveal([items])     // re-escanear cuando `items` cambie
 */
import { useEffect } from 'react'

export function useScrollReveal(deps = []) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.filter(e => e.isIntersecting).forEach((e, i) => {
          setTimeout(() => e.target.classList.add('visible'), i * 90)
          observer.unobserve(e.target)
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
