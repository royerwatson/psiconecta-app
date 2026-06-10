/**
 * Smoke tests — verifican que las rutas públicas críticas rendericen
 * sin errores antes de cada deploy. No requieren credenciales.
 */
import { test, expect } from '@playwright/test'

test.describe('Rutas públicas', () => {
  test('landing carga con hero y CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Psiconecta/i)
    await expect(page.getByRole('link', { name: /terapeutas/i }).first()).toBeVisible()
  })

  test('pricing muestra el plan de $79.99', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/79\.99/).first()).toBeVisible()
  })

  test('directorio de terapeutas renderiza', async ({ page }) => {
    await page.goto('/terapeutas')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('blog lista artículos', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('páginas legales accesibles', async ({ page }) => {
    for (const path of ['/terminos', '/privacidad', '/reembolsos']) {
      await page.goto(path)
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })

  test('404 muestra página de recuperación', async ({ page }) => {
    await page.goto('/ruta-que-no-existe')
    await expect(page.getByText(/404|no encontrada|no existe/i).first()).toBeVisible()
  })
})

test.describe('Auth', () => {
  test('login renderiza el formulario', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder(/correo|email/i).or(page.locator('input[type="email"]')).first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('registro renderiza selección de rol', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText(/terapeuta|paciente/i).first()).toBeVisible()
  })

  test('login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').first().fill('noexiste@test.com')
    await page.locator('input[type="password"]').first().fill('ClaveIncorrecta123!')
    await page.getByRole('button', { name: /iniciar|entrar|login/i }).first().click()
    // No debe navegar al dashboard
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('/login')
  })

  test('rutas privadas redirigen a login', async ({ page }) => {
    await page.goto('/therapist/dashboard')
    await page.waitForURL(/login/i, { timeout: 10_000 })
    expect(page.url()).toMatch(/login/i)
  })
})
