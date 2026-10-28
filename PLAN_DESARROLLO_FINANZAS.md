# Plan de desarrollo --- App de finanzas personales

## Objetivo

Construir una aplicación de finanzas personales moderna y segura,
instalable como PWA y utilizable en iPhone, Android y computadora, sin
desarrollar aplicaciones nativas separadas.

La aplicación permitirá registrar gastos e ingresos, controlar cuentas y
tarjetas de débito/crédito, presupuestos, pagos de tarjetas, gastos
recurrentes, metas de ahorro, importar movimientos CSV y consultar
informes.

## Stack objetivo

-   React + TypeScript + Vite
-   Tailwind CSS
-   Supabase Auth + PostgreSQL
-   Row Level Security (RLS)
-   IndexedDB para datos locales y operaciones pendientes cuando
    corresponda
-   PWA: manifest, service worker e instalación
-   Moneda principal: CRC (colones costarricenses); soporte opcional
    para USD
-   Zona horaria: `America/Costa_Rica`
-   Despliegue previsto: Vercel, previa autorización

## Skills de diseño y desarrollo

Revisá qué skills están instaladas y leé sus instrucciones antes de
usarlas. Aplicá las que estén disponibles y sean pertinentes:

### Emil Kowalski

-   `apple-design`
-   `emil-design-eng`
-   `mobile-native`
-   `pick-ui-library`
-   `break-ui`
-   `animate`
-   `animation-performance`
-   `review-animations`

### Vercel

-   `vercel-react-best-practices`
-   `vercel-composition-patterns`
-   `vercel-optimize`
-   `web-design-guidelines`
-   `deploy-to-vercel`

No afirmés haber usado una skill si no está instalada o disponible. Si
falta una skill, continuá aplicando buenas prácticas y señalá la
limitación. Para Supabase y PostgreSQL, seguí la documentación oficial
vigente y las buenas prácticas de seguridad.

## Reglas globales obligatorias

1.  Trabajá en una fase a la vez y respetá el orden de este documento.
2.  Antes de cambiar código, inspeccioná el repositorio, la arquitectura
    y los archivos existentes.
3.  Si el proyecto ya tiene código, preservá lo que funcione y evitá
    reescrituras innecesarias.
4.  No implementés fases futuras sin autorización.
5.  Al terminar cada fase, ejecutá las pruebas, lint y build
    disponibles; corregí los errores y volvé a comprobar.
6.  Informá qué se completó, qué pruebas se ejecutaron, sus resultados y
    qué queda pendiente. Nunca afirmés que una prueba pasó si no se
    ejecutó.
7.  No inventés datos, credenciales, resultados de pruebas, tasas de
    cambio ni estado de despliegue.
8.  No desplegués en producción, cambiés DNS ni ejecutés operaciones
    destructivas o migraciones riesgosas sin autorización explícita.
9.  No guardés números completos de tarjetas, CVV, PIN, contraseñas
    bancarias ni credenciales financieras.
10. Nunca expongás secretos ni la clave `service_role` de Supabase en el
    frontend.
11. No desactivés RLS para facilitar el desarrollo.
12. Evitá dependencias redundantes. Revisá las existentes antes de
    instalar otras.
13. La interfaz debe ser responsive, accesible, mobile-first y
    compatible con áreas seguras de iPhone.
14. Evitá animaciones excesivas y respetá `prefers-reduced-motion`.
15. La app no puede detectar por sí sola la pulsación del botón de
    acción del iPhone ni leer automáticamente todas las compras
    bancarias. El atajo de iOS puede abrir la ruta de registro rápido;
    la detección bancaria requiere una integración compatible o
    importación de movimientos.
16. Los datos locales pendientes no deben mostrarse como sincronizados
    hasta que el servidor confirme la operación.
17. Las transferencias entre cuentas propias no son ingresos ni gastos.
    El pago de una tarjeta de crédito no vuelve a contar la compra como
    gasto.
18. Los saldos deben calcularse con reglas consistentes y una fuente de
    verdad definida.
19. Usá transacciones de base de datos o RPC cuando una operación
    modifique varios registros y deba ser atómica.
20. No sumés monedas diferentes sin una tasa de conversión explícita,
    con criterio y fecha identificables.

------------------------------------------------------------------------

# Fase 1 --- Diagnóstico y arquitectura

## Prompt

Actuá como arquitecto de software senior especializado en React,
TypeScript, Vite, Tailwind CSS, Supabase y aplicaciones financieras
personales.

Antes de programar:

1.  Inspeccioná la estructura del repositorio, archivos, dependencias,
    configuración y skills disponibles.
2.  Revisá las skills relevantes indicadas en este documento y leé sus
    instrucciones cuando sea posible.
3.  Proponé una arquitectura modular, escalable y fácil de mantener.
4.  Definí las entidades, relaciones, reglas de negocio, navegación y
    estrategia de seguridad.
5.  Establecé el plan de implementación por fases, con criterios de
    aceptación y pruebas.
6.  Identificá riesgos técnicos, dependencias necesarias y
    configuraciones que falten.
7.  Preservá el código existente y no hagás cambios destructivos.

No desarrollés todavía toda la aplicación. Entregá diagnóstico,
arquitectura propuesta, plan, riesgos y criterios de aceptación. Esperá
mi aprobación antes de comenzar la Fase 2.

**Criterio de aceptación:** arquitectura y plan revisados y aprobados
antes de modificar el proyecto.

------------------------------------------------------------------------

# Fase 2 --- Sistema de diseño

## Prompt

Implementá el sistema de diseño de la app de finanzas según la
arquitectura aprobada. Aplicá, cuando estén disponibles, `apple-design`,
`emil-design-eng`, `pick-ui-library`, `mobile-native` y
`web-design-guidelines`.

Creá una interfaz premium, moderna, minimalista y elegante, no una
plantilla genérica.

Definí: - Paleta de colores, fondos, superficies, texto, bordes y
estados. - Tipografía, escalas, espaciados, radios, sombras e
iconografía. - Botones, campos, selectores, tarjetas, diálogos, menús y
notificaciones. - Estados de carga, error, éxito, vacío y
deshabilitado. - Accesibilidad, contraste y tamaños táctiles cómodos. -
Adaptación móvil, tablet y escritorio. - Tema claro y oscuro si encaja
con la arquitectura.

Usá una librería de componentes solo si aporta valor. Las animaciones
deben ser discretas, rápidas y respetar `prefers-reduced-motion`.

Implementá componentes base reutilizables y ejemplos de uso. No
implementés aún toda la lógica financiera.

**Criterio de aceptación:** componentes visuales coherentes, accesibles,
responsive y compilando correctamente.

------------------------------------------------------------------------

# Fase 3 --- Estructura principal y navegación

## Prompt

Construí el esqueleto funcional con React, TypeScript, Vite y Tailwind
CSS. Aplicá `vercel-react-best-practices`,
`vercel-composition-patterns`, `mobile-native` y
`web-design-guidelines`.

Implementá: - Estructura de carpetas modular. - Enrutamiento. - Layout
responsive. - Navegación inferior para móviles y navegación apropiada
para escritorio. - Pantallas iniciales: Resumen, Movimientos, Cuentas y
tarjetas, Presupuestos, Informes y Configuración. - Componentes
compartidos para formularios, diálogos, mensajes y estados de carga. -
Pantalla de error y ruta inexistente. - Estados vacíos que expliquen
cómo empezar. - Ruta `/quick-expense` para el registro rápido.

No presentes datos ficticios como información real del usuario. Si usás
datos de demostración, identificálos claramente.

**Criterio de aceptación:** navegación funcional, responsive y
compilación exitosa. No avances a la siguiente fase sin revisar los
resultados.

------------------------------------------------------------------------

# Fase 4 --- Supabase, autenticación y base de datos

## Prompt

Implementá la infraestructura de datos con Supabase y PostgreSQL.
Inspeccioná primero la configuración existente y consultá la
documentación oficial vigente cuando sea necesario.

Configurá: - Registro, inicio y cierre de sesión, y recuperación de
contraseña. - Sesión persistente y rutas protegidas. - Perfil, moneda
principal y zona horaria. - Esquema SQL, claves, relaciones,
restricciones e índices. - Migraciones versionadas. - RLS en todas las
tablas con datos personales. - Políticas para que cada usuario solo
consulte y modifique sus propios datos. - Validaciones en cliente y base
de datos. - Manejo de errores.

Prepará entidades para cuentas, tarjetas, categorías, movimientos,
presupuestos, pagos de tarjetas, transferencias, gastos recurrentes,
metas y preferencias.

Seguridad: - Nunca expongás `service_role` ni secretos en el cliente. -
No desactives RLS. - No guardés credenciales bancarias ni datos
sensibles de tarjetas. - No modifiqués producción ni ejecutés
operaciones destructivas sin autorización.

Creá migraciones, documentación y pruebas de aislamiento entre usuarios.
Si faltan credenciales, prepará los archivos y explicá cómo
configurarlas sin inventarlas.

**Criterio de aceptación:** autenticación probada, políticas RLS
verificadas y migraciones documentadas.

------------------------------------------------------------------------

# Fase 5 --- Cuentas, tarjetas y categorías

## Prompt

Implementá el módulo de cuentas, tarjetas y categorías.

Debe permitir: 1. Crear cuentas de efectivo, bancarias y otras cuentas
personales. 2. Registrar tarjetas de débito y crédito. 3. Definir alias,
banco, tipo, color identificador y moneda. 4. En tarjetas de crédito,
configurar límite, fecha de corte y fecha de vencimiento. 5. Calcular
saldos y crédito disponible desde movimientos consistentes. 6. Crear,
editar, archivar y consultar categorías y subcategorías. 7. Ofrecer
categorías iniciales editables: alimentación, transporte, vivienda,
servicios, salud, entretenimiento, compras, educación y otros. 8.
Diferenciar efectivo, débito, crédito y cuentas bancarias. 9. Validar
importes, monedas y configuraciones. 10. Evitar eliminar registros que
tengan movimientos relacionados; archivar cuando corresponda.

No solicités ni guardés número completo de tarjeta, CVV, PIN o
contraseñas bancarias.

Implementá formularios responsive, validaciones, confirmaciones y
estados vacíos. Creá pruebas CRUD, aislamiento por usuario y cálculos
básicos.

**Criterio de aceptación:** operaciones CRUD y cálculos probados; no hay
datos sensibles de tarjetas almacenados.

------------------------------------------------------------------------

# Fase 6 --- Movimientos financieros

## Prompt

Implementá el núcleo financiero: ingresos, gastos y transferencias.

Cada movimiento debe contemplar importe válido, tipo, fecha/hora, cuenta
o tarjeta, categoría, moneda, descripción/comercio opcionales, notas,
etiquetas, estado e identificador único.

Implementá: - Crear, consultar, editar y anular movimientos. - Filtros
por fechas, cuenta, tarjeta, categoría y tipo. - Búsqueda por
descripción o comercio. - Orden cronológico. - Validaciones y
confirmaciones. - Protección ante doble clic, reintentos y errores de
red. - Cálculos consistentes de saldos.

Reglas: - Compra con crédito: registra el gasto y aumenta la deuda. -
Compra con débito: registra el gasto y reduce el saldo de la cuenta. -
Transferencia entre cuentas propias: vincula salida y entrada sin
contarlas como ingreso ni gasto. - Pago de tarjeta: reduce la deuda y el
saldo de la cuenta de origen; no vuelve a contar la compra como gasto.

Usá operaciones atómicas cuando se modifiquen varios registros. Agregá
pruebas unitarias de reglas financieras y pruebas de integración.

**Criterio de aceptación:** cálculos verificados con casos conocidos,
sin duplicados ni inconsistencias.

------------------------------------------------------------------------

# Fase 7 --- Registro rápido y atajo de iPhone

## Prompt

Implementá `/quick-expense` para registrar un gasto cotidiano en menos
de 10 segundos.

La pantalla debe permitir: 1. Introducir el importe. 2. Seleccionar
tarjeta o cuenta. 3. Elegir categoría. 4. Añadir opcionalmente comercio
o descripción. 5. Guardar, confirmar y registrar otro gasto rápidamente.

Requisitos: - Diseño mobile-first. - Teclado numérico apropiado. -
Valores predeterminados configurables. - Acceso rápido a categorías y
tarjetas frecuentes. - Validaciones inmediatas. - Prevención de doble
envío. - Compatibilidad con safe areas del iPhone. - Posibilidad de
guardar operaciones pendientes sin conexión, sin mostrarlas como
sincronizadas hasta la confirmación del servidor.

Prepará instrucciones para configurar Atajos de Apple y abrir la URL de
la PWA `/quick-expense` desde el botón de acción del iPhone.

No afirmés que la PWA puede detectar directamente la pulsación del botón
ni leer automáticamente compras de Apple Pay o del banco. El atajo abre
la pantalla; la captura bancaria automática requeriría una integración
compatible.

Documentá la instalación de la PWA en iPhone y Android. Aplicá
`mobile-native`, `apple-design`, `emil-design-eng` y `break-ui`.

**Criterio de aceptación:** registro rápido probado en móvil, manejo de
errores y guía del atajo documentada.

------------------------------------------------------------------------

# Fase 8 --- Dashboard financiero

## Prompt

Implementá el dashboard principal usando datos reales del usuario.

Debe mostrar: - Dinero disponible en cuentas, con definición
consistente. - Ingresos y gastos del mes. - Balance mensual. - Gastos
por categoría. - Últimos movimientos. - Presupuestos y progreso. -
Próximos pagos. - Deuda de tarjetas y crédito disponible. - Comparación
con periodos anteriores si existen datos suficientes.

Incluí selector de periodo y moneda cuando corresponda. Diferenciá saldo
de cuentas, deuda de tarjetas y patrimonio neto.

Usá gráficos accesibles, formatos CRC/USD y estados vacíos útiles.
Optimizá consultas y evitá cargar todos los movimientos cuando solo se
necesitan agregados.

Aplicá `vercel-react-best-practices`, `vercel-optimize`,
`vercel-composition-patterns` y `web-design-guidelines`.

No inventés cifras ni tendencias. Verificá los indicadores con datos de
prueba conocidos.

**Criterio de aceptación:** los totales del dashboard coinciden con los
movimientos y reglas financieras.

------------------------------------------------------------------------

# Fase 9 --- Presupuestos, recurrencias y metas

## Prompt

Implementá presupuestos mensuales, gastos recurrentes y metas de ahorro.

Presupuestos: - Límites generales y por categoría. - Monto gastado,
restante y porcentaje utilizado. - Alertas configurables. - Edición y
archivado. - Reglas para reembolsos y movimientos anulados.

Gastos recurrentes: - Nombre, importe, periodicidad y próxima fecha. -
Servicios, alquiler y suscripciones. - Próximos vencimientos. -
Prevención de duplicados. - Recordatorios configurables, sin afirmar que
se enviaron si no hay mecanismo confirmado.

Metas: - Nombre, importe objetivo y fecha opcional. - Aportes, retiros y
progreso. - Cálculo de cuánto falta y ritmo de ahorro cuando haya datos
suficientes.

Los aportes entre cuentas propias o a metas no deben contarse
incorrectamente como ingresos o gastos. Probá límites, cambios de mes,
recurrencias y movimientos vinculados.

**Criterio de aceptación:** cálculos y fechas correctos, sin duplicados
ni doble contabilización.

------------------------------------------------------------------------

# Fase 10 --- Pagos y ciclo de tarjetas de crédito

## Prompt

Implementá el ciclo de vida de las tarjetas de crédito: - Fecha de corte
y vencimiento. - Saldo pendiente y crédito disponible. - Pagos parciales
y completos. - Historial de pagos. - Compras por periodo de
facturación. - Resumen del periodo y próximo vencimiento. -
Recordatorios configurables. - Validaciones de importes y saldos.

Cada pago debe vincular una cuenta de origen con la tarjeta. La
operación debe ser atómica para evitar descontar dinero sin reducir la
deuda, o viceversa.

Regla fundamental: la compra es el gasto; el pago posterior reduce la
deuda y el saldo bancario, pero no crea otro gasto.

Aclarale al usuario que el saldo calculado es un control personal y
puede necesitar conciliación con el banco.

Probá pagos parciales, pagos completos, compras posteriores al corte,
fechas de vencimiento, reintentos y errores de conexión.

**Criterio de aceptación:** deuda, saldo bancario y movimientos
permanecen consistentes en todos los escenarios probados.

------------------------------------------------------------------------

# Fase 11 --- Importación de CSV

## Prompt

Implementá importación de movimientos mediante archivos CSV.

Flujo: 1. Seleccionar archivo. 2. Previsualizar contenido. 3. Mapear
columnas a fecha, descripción, importe, moneda y tipo. 4. Configurar
formato de fecha y separadores decimales. 5. Asociar cuenta. 6. Validar
filas y mostrar errores. 7. Detectar posibles duplicados. 8. Confirmar
importación explícitamente. 9. Mostrar importados, omitidos y
rechazados.

No supongás que todos los bancos usan el mismo formato. No clasifiqués
importes negativos sin considerar el formato de origen. Usá
identificadores o huellas de datos para prevenir importaciones
repetidas; dejá casos ambiguos para revisión.

Procesá archivos de forma segura y no los conservés innecesariamente.
Evitá que fallos parciales dejen datos inconsistentes.

Probá archivos vacíos, formatos inválidos, caracteres especiales,
monedas distintas, duplicados y CSV grandes. Documentá los formatos
soportados.

**Criterio de aceptación:** importación revisable, segura, idempotente y
con reporte de resultados.

------------------------------------------------------------------------

# Fase 12 --- Informes, búsqueda y exportación

## Prompt

Implementá informes financieros: - Ingresos, gastos y balance por
periodo. - Gastos por categoría, cuenta, tarjeta y comercio. - Evolución
mensual y comparaciones equivalentes. - Suscripciones y gastos
recurrentes. - Pagos y deuda de tarjetas. - Cumplimiento de
presupuestos. - Filtros por fechas, moneda y cuenta. - Búsqueda global
de movimientos. - Exportación CSV de datos propios, con selección de
periodo y columnas.

Usá formatos correctos para CRC y USD. No sumés monedas diferentes sin
una tasa explícita y fecha de referencia. Si existe conversión, permití
tasa manual o una fuente confiable; no inventés tasas ni alterés datos
históricos sin explicar el criterio.

Los informes deben coincidir con movimientos, pagos y transferencias,
sin doble contabilización. La exportación solo puede incluir registros a
los que el usuario tenga acceso.

**Criterio de aceptación:** informes reconciliados con los datos y
exportaciones verificadas.

------------------------------------------------------------------------

# Fase 13 --- PWA y funcionamiento sin conexión

## Prompt

Completá la experiencia PWA para iPhone, Android y escritorio.

Implementá: - Manifest, nombre, iconos y modo de visualización. -
Service worker y estrategia de caché. - Instrucciones de instalación. -
Safe areas y navegación táctil. - Indicadores de conexión y
sincronización. - IndexedDB para operaciones locales pendientes cuando
corresponda. - Cola de sincronización y recuperación al reconectar. -
Manejo de errores y conflictos.

Reglas: - No marcar una operación como confirmada antes de que el
servidor lo confirme. - Usar identificadores estables e idempotencia. -
Definir conflictos de edición entre dispositivos. - No almacenar
secretos ni datos sensibles en local. - Evitar caché de respuestas
privadas que pueda filtrarse entre usuarios. - Separar o limpiar datos
locales al cerrar sesión y cambiar de usuario. - No prometer que
funciones dependientes del servidor operan offline.

Aplicá `mobile-native`, `break-ui` y skills de rendimiento disponibles.
Probá instalación, actualización del service worker, modo offline,
reconexión, sincronización y cambio de usuario. Documentá limitaciones
de iOS, tareas en segundo plano y notificaciones.

**Criterio de aceptación:** estados de sincronización veraces, sin
duplicados ni filtraciones entre usuarios.

------------------------------------------------------------------------

# Fase 14 --- Auditoría, seguridad y pruebas

## Prompt

Realizá una auditoría integral antes de publicar.

Revisá: 1. TypeScript, build y lint. 2. Pruebas unitarias de reglas
financieras. 3. Integración con Supabase. 4. Autenticación y
recuperación. 5. RLS con dos usuarios diferentes. 6. Formularios y
manejo de errores. 7. Doble envío, reintentos y duplicados. 8. Saldos,
transferencias y pagos de tarjetas. 9. Importación CSV y sincronización
offline. 10. Accesibilidad y teclado. 11. Responsive design y estados
vacíos. 12. Rendimiento y carga de pantallas. 13. Secretos y variables
de entorno. 14. Service worker y almacenamiento local. 15. Protección de
rutas y fugas de información.

Aplicá `web-design-guidelines`, `vercel-react-best-practices`,
`vercel-optimize`, `break-ui`, `review-animations` y
`animation-performance` cuando estén disponibles.

Probá importes inválidos, decimales, cifras grandes, fin de mes,
usuarios sin movimientos, conexión intermitente y reintentos.

Corregí los problemas que puedas de forma segura, volvé a ejecutar las
pruebas y documentá los pendientes. No desactives seguridad para hacer
pasar las pruebas. No modifiqués producción sin autorización.

**Criterio de aceptación:** reporte real de pruebas, problemas
corregidos y riesgos pendientes; ningún fallo crítico oculto.

------------------------------------------------------------------------

# Fase 15 --- Preparación de despliegue y entrega

## Prompt

Prepará el despliegue en Vercel usando `deploy-to-vercel` y las skills
disponibles.

Antes de desplegar: - Ejecutá build, lint y pruebas. - Revisá variables
de entorno y secretos. - Configurá rutas SPA y dominio. - Verificá
redirecciones de autenticación de Supabase. - Verificá manifest, iconos
y service worker. - Documentá migraciones pendientes. - Separá
desarrollo y producción.

No publiques en producción, cambiés DNS ni ejecutés migraciones
destructivas sin mi autorización explícita. Si faltan credenciales,
explicá cómo configurarlas; no inventés valores ni afirmés que el
despliegue fue exitoso sin verificarlo.

Entregá: 1. Resumen de arquitectura. 2. Funciones completas y
pendientes. 3. Instrucciones de ejecución local. 4. Configuración de
Supabase. 5. Variables necesarias, sin secretos. 6. Instalación de la
PWA. 7. Configuración del atajo del botón de acción del iPhone. 8.
Resultados de pruebas y build. 9. Procedimiento de despliegue y
actualización. 10. Limitaciones y mejoras recomendadas.

No declarés terminada una función que solo tenga interfaz sin lógica
real.

**Criterio de aceptación:** documentación completa y aplicación lista
para despliegue, sin publicar nada sin autorización.

------------------------------------------------------------------------

# Prompt de control para usar al final de cada fase

Antes de dar por terminada la fase actual:

1.  Inspeccioná los cambios y confirmá que respeten la arquitectura
    aprobada.
2.  Ejecutá pruebas, lint y build disponibles.
3.  Corregí errores y repetí las verificaciones.
4.  Revisá seguridad, accesibilidad, responsive design y consistencia
    visual según corresponda.
5.  Confirmá que no haya secretos, dependencias innecesarias ni cambios
    ajenos al alcance.
6.  Documentá archivos principales y decisiones tomadas.
7.  Indicá qué requisitos están cumplidos y cuáles pendientes.
8.  No afirmés que una prueba pasó si no se ejecutó.
9.  No iniciés la siguiente fase hasta que yo lo autorice.

Entregá un reporte breve con: cambios, pruebas ejecutadas, resultados,
pendientes y criterio de aceptación. Si una prueba depende de
credenciales o servicios no disponibles, explicá exactamente cómo
verificarla.

------------------------------------------------------------------------

# Recomendación de uso

1.  Abrí el repositorio en Claude Code.
2.  Agregá este archivo al repositorio, por ejemplo como
    `PLAN_DESARROLLO_FINANZAS.md`.
3.  Pegá el prompt de la Fase 1 y pedile a Claude que use este documento
    como plan maestro.
4.  Revisá y aprobá la arquitectura.
5.  Ejecutá una fase a la vez.
6.  Al final de cada fase, usá el prompt de control.
7.  No permitás cambios de producción sin revisar y autorizar
    explícitamente.

El objetivo es construir una aplicación financiera segura, mantenible y
probada, no solamente una demostración visual.
