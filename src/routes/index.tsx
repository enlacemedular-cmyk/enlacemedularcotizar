import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MEDULAR · Cotizaciones de construcción y remodelación" },
      {
        name: "description",
        content:
          "Genera cotizaciones profesionales de MEDULAR: ítems, condiciones de pago, PDF y Word listos para enviar al cliente.",
      },
      { property: "og:title", content: "MEDULAR · Cotizaciones de construcción y remodelación" },
      {
        property: "og:description",
        content:
          "Genera cotizaciones profesionales de MEDULAR: ítems, condiciones de pago, PDF y Word listos para enviar al cliente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="h-screen w-full bg-background">
      <h1 className="sr-only">MEDULAR · Generador de cotizaciones</h1>
      <iframe
        src="/cotizador.html"
        title="Generador de cotizaciones MEDULAR"
        className="h-full w-full border-0"
        allow="clipboard-write"
      />
    </main>
  );
}
