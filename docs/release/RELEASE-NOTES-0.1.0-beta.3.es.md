# Notas de la versión PDFVEX / PDFix 0.1.0 Beta 3

PDFVEX es el nuevo nombre de PDFix. Beta 3 todavía muestra PDFix dentro de la aplicación; el nombre cambiará allí en la actualización 3.

**Para Windows 10 y 11 de 64 bits.** Beta 3 reúne las actualizaciones 1 y 2. Se omitió Beta 2, así que quienes prueban Beta 1 pasarán directamente a Beta 3.

Consulta la [guía de pruebas](../BETA-TESTER-GUIDE.es.md) para descargar el instalador, comprobar su SHA-256 y hacer una prueba rápida. El instalador no tiene firma digital, por lo que Windows puede mostrar un aviso de SmartScreen.

## Novedades

- **Abre archivos con nombres acentuados.** Los PDF ya se pueden abrir aunque su nombre o carpeta contenga acentos, como año o número.

- **Mantén el PDF a la vista mientras trabajas.** Varios paneles se abren junto al documento. En las herramientas que usan el área principal para revisar el resultado, **Back to my PDF** vuelve a tu página.
- **Rellena y firma desde Inicio.** Rellena los campos junto al PDF y usa **Save filled copy** para guardar en un solo paso. Si el PDF ya está abierto, la acción de Inicio vuelve a la página actual y conserva el borrador.
- **Rellena y comenta más formularios.** Esto incluye formularios compatibles con funciones ampliadas de Adobe Reader, como los formularios W-9, W-4 y 1040 del IRS en inglés y español. La copia nueva conserva los campos normales. Las funciones adicionales de Adobe Reader pueden quedar desactivadas en esa copia.
- **Trabaja dentro de los permisos de un PDF protegido.** En los PDF compatibles que se abren sin contraseña, usa la herramienta permitida para rellenar o comentar. Las copias probadas conservaron el cifrado y los permisos. La comprobación admite copias protegidas de hasta 50 MB.
- **Escribe en inglés o español.** Esto incluye texto añadido, comentarios, respuestas y firmas escritas con el teclado. Si escribes o pegas caracteres no compatibles, PDFix explica el límite y conserva lo que ya escribiste. **Make searchable** también puede reconocer texto en español en documentos escaneados.
- **Recibe mensajes más claros si un PDF no se puede leer o editar con seguridad.** El lector admite varios archivos que antes se quedaban bloqueados y da una explicación sencilla para muchos archivos dañados. **Save a copy** deja intacto el PDF original.

## Límites conocidos

- A veces no se registra el arrastre del resaltador. Si no aparece el resaltado, arrastra de nuevo. La corrección está prevista para la actualización 3.
- La vista de la página real al revisar páginas en blanco puede abrirse muy pequeña. Usa Fit page para inspeccionarla.
- Algunos PDF dañados poco comunes pueden tardar demasiado en abrirse sin dar una respuesta clara. Cierra ese PDF y prueba otra copia.

- Puedes leer un PDF que requiere contraseña de apertura después de introducirla. Esta beta no permite editar esos archivos.
- La vista previa de los trazos incorporados de forma permanente a la página puede aparecer con un tamaño distinto al de la vista previa editable. La comprobación del archivo guardado pasó en el caso reportado.
- Cuando un PDF protegido prohíbe todos los cambios, es posible que aparezca un mensaje sobre copiar o medir. La edición se bloquea según los permisos del archivo.
- Al girar o quitar páginas en **Organize pages**, se crea una copia que conserva las páginas, pero omite comentarios, enlaces, marcadores y detalles del documento existentes. PDFix avisa antes de guardar.
- En Windows, **Abrir con** puede mostrar PDFix como **Electron**. La corrección está prevista para la actualización 3.
- Un PDF protegido con daños menores puede impedir añadir comentarios y mostrar un mensaje técnico. Tu original queda intacto.
- Al abrir un PDF desde el Explorador de archivos (doble clic o **Abrir con**), PDFix se abre en **Home (Inicio)** y muestra el archivo más abajo, en **Files requested by Windows**. Elige **Review & open** y luego **Open document**. Está previsto que se abra directamente en la actualización 3.
- Cierra PDFix antes de instalar Beta 3. Si PDFix está abierto, el instalador puede detenerse sin instalar.
- Vuelve a abrir las copias importantes en el visor que vayas a usar. Se volvieron a leer los archivos de muestra guardados con la versión candidata. La compatibilidad con Adobe Acrobat Reader no se comprobó para esta versión.

## Cómo se probó Beta 3

Todo lo siguiente se ejecutó con el código exacto de Beta 3, salvo que se indique lo contrario. Son nuestras propias pruebas, no una auditoría independiente.

**Lo más probado:** abrir y leer PDF, buscar, resaltar, comentar, dibujar, escribir en la página, rellenar y firmar (incluidos los formularios W-9, W-4 y 1040 del IRS en inglés y español), firmas visibles, **Save a copy**, organizar páginas, combinar PDF, vista previa de impresión y recuperar el trabajo sin guardar después de un cierre inesperado.

- **Comprobaciones automáticas:** 608 pequeñas comprobaciones del código, todas correctas. Las pruebas de escritorio usan la aplicación real como lo haría una persona y después leen el archivo guardado con herramientas independientes. Entre ellas: las ventanas reales de Guardar y Abrir de Windows, carpetas y nombres de archivo con acentos (año, número, Núñez) y salir de **Fill and sign** y volver.
- **Usuario robot:** una PC de pruebas con Windows 10 hace tareas cotidianas al azar, día y noche. Cada archivo guardado se abre y se comprueba; no basta con el mensaje de «guardado».
- **PDF de prueba públicos:** 3576 archivos de colecciones públicas (veraPDF, PDF.js, qpdf, formularios del IRS, ejemplos de LibreOffice y DSS), muchos dañados a propósito. Cada uno se abrió, se comentó o rellenó y se guardó. No se perdió trabajo ni se dañó ninguna copia guardada. Los archivos que PDFix no puede manejar se rechazan con un mensaje. Esto se ejecutó con la versión candidata de Beta 3, antes de las dos últimas correcciones pequeñas.
- **Instalador:** la actualización de Beta 1 a Beta 3 conservó los archivos recientes, las firmas guardadas, los comentarios sin guardar y los documentos nuevos sin guardar. La instalación nueva también funcionó, con los accesos directos y la entrada de Aplicaciones de Windows comprobados.

**Todavía sin probar** (cuéntanos cómo te va): carpetas de OneDrive o Google Drive, PDFix abierto durante horas o tras suspender el equipo, escala de pantalla del 125 % o 150 %, lectores de pantalla, impresión en una impresora real, copias guardadas abiertas en Adobe Acrobat Reader y archivos muy grandes (más de 1000 páginas).

[Problemas conocidos (en inglés)](../../KNOWN-ISSUES.md) · [Informar de un problema](https://github.com/DaringName1/pdfvex-pdfix/issues)
