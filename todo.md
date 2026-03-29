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

## Mejoras v3 — Revisión completa

### Generador de Imágenes
- [x] Múltiples variaciones simultáneas (1, 2, 4 imágenes a la vez)
- [x] Todos los formatos Meta: feed 1:1, story 9:16, reel cover, banner horizontal 1.91:1, carrusel, portrait 4:5
- [x] Estilos visuales: fotorealista, ilustración, minimalista, bold, cinematográfico
- [x] Descarga en múltiples formatos (PNG, JPG, WebP)
- [x] Selector de cantidad de variaciones

### Generador de Guiones
- [x] Múltiples variaciones simultáneas (hasta 3 guiones a la vez)
- [x] Estilos de guión: storytelling, directo, testimonial, educativo, provocador
- [x] Tonos adicionales: urgencia, curiosidad, autoridad
- [x] Vista comparativa de variaciones

### Constructor de Campañas
- [x] Todos los objetivos Meta: Reconocimiento, Alcance, Tráfico, Interacción, Nuevos seguidores, Reproducciones de vídeo, Generación de clientes potenciales, Mensajes, Conversiones, Ventas del catálogo, Visitas al negocio
- [x] URL opcional según objetivo (no mostrar si es interacción/seguidores)
- [x] Todas las ubicaciones Meta e Instagram (Feed, Stories, Reels, Marketplace, Columna derecha, Audience Network, Messenger, etc.)
- [x] Navegación libre entre pasos 1→3 sin bloqueos
- [x] Creativos externos: poder subir imagen/vídeo propio
- [x] Selector de creativos desde biblioteca generada

### Dashboard
- [x] Widgets del dashboard clicables (navegan a la sección correspondiente)
- [x] Métricas seleccionables (el usuario elige qué KPIs mostrar)
- [x] Panel personalizable: selector de métricas visibles
- [x] Acceso rápido desde métricas a campañas activas

### Navegación Global
- [x] Botón atrás no sale de la app (usa history.back() interno)
- [ ] Breadcrumbs en páginas de detalle (pendiente)

## Mejoras v4 — Revisión completa 2

### Dashboard & Perfil
- [ ] Perfil: editar nombre, email y logo desde la app
- [ ] Dashboard: widgets reorganizables (drag & drop o selector de orden)
- [ ] Dashboard: secciones configurables (métricas, acciones rápidas, contenido generado reciente)

### Brand Brain
- [ ] Identidad visual: color de marca solo para referencia, NO forzar en imágenes generadas
- [ ] Avatar: cada sección editable individualmente sin reiniciar onboarding
- [ ] Avatar: secciones como acordeones (abrir/cerrar) para vista limpia

### Generador de Copy
- [ ] Objetivos: todos los objetivos Meta (igual que en campañas)
- [ ] Formato del anuncio: eliminar o hacer opcional
- [ ] Variantes: cantidad libre (no limitada a 1/2/4)
- [ ] Historial: ver, copiar y reutilizar copies anteriores para modificar o generar más

### Generador de Guiones
- [ ] Historial: ver guiones recientes con opción de editar
- [ ] Cantidad: libre (además de las opciones 1/2/4)
- [ ] Edición individual: cada guión creado se puede editar (tono, estilo, duración, plataforma) sin afectar a los demás

### Generador de Imágenes
- [ ] Paleta de colores: opcional, no forzada en todas las imágenes
- [ ] Estilo visual: añadir opción "Libre" (solo con el concepto, sin estilo predefinido)
- [ ] Adaptar formato: cambiar formato de una imagen ya creada sin reescribir el prompt
- [ ] Historial visual: ver imágenes recientes en galería, no solo descargar
- [ ] Regenerar: cada imagen puede regenerarse o crear versiones de sí misma
- [ ] Cantidad: libre (además de las opciones 1/2/4)

### Nuevas Funcionalidades Premium
- [ ] Landing Page builder: crear landing pages desde la app
- [ ] Pipeline de WhatsApp: gestión de conversaciones y automatizaciones
- [ ] Pipeline de Facebook: gestión de mensajes y leads
- [ ] Pipeline de Instagram: gestión de DMs y leads
- [ ] Métricas multi-red: vincular y ver métricas de todas las redes sociales
- [ ] Promocionar posts: impulsar posts/reels de Instagram o Facebook desde la app
- [ ] Generador de vídeo: integración con herramienta top de generación de vídeo IA
- [ ] Investigación de competencia: explorar Meta Ads Library desde la app
