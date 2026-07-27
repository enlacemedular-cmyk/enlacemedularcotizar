import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Send, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type Cotizacion,
  type Item,
  buildHtmlDocument,
  buildPayload,
  calcTotals,
  formatCOP,
  itemTotal,
  seccionTotal,
  LOGO_ISOLOGO,
  LOGO_IMAGOTIPO,
} from "@/lib/cotizacion";

const WEBHOOK = "https://hook.us2.make.com/aimmobwgqp7wanb2y5o96ic4v5ej6cjc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MEDULAR | Generador de Cotizaciones Comerciales" },
      {
        name: "description",
        content:
          "Formulario avanzado para crear, enviar y descargar cotizaciones comerciales de construcción, diseño y remodelación MEDULAR.",
      },
      { property: "og:title", content: "MEDULAR | Generador de Cotizaciones" },
      {
        property: "og:description",
        content:
          "Crea cotizaciones profesionales con secciones e ítems dinámicos, cálculo automático de IVA y descarga instantánea.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: LOGO_ISOLOGO },
      { name: "twitter:image", content: LOGO_ISOLOGO },
    ],
    links: [{ rel: "icon", href: LOGO_IMAGOTIPO, type: "image/png" }],
  }),
  component: App,
});

const uid = () => Math.random().toString(36).slice(2, 10);
const emptyItem = (): Item => ({ id: uid(), descripcion: "", cantidad: 1, valorUnitario: 0 });
const today = () => new Date().toISOString().slice(0, 10);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Section({
  title,
  step,
  children,
  action,
}: {
  title: string;
  step: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {step}
          </span>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function App() {
  const [data, setData] = useState<Cotizacion>({
    cotizacion_numero: "MED-0001",
    fecha_emision: today(),
    fecha_vencimiento: today(),
    cliente_nombre: "",
    cliente_empresa: "",
    cliente_nit: "",
    cliente_telefono: "",
    cliente_email: "",
    proyecto_nombre: "",
    proyecto_ubicacion: "",
    asesor_nombre: "",
    iva_porcentaje: 19,
    condiciones_pago: "50% anticipo, 50% contra entrega.",
    tiempo_entrega: "",
    validez_oferta: "15 días calendario.",
    secciones: [{ id: uid(), nombre: "Fase 1", items: [emptyItem()] }],
  });
  const [sending, setSending] = useState(false);

  const set = <K extends keyof Cotizacion>(k: K, v: Cotizacion[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const totals = useMemo(() => calcTotals(data), [data]);

  const addSeccion = () =>
    setData((d) => ({
      ...d,
      secciones: [
        ...d.secciones,
        { id: uid(), nombre: `Fase ${d.secciones.length + 1}`, items: [emptyItem()] },
      ],
    }));

  const removeSeccion = (id: string) =>
    setData((d) => ({ ...d, secciones: d.secciones.filter((s) => s.id !== id) }));

  const updateSeccion = (id: string, nombre: string) =>
    setData((d) => ({
      ...d,
      secciones: d.secciones.map((s) => (s.id === id ? { ...s, nombre } : s)),
    }));

  const addItem = (sid: string) =>
    setData((d) => ({
      ...d,
      secciones: d.secciones.map((s) =>
        s.id === sid ? { ...s, items: [...s.items, emptyItem()] } : s,
      ),
    }));

  const removeItem = (sid: string, iid: string) =>
    setData((d) => ({
      ...d,
      secciones: d.secciones.map((s) =>
        s.id === sid ? { ...s, items: s.items.filter((i) => i.id !== iid) } : s,
      ),
    }));

  const updateItem = (sid: string, iid: string, patch: Partial<Item>) =>
    setData((d) => ({
      ...d,
      secciones: d.secciones.map((s) =>
        s.id === sid
          ? { ...s, items: s.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) }
          : s,
      ),
    }));

  const handleSend = async () => {
    if (!data.cliente_nombre.trim()) {
      toast.error("Ingresa el nombre del cliente antes de enviar.");
      return;
    }
    setSending(true);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify(buildPayload(data)),
      });
      toast.success("Cotización enviada", {
        description: `Nº ${data.cotizacion_numero} · ${formatCOP(totals.totalGeneral)}`,
      });
    } catch {
      toast.error("No se pudo enviar la cotización. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    const html = buildHtmlDocument(data);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cotizacion-${data.cotizacion_numero || "MEDULAR"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo descargado", {
      description: "Ábrelo e imprime como PDF si lo necesitas.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-5">
          <img src={LOGO_ISOLOGO} alt="MEDULAR" className="h-10 w-auto" />
          <div className="text-right">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Generador de Cotizaciones
            </p>
            <p className="text-xs text-muted-foreground">
              Construcción · Diseño · Remodelación
            </p>
          </div>
        </div>
        <div className="h-[3px] w-full bg-accent" />
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <Section title="Información de la cotización" step="1">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Número de cotización">
              <Input
                value={data.cotizacion_numero}
                onChange={(e) => set("cotizacion_numero", e.target.value)}
              />
            </Field>
            <Field label="Fecha de emisión">
              <Input
                type="date"
                value={data.fecha_emision}
                onChange={(e) => set("fecha_emision", e.target.value)}
              />
            </Field>
            <Field label="Fecha de vencimiento">
              <Input
                type="date"
                value={data.fecha_vencimiento}
                onChange={(e) => set("fecha_vencimiento", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Datos del cliente" step="2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">
              <Input
                value={data.cliente_nombre}
                onChange={(e) => set("cliente_nombre", e.target.value)}
                placeholder="Ej. Ana María Restrepo"
              />
            </Field>
            <Field label="Empresa">
              <Input
                value={data.cliente_empresa}
                onChange={(e) => set("cliente_empresa", e.target.value)}
              />
            </Field>
            <Field label="NIT / CC">
              <Input value={data.cliente_nit} onChange={(e) => set("cliente_nit", e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <Input
                value={data.cliente_telefono}
                onChange={(e) => set("cliente_telefono", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={data.cliente_email}
                onChange={(e) => set("cliente_email", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Datos del proyecto" step="3">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nombre del proyecto">
              <Input
                value={data.proyecto_nombre}
                onChange={(e) => set("proyecto_nombre", e.target.value)}
              />
            </Field>
            <Field label="Ubicación">
              <Input
                value={data.proyecto_ubicacion}
                onChange={(e) => set("proyecto_ubicacion", e.target.value)}
              />
            </Field>
            <Field label="Asesor">
              <Input
                value={data.asesor_nombre}
                onChange={(e) => set("asesor_nombre", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Detalle de la cotización"
          step="4"
          action={
            <Button type="button" variant="outlineAccent" size="sm" onClick={addSeccion}>
              <Plus className="size-4" /> Añadir sección
            </Button>
          }
        >
          <div className="space-y-5">
            {data.secciones.map((s, si) => (
              <div key={s.id} className="rounded-lg border border-border bg-secondary/40 p-4">
                <div className="mb-4 flex items-end gap-3">
                  <div className="flex-1">
                    <Field label={`Sección ${si + 1}`}>
                      <Input
                        value={s.nombre}
                        onChange={(e) => updateSeccion(s.id, e.target.value)}
                        placeholder="Ej. Obra gris"
                        className="bg-card font-semibold"
                      />
                    </Field>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar sección"
                    onClick={() => removeSeccion(s.id)}
                    disabled={data.secciones.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {s.items.map((i) => (
                    <div
                      key={i.id}
                      className="grid grid-cols-1 items-end gap-3 rounded-md bg-card p-3 sm:grid-cols-[1fr_90px_140px_140px_40px]"
                    >
                      <Field label="Descripción">
                        <Input
                          value={i.descripcion}
                          onChange={(e) => updateItem(s.id, i.id, { descripcion: e.target.value })}
                          placeholder="Descripción del ítem"
                        />
                      </Field>
                      <Field label="Cantidad">
                        <Input
                          type="number"
                          min={0}
                          value={i.cantidad}
                          onChange={(e) =>
                            updateItem(s.id, i.id, { cantidad: Number(e.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Valor unitario">
                        <Input
                          type="number"
                          min={0}
                          value={i.valorUnitario}
                          onChange={(e) =>
                            updateItem(s.id, i.id, { valorUnitario: Number(e.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Total">
                        <div className="flex h-9 items-center justify-end rounded-md border border-border bg-secondary px-3 text-sm font-semibold tabular-nums text-foreground">
                          {formatCOP(itemTotal(i))}
                        </div>
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar ítem"
                        onClick={() => removeItem(s.id, i.id)}
                        disabled={s.items.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Button type="button" variant="outlineAccent" size="sm" onClick={() => addItem(s.id)}>
                    <Plus className="size-4" /> Añadir ítem
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Subtotal sección:{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCOP(seccionTotal(s))}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Totales" step="5">
          <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
            <Field label="IVA (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={data.iva_porcentaje}
                onChange={(e) => set("iva_porcentaje", Number(e.target.value))}
              />
            </Field>
            <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatCOP(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA ({data.iva_porcentaje || 0}%)</span>
                <span className="font-semibold tabular-nums">{formatCOP(totals.ivaTotal)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-accent pt-2 text-base">
                <span className="font-bold">TOTAL</span>
                <span className="font-extrabold text-accent tabular-nums">
                  {formatCOP(totals.totalGeneral)}
                </span>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Condiciones" step="6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Condiciones de pago">
              <Textarea
                rows={3}
                value={data.condiciones_pago}
                onChange={(e) => set("condiciones_pago", e.target.value)}
              />
            </Field>
            <Field label="Tiempo de entrega">
              <Textarea
                rows={3}
                value={data.tiempo_entrega}
                onChange={(e) => set("tiempo_entrega", e.target.value)}
              />
            </Field>
            <Field label="Validez de la oferta">
              <Textarea
                rows={3}
                value={data.validez_oferta}
                onChange={(e) => set("validez_oferta", e.target.value)}
              />
            </Field>
          </div>
        </Section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMAGOTIPO} alt="" className="h-8 w-auto opacity-80" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total general</p>
              <p className="text-lg font-extrabold tabular-nums text-foreground">
                {formatCOP(totals.totalGeneral)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outlineAccent" onClick={handleDownload}>
              <Download className="size-4" /> Descargar archivo directamente
            </Button>
            <Button type="button" variant="accent" onClick={handleSend} disabled={sending}>
              {sending ? <FileText className="size-4 animate-pulse" /> : <Send className="size-4" />}
              {sending ? "Enviando…" : "Generar y enviar cotización"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
