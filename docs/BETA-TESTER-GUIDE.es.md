# Guía de pruebas de PDFVEX / PDFix Beta 3

PDFVEX es el nuevo nombre de PDFix. Beta 3 todavía muestra PDFix dentro de la aplicación; el nombre cambiará allí en la actualización 3.

Reserva unos 15 minutos. Usa un PDF de ejemplo creado para la prueba y, si puedes, una computadora de pruebas. No uses documentos importantes.

## Consigue el instalador

1. Cuando esté disponible, descarga el instalador de Beta 3 y su suma SHA-256 publicada desde [las versiones de PDFix para Windows](https://github.com/DaringName1/pdfvex-pdfix/releases).
2. Abre PowerShell en la carpeta de descargas. Ejecuta el siguiente comando con el nombre real del instalador. Compara los 64 caracteres del resultado con la suma publicada. Detente si no coinciden.

   ```powershell
   Get-FileHash -Algorithm SHA256 -LiteralPath '.\PDFix-Setup-YYYY-MM-DD-COMMIT.exe'
   ```

3. Si confías en la fuente de la descarga, abre el instalador que comprobaste. El instalador no tiene firma digital. Si SmartScreen muestra **Windows protegió su PC**, puedes elegir **Más información → Ejecutar de todas formas** si la configuración de Windows lo permite. Cuando termine la instalación, abre **PDFix** desde Inicio.

## Prueba una tarea habitual con un PDF

1. Desde **Home (Inicio)**, abre un PDF de prueba. En **Quick edit**, busca una palabra, resáltala, añade un comentario y dibuja una línea corta. Prueba Deshacer y Rehacer.
2. Elige **Save a copy** y ponle un nombre nuevo. Abre ambos archivos. Comprueba que la copia tenga tus cambios y que el original se vea igual que antes.
3. Desde **Home (Inicio)**, elige **Fill and sign** y abre un formulario de prueba. Escribe una respuesta como «Málaga» en un campo. Vuelve a Inicio y elige el mismo PDF con **Fill and sign**. Comprueba que el panel se vuelva a abrir y que tu respuesta siga ahí. Guarda una copia rellenada y ábrela de nuevo.
4. Prueba **Sign** con un nombre inventado. Haz clic donde debe aparecer la firma, sigue las indicaciones y comprueba la copia guardada. La firma de esta prueba es visible en el documento.
5. Abre **Print**, mira la vista previa y ciérrala. Abre otra herramienta y comprueba que el PDF original siga abierto.

Si compruebas la actualización desde Beta 1, ejecuta el instalador aprobado de Beta 3 sobre la instalación de prueba existente. Comprueba que sigan disponibles un archivo de prueba reciente, una firma de prueba, un ajuste que cambiaste y un borrador sin guardar. Indica cuáles comprobaste.

## Cuenta qué pasó

Incluye la versión de PDFix que aparece en **Settings**, la versión de Windows, los pasos exactos, lo que esperabas y lo que viste al volver a abrir la copia guardada. Usa [GitHub Issues](https://github.com/DaringName1/pdfvex-pdfix/issues) para problemas comunes y las [instrucciones de reporte privado](../SECURITY.md) para vulnerabilidades.

**Nunca subas documentos personales, médicos, financieros ni confidenciales.** Usa ejemplos inventados. Las capturas deben mostrar la aplicación real con documentos creados para la prueba. Antes de compartir informes o capturas, revisa que no muestren nombres, rutas de archivos ni archivos recientes privados.

Consulta las [notas de la versión](release/RELEASE-NOTES-0.1.0-beta.3.es.md) y los [problemas conocidos (en inglés)](../KNOWN-ISSUES.md).
