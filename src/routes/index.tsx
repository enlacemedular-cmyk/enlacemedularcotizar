import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Send, Download, FileText, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Cotizacion,
  type Cuenta,
  type Item,
  type Pago,
  ASESORES,
  ENTIDADES,
  TIPOS_CUENTA,
  ENTREGA_BASES,
  ENTREGA_TIPOS,
  buildHtmlDocument,
  buildPayload,
  calcTotals,
  diasVigencia,
  entregaTexto,
  formatCOP,
  itemTotal,
  seccionTotal,
  sumPagos,
  validarCotizacion,
  LOGO_ISOLOGO,
  LOGO_IMAGOTIPO,
} from "@/lib/cotizacion";
import { autocorregir } from "@/lib/autocorrect";


const WEBHOOK = "https://hook.us2.make.com/aimmobwgqp7wanb2y5o96ic4v5ej6cjc";
const DRAFT_KEY = "medular.cotizacion.draft";
const SEQ_KEY = "medular.cotizacion.seq";

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
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const formatConsecutivo = (n: number) => `MET${String(n).padStart(4, "0")}`;

function readSeq(): number {
  if (typeof window === "undefined") return 1;
  const raw = Number(window.localStorage.getItem(SEQ_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

const cuentasBase = (): Cuenta[] => [
  {
    id: uid(),
    entidad: "Bancolombia",
    tipo: "Ahorros",
    numero: "",
    titular: "Cesar Augusto Medina Valderrama",
    nit: "",
  },
  { id: uid(), entidad: "Nequi", tipo: "Nequi", numero: "", titular: "Cesar Augusto Medina Valderrama", nit: "" },
];

function baseCotizacion(numero: string): Cotizacion {
  return {
    cotizacion_numero: numero,
    fecha_emision: today(),
    fecha_vencimiento: plusDays(15),
    cliente_nombre: "",
    cliente_empresa: "",
    cliente_nit: "",
    cliente_telefono: "",
    cliente_email: "",
    proyecto_nombre: "",
    proyecto_ubicacion: "",
    asesor_nombre: ASESORES[0],
    asesor_cargo: "Asesor Comercial",
    asesor_telefono: "",
    asesor_email: "",
    asesores_adicionales: [],
    iva_porcentaje: 19,
    pagos: [
      { id: uid(), concepto: "Anticipo", porcentaje: 50 },
      { id: uid(), concepto: "Contra entrega", porcentaje: 50 },
    ],
    cuentas: cuentasBase(),
    entrega_dias: 30,
    entrega_tipo: ENTREGA_TIPOS[0],
    entrega_base: ENTREGA_BASES[0],
    validez_dias: 15,
    secciones: [{ id: uid(), nombre: "Fase 1", items: [emptyItem()] }],
  };
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  const [data, setData] = useState<Cotizacion>(() => baseCotizacion(formatConsecutivo(1)));
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const seqRef = useRef(1);

  // Restaurar borrador guardado y consecutivo
  useEffect(() => {
    const seq = readSeq();
    seqRef.current = seq;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Cotizacion;
        setData({ ...baseCotizacion(formatConsecutivo(seq)), ...parsed });
      } catch {
        setData(baseCotizacion(formatConsecutivo(seq)));
      }
    } else {
      setData(baseCotizacion(formatConsecutivo(seq)));
    }
    setHydrated(true);
  }, []);

  // Guardado automático
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const set = <K extends keyof Cotizacion>(k: K, v: Cotizacion[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const totals = useMemo(() => calcTotals(data), [data]);
  const pagosSuma = sumPagos(data.pagos);
  const pagosOk = pagosSuma === 100;
  const dias = diasVigencia(data);
  const validezError =
    data.validez_dias < 1 || data.validez_dias > 90
      ? "La validez debe estar entre 1 y 90 días."
      : dias !== null && dias >= 0 && data.validez_dias > dias
        ? `No puede superar los ${dias} días hasta el vencimiento.`
        : null;

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

  const addPago = () =>
    setData((d) => ({ ...d, pagos: [...d.pagos, { id: uid(), concepto: "", porcentaje: 0 }] }));
  const removePago = (id: string) =>
    setData((d) => ({ ...d, pagos: d.pagos.filter((p) => p.id !== id) }));
  const updatePago = (id: string, patch: Partial<Pago>) =>
    setData((d) => ({
      ...d,
      pagos: d.pagos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const addCuenta = () =>
    setData((d) => ({
      ...d,
      cuentas: [
        ...d.cuentas,
        { id: uid(), entidad: ENTIDADES[0], tipo: TIPOS_CUENTA[0], numero: "", titular: d.asesor_nombre, nit: "" },
      ],
    }));
  const removeCuenta = (id: string) =>
    setData((d) => ({ ...d, cuentas: d.cuentas.filter((c) => c.id !== id) }));
  const updateCuenta = (id: string, patch: Partial<Cuenta>) =>
    setData((d) => ({
      ...d,
      cuentas: d.cuentas.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  /** Autocorrige ortografía/redacción al salir del campo. */
  const corregirItem = (sid: string, iid: string, valor: string) => {
    const fixed = autocorregir(valor);
    if (fixed !== valor) {
      updateItem(sid, iid, { descripcion: fixed });
      toast.success("Ortografía corregida", { description: fixed });
    }
  };

  const asesoresDisponibles = ASESORES.filter((a) => a !== data.asesor_nombre);


  const nuevaCotizacion = (avanzar: boolean) => {
    const next = avanzar ? seqRef.current + 1 : seqRef.current;
    seqRef.current = next;
    window.localStorage.setItem(SEQ_KEY, String(next));
    window.localStorage.removeItem(DRAFT_KEY);
    setData(baseCotizacion(formatConsecutivo(next)));
    toast.success(avanzar ? `Nueva cotización ${formatConsecutivo(next)}` : "Formulario reiniciado");
  };

  const handleSend = async () => {
    const errores = validarCotizacion(data);
    if (errores.length) {
      toast.error("Revisa el formulario", { description: errores[0] });
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
      nuevaCotizacion(true);
    } catch {
      toast.error("No se pudo enviar la cotización. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    const html = buildHtmlDocument(data);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1000);
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) return cleanup();
      const done = () => {
        win.focus();
        win.print();
        cleanup();
      };
      const imgs = Array.from(win.document.images);
      Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.onload = () => res();
                img.onerror = () => res();
              }),
        ),
      ).then(() => setTimeout(done, 350));
    };

    iframe.srcdoc = html;
    toast.success("Generando PDF", {
      description: `Elige "Guardar como PDF" en el diálogo de impresión.`,
    });
  };


  return (
    <div className="min-h-screen bg-background pb-44">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary p-2">
              <img src={LOGO_IMAGOTIPO} alt="" className="h-full w-auto" />
            </span>
            <img src={LOGO_ISOLOGO} alt="MEDULAR" className="hidden h-9 w-auto sm:block" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Generador de Cotizaciones
            </p>
            <p className="text-xs text-muted-foreground">Construcción · Diseño · Remodelación</p>
          </div>
        </div>
        <div className="h-[3px] w-full bg-accent" />
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <Section title="Información de la cotización" step="1">
          <div className="grid gap-4 sm:grid-cols-4">
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
                min={data.fecha_emision}
                value={data.fecha_vencimiento}
                onChange={(e) => set("fecha_vencimiento", e.target.value)}
              />
            </Field>
            <Field label="Validez de la oferta (días)">
              <Input
                type="number"
                min={1}
                max={90}
                value={data.validez_dias}
                onChange={(e) => set("validez_dias", Number(e.target.value))}
                aria-invalid={!!validezError}
              />
            </Field>
          </div>
          {validezError && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3.5" /> {validezError}
            </p>
          )}
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

        <Section title="Proyecto y asesor" step="3">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nombre del proyecto">
              <Input
                value={data.proyecto_nombre}
                onChange={(e) => set("proyecto_nombre", e.target.value)}
                placeholder="Ej. Remodelación de Cocina Residencial"
              />
            </Field>
            <Field label="Ubicación">
              <Input
                value={data.proyecto_ubicacion}
                onChange={(e) => set("proyecto_ubicacion", e.target.value)}
              />
            </Field>
            <Field label="Asesor principal">
              <Select
                value={data.asesor_nombre}
                onValueChange={(v) => set("asesor_nombre", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un asesor" />
                </SelectTrigger>
                <SelectContent>
                  {ASESORES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Cargo del asesor">
              <Input
                value={data.asesor_cargo}
                onChange={(e) => set("asesor_cargo", e.target.value)}
                placeholder="Ej. Asesor Comercial"
              />
            </Field>
            <Field label="Teléfono del asesor">
              <Input
                value={data.asesor_telefono}
                onChange={(e) => set("asesor_telefono", e.target.value)}
              />
            </Field>
            <Field label="Email del asesor">
              <Input
                type="email"
                value={data.asesor_email}
                onChange={(e) => set("asesor_email", e.target.value)}
              />
            </Field>
          </div>


          <div className="mt-4 space-y-3">
            {data.asesores_adicionales.map((a, idx) => (
              <div key={idx} className="flex items-end gap-3">
                <div className="flex-1">
                  <Field label={`Asesor adicional ${idx + 1}`}>
                    <Select
                      value={a}
                      onValueChange={(v) =>
                        set(
                          "asesores_adicionales",
                          data.asesores_adicionales.map((x, i) => (i === idx ? v : x)),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un asesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASESORES.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar asesor"
                  onClick={() =>
                    set(
                      "asesores_adicionales",
                      data.asesores_adicionales.filter((_, i) => i !== idx),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outlineAccent"
              size="sm"
              disabled={!asesoresDisponibles.length}
              onClick={() =>
                set("asesores_adicionales", [
                  ...data.asesores_adicionales,
                  asesoresDisponibles[0] ?? "",
                ])
              }
            >
              <Plus className="size-4" /> Añadir asesor
            </Button>
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
                        placeholder="Ej. Fase 1: Demolición"
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
                          onBlur={(e) => corregirItem(s.id, i.id, e.target.value)}
                          spellCheck
                          lang="es"
                          autoCapitalize="sentences"
                          placeholder="Descripción del ítem (se corrige automáticamente)"
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
                        <div className="flex h-9 items-center justify-end rounded-md border border-border bg-secondary/60 px-3 text-sm font-semibold tabular-nums">
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
                  <Button
                    type="button"
                    variant="outlineAccent"
                    size="sm"
                    onClick={() => addItem(s.id)}
                  >
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

        <Section
          title="Condiciones de pago"
          step="6"
          action={
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                pagosOk
                  ? "bg-accent/15 text-accent"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {pagosOk ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              {pagosSuma}% de 100%
            </span>
          }
        >
          <div className="space-y-3">
            {data.pagos.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-1 items-end gap-3 rounded-md border border-border bg-secondary/40 p-3 sm:grid-cols-[1fr_110px_150px_40px]"
              >
                <Field label="Concepto">
                  <Input
                    value={p.concepto}
                    onChange={(e) => updatePago(p.id, { concepto: e.target.value })}
                    placeholder="Ej. Anticipo, Acta de avance"
                    className="bg-card"
                  />
                </Field>
                <Field label="Porcentaje">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={p.porcentaje}
                    onChange={(e) => updatePago(p.id, { porcentaje: Number(e.target.value) })}
                    className="bg-card"
                  />
                </Field>
                <Field label="Valor">
                  <div className="flex h-9 items-center justify-end rounded-md border border-border bg-card px-3 text-sm font-semibold tabular-nums">
                    {formatCOP((totals.totalGeneral * (p.porcentaje || 0)) / 100)}
                  </div>
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar condición"
                  onClick={() => removePago(p.id)}
                  disabled={data.pagos.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outlineAccent" size="sm" onClick={addPago}>
              <Plus className="size-4" /> Añadir condición de pago
            </Button>
            {!pagosOk && (
              <p className="flex items-center gap-2 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3.5" />
                Los porcentajes deben sumar exactamente 100% para poder enviar.
              </p>
            )}
          </div>
        </Section>

        <Section title="Tiempo de entrega" step="7">
          <div className="grid gap-4 sm:grid-cols-[120px_180px_1fr]">
            <Field label="Cantidad">
              <Input
                type="number"
                min={1}
                value={data.entrega_dias}
                onChange={(e) => set("entrega_dias", Number(e.target.value))}
              />
            </Field>
            <Field label="Unidad">
              <Select value={data.entrega_tipo} onValueChange={(v) => set("entrega_tipo", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTREGA_TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Condición de inicio">
              <Select value={data.entrega_base} onValueChange={(v) => set("entrega_base", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTREGA_BASES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <p className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            {entregaTexto(data)}
          </p>
        </Section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMAGOTIPO} alt="" className="h-8 w-auto opacity-80" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total general · {data.cotizacion_numero}
              </p>
              <p className="text-lg font-extrabold tabular-nums text-foreground">
                {formatCOP(totals.totalGeneral)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="ghost" onClick={() => nuevaCotizacion(false)}>
              <RotateCcw className="size-4" /> Limpiar
            </Button>
            <Button type="button" variant="outlineAccent" onClick={handleDownload}>
              <Download className="size-4" /> Descargar
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={handleSend}
              disabled={sending || !pagosOk || !!validezError}
            >
              {sending ? <FileText className="size-4 animate-pulse" /> : <Send className="size-4" />}
              {sending ? "Enviando…" : "Generar y enviar cotización"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
