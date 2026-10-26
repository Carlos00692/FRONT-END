# ⚽ Club de Futsal · Panel administrativo

Sitio web responsivo para que una escuela de futsal lleve el control administrativo del club: registro de jugadores por categoría, control de pensiones y estadísticas de rendimiento deportivo.

**Entregable 1 · Programación Web · Unidad 1 – Fundamentos de HTML y CSS**
Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá – Uniempresarial

## Funcionalidades

| Módulo | Qué permite |
|---|---|
| **Resumen** | Total de jugadores, pensiones al día, jugadores en mora y goles del club. |
| **Jugadores** | Registrar jugadores por categoría (Sub-8 a Sub-18), filtrar por categoría, editar y eliminar. |
| **Pensiones** | Registrar el pago mensual de cada jugador, ver el historial, editar y eliminar. El estado "Al día / Pendiente" se calcula con el mes actual. |
| **Estadísticas** | Registrar por partido: goles, asistencias, recuperaciones, remates al arco y minutos jugados. Incluye tabla acumulada por jugador y tabla de partidos, con editar y eliminar. |

## Tecnologías

- **HTML5 semántico:** `header`, `nav`, `main`, `section`, `article`, `form`, `fieldset`, `table`, `footer`.
- **CSS3 responsivo:** variables CSS, **Flexbox** (menú, filtros, botones) y **Grid** (tarjetas, formularios, columnas), consultas de medios y tema oscuro automático.
- **JavaScript (ES2020):** sin librerías ni frameworks. Datos guardados en `localStorage`.

## Estructura del proyecto

```
futsal-club/
├── index.html   # Estructura semántica y formularios
├── styles.css   # Estilos, layout y diseño responsivo
├── app.js       # Lógica: registro, edición, eliminación y renderizado
└── README.md
```

## Cómo ejecutarlo

1. Descarga la carpeta `futsal-club` completa (los tres archivos deben estar juntos).
2. Abre `index.html` con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox o Safari).

No requiere instalación, servidor ni conexión a internet.

## Cómo se usa

1. **Registrar un jugador:** completa el formulario de *Jugadores* y pulsa **Registrar jugador**.
2. **Registrar una pensión:** en *Pensiones*, elige el jugador, el mes y el valor, y pulsa **Guardar pago**.
3. **Registrar estadísticas:** en *Estadísticas*, elige el jugador, la fecha del partido y los datos, y pulsa **Guardar estadística**.
4. **Editar:** pulsa **Editar** en una fila. Los datos pasan al formulario; modifica y pulsa **Guardar cambios** (o **Cancelar edición**).
5. **Eliminar:** pulsa **Eliminar** y luego **¿Seguro?** para confirmar.

> En *Acumulado por jugador*, **Editar** muestra los partidos de ese jugador para modificarlos uno a uno, y **Eliminar** borra todas sus estadísticas. Eliminar un jugador borra también sus pagos y estadísticas.

## Validación de formularios (HTML)

| Campo | Reglas |
|---|---|
| Nombre / Acudiente | `required`, `minlength="5"`, `maxlength="60"` |
| Documento | `required`, `pattern="[0-9]{6,12}"` (solo dígitos) |
| Teléfono | `type="tel"`, `pattern="3[0-9]{9}"` (celular de 10 dígitos) |
| Fecha de nacimiento | `type="date"`, `min` y `max` |
| Categoría | `select` con `required` |
| Valor de pensión | `type="number"`, `min="10000"`, `max="500000"`, `step="1000"` |
| Estadísticas | `type="number"`, `min="0"` y `max` por campo (minutos: máximo 60) |

JavaScript valida únicamente lo que HTML no puede: documentos repetidos y meses de pensión ya pagados.

## Diseño responsivo

Se diseñó desde la vista móvil y se amplía con una consulta de medios a partir de **900 px**.

| Ancho | Comportamiento |
|---|---|
| 360 px (móvil) | Una columna; tablas con desplazamiento horizontal interno. |
| 768 px (tableta) | Tarjetas y campos en varias columnas. |
| 1024 px en adelante | Formulario y tabla lado a lado; contenido centrado (máx. 1120 px). |

## Accesibilidad y usabilidad

- Idioma declarado (`lang="es"`) y jerarquía de encabezados (`h1` → `h2`).
- Cada campo tiene su `label`; las tablas usan `caption` y `th scope="col"`.
- Botones de acción con `aria-label` descriptivo y mensajes de estado con `role="status"`.
- Foco visible, controles táctiles de al menos 44 px y respeto de `prefers-reduced-motion`.
- Modo claro y oscuro automático (`prefers-color-scheme`).

## Persistencia de datos y límites

Los datos se guardan en el navegador (`localStorage`) del equipo donde se usa el sitio. Por eso:

- No se comparten entre computadores ni navegadores distintos.
- Se pierden si se borran los datos del navegador.

**Mejoras futuras:** servidor y base de datos, inicio de sesión para administradores, exportación a Excel/PDF y alertas automáticas de mora.

## Referencias

- Marcotte, E. (2010, 25 de mayo). *Responsive web design*. A List Apart. https://alistapart.com/article/responsive-web-design/
- Mozilla Contributors. (s. f.). *CSS flexible box layout*. MDN Web Docs. https://developer.mozilla.org/es/docs/Web/CSS/CSS_flexible_box_layout
- Mozilla Contributors. (s. f.). *CSS grid layout*. MDN Web Docs. https://developer.mozilla.org/es/docs/Web/CSS/CSS_grid_layout
- Mozilla Contributors. (s. f.). *Constraint validation*. MDN Web Docs. https://developer.mozilla.org/es/docs/Web/HTML/Constraint_validation
- WHATWG. (s. f.). *HTML living standard*. https://html.spec.whatwg.org/multipage/
- World Wide Web Consortium. (2023). *Web content accessibility guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/