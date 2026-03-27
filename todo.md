# Mister Fourteen — AI Ads Platform TODO

## Fase 1: Schema y Estructura
- [x] Schema de base de datos (brandBrains, campaigns, generatedContent, metaConnections)
- [x] Migración SQL aplicada
- [x] Helpers de DB en server/db.ts
- [x] Routers tRPC base

## Fase 2: Landing y Autenticación
- [x] Landing page con diseño profesional oscuro/premium
- [x] Sistema de login/registro con roles (user/admin)
- [x] Layout principal con sidebar (DashboardLayout)
- [x] Rutas protegidas por rol
- [x] Página de selección de plan (pricing)

## Fase 3: Brand Brain (Onboarding)
- [x] Formulario de onboarding multi-paso (Brand Brain)
- [x] Captura de nicho, avatar, tono, casos de éxito, diferenciadores
- [x] Paleta de colores y estilo visual por cliente
- [x] Generación automática del "prompt maestro" por cliente
- [x] Página de perfil de marca editable
- [x] Vista del Brand Brain generado

## Fase 4: Generadores de IA
- [x] Generador de copies publicitarios (usando Brand Brain)
- [x] Generador de guiones para vídeos
- [x] Generador de creativos visuales (imágenes con IA)
- [x] Historial de contenidos generados por cliente
- [x] Botón de copiar/descargar contenido generado

## Fase 5: Constructor de Campañas y Meta API
- [x] Formulario de creación de campaña (objetivo, presupuesto, audiencia)
- [x] Previsualización en tiempo real del anuncio
- [x] Página de conexión con Meta Marketing API (token manual)
- [x] Publicación automática en Meta (cambia estado a activa)
- [x] Listado de campañas creadas con estado y métricas

## Fase 6: Dashboard de Métricas y Admin
- [x] Dashboard principal con KPIs (impresiones, clics, gasto, conversiones)
- [x] Gráficas de rendimiento (AreaChart con Recharts)
- [x] Panel de administración: listado de usuarios
- [x] Admin: ver Brand Brains de cada cliente
- [x] Admin: estadísticas globales de la plataforma

## Fase 7: Stripe y Producción
- [x] Página de pricing con 3 planes (DIY 97€, DWY 297€, Premium 997€)
- [ ] Integración Stripe completa (pendiente de credenciales)
- [ ] Control de acceso por plan (feature gating)
- [x] Tests vitest completos (8 tests pasando)
- [x] Checkpoint final y entrega

## Fixes y Mejoras
- [x] SEO: meta descripción, palabras clave y Open Graph en index.html
- [x] Imagen Open Graph 1200x630px generada con IA
- [x] sitemap.xml con rutas públicas
- [x] robots.txt optimizado
- [x] URLs canónicas actualizadas a misterfourteen.com
- [x] Fix: sitemap.xml servido con Content-Type application/xml

## Mejoras v2 — App Top
- [x] Stripe integrado con feature gating real por plan
- [x] Historial de contenidos generados (biblioteca personal)
- [x] Onboarding guiado post-registro (3 pasos con barra de progreso)
- [x] Previsualización de anuncios en mockup real Instagram/Facebook
- [x] Biblioteca de plantillas de campañas por objetivo fitness
- [x] A/B testing automático de copies e imágenes
- [x] Página de casos de éxito / resultados
- [x] Chat de soporte in-app con IA
- [ ] Informe semanal automático por email (requiere servicio de email externo)
- [ ] Modo oscuro/claro switchable (diseño oscuro fijo actualmente)
- [ ] PWA instalable en móvil (requiere service worker)
