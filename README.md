# Medular Quote Builder

Crea una aplicación web de una sola página (SPA) que funcione como un formulario avanzado para generar cotizaciones comerciales para la marca "MEDULAR" (servicios de construcción, diseño y remodelación). Ya tengo la plantilla HTML del contrato/cotización, por lo que tu trabajo es crear la interfaz de usuario (UI) para capturar los datos, enviarlos por webhook y ofrecer la opción de descarga.

1. Diseño e Identidad Visual:

Colores: Utiliza una paleta elegante, minimalista y profesional. El fondo debe ser un gris muy claro o blanco (ej. #F9FAFB, #FFFFFF). Usa texto principal oscuro (#111827). El color de acento principal (para botones primarios, bordes activos y detalles) debe ser dorado/ocre (#C59B27).

Logos: En el encabezado superior de la app, utiliza el isologo principal: [https://imglink.cc/cdn/ZF7ejqiY89.png](https://imglink.cc/cdn/ZF7ejqiY89.png). Para detalles más pequeños o iconos/favicon, utiliza el imagotipo (figura sola): [https://imglink.cc/cdn/ImDpSCV78S.png](https://imglink.cc/cdn/ImDpSCV78S.png).

Estilo UI: Estilo moderno, tarjetas (cards) con sombras suaves, campos de texto limpios con bordes redondeados y tipografía sans-serif (como Inter o Roboto).

2. Estructura del Formulario (Inputs necesarios): Divide el formulario en las siguientes secciones (pueden ser tarjetas o un formato tipo acordeón):

Información de la Cotización: Número de cotización, Fecha de emisión, Fecha de vencimiento.

Datos del Cliente: Nombre completo, Empresa, NIT/CC, Teléfono, Email.

Datos del Proyecto: Nombre del proyecto, Ubicación, Nombre del Asesor.

Detalle de la Cotización (Dinámico): Esto es crucial. Necesito que el usuario pueda agregar múltiples "Secciones" o "Fases". Dentro de cada "Sección", el usuario debe poder agregar múltiples "Ítems". Cada ítem debe pedir: Descripción, Cantidad, Valor Unitario y Total. La app debe calcular automáticamente el Total del ítem (Cantidad x Valor Unitario).

Totales: Subtotal (calculado automáticamente), Porcentaje de IVA (input), Total IVA (calculado) y Total General (calculado).

Condiciones: Condiciones de pago, Tiempo de entrega, Validez de la oferta.

3. Acciones y Botones (Footer de la app): En la parte inferior, la interfaz debe tener dos botones de acción principales:

Botón 1: "Generar y Enviar Cotización" (Primario, color #C59B27). Al hacer clic, la app debe tomar todo el estado del formulario, empaquetarlo en un objeto JSON estructurado (asegurándote de que las secciones y los ítems estén en un arreglo de objetos) y enviarlo mediante una petición POST al siguiente Webhook: [https://hook.us2.make.com/aimmobwgqp7wanb2y5o96ic4v5ej6cjc](https://hook.us2.make.com/aimmobwgqp7wanb2y5o96ic4v5ej6cjc). Muestra un mensaje de éxito ("toast" notification) al enviarlo.

Botón 2: "Descargar Archivo Directamente" (Secundario, borde #C59B27 y texto oscuro o viceversa). Al hacer clic, la app debe permitir descargar un archivo que combine los datos ingresados. (Nota para la IA: prepara la lógica del botón para que desencadene una descarga de archivo local o convierta los datos capturados a un documento, según los datos en pantalla).

Por favor, prioriza que la experiencia de usuario (UX) al agregar nuevas secciones e ítems dinámicos sea muy intuitiva, usando botones de "Añadir Sección" y "Añadir Ítem" claros.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://enlacemedularcotizar.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c656746-f29a-46b2-b8ca-ba4684b62c86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
