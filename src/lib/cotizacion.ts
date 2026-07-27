export interface Item {
  id: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

export interface Seccion {
  id: string;
  nombre: string;
  items: Item[];
}

export interface Cotizacion {
  cotizacion_numero: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente_nombre: string;
  cliente_empresa: string;
  cliente_nit: string;
  cliente_telefono: string;
  cliente_email: string;
  proyecto_nombre: string;
  proyecto_ubicacion: string;
  asesor_nombre: string;
  iva_porcentaje: number;
  condiciones_pago: string;
  tiempo_entrega: string;
  validez_oferta: string;
  secciones: Seccion[];
}

export const LOGO_ISOLOGO = "https://imglink.cc/cdn/ZF7ejqiY89.png";
export const LOGO_IMAGOTIPO = "https://imglink.cc/cdn/ImDpSCV78S.png";

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const itemTotal = (i: Item) => (i.cantidad || 0) * (i.valorUnitario || 0);

export const seccionTotal = (s: Seccion) =>
  s.items.reduce((acc, i) => acc + itemTotal(i), 0);

export function calcTotals(data: Cotizacion) {
  const subtotal = data.secciones.reduce((acc, s) => acc + seccionTotal(s), 0);
  const ivaTotal = subtotal * ((data.iva_porcentaje || 0) / 100);
  return { subtotal, ivaTotal, totalGeneral: subtotal + ivaTotal };
}

export function buildPayload(data: Cotizacion) {
  const { subtotal, ivaTotal, totalGeneral } = calcTotals(data);
  return {
    cotizacion_numero: data.cotizacion_numero,
    fecha_emision: data.fecha_emision,
    fecha_vencimiento: data.fecha_vencimiento,
    cliente_nombre: data.cliente_nombre,
    cliente_empresa: data.cliente_empresa,
    cliente_nit: data.cliente_nit,
    cliente_telefono: data.cliente_telefono,
    cliente_email: data.cliente_email,
    proyecto_nombre: data.proyecto_nombre,
    proyecto_ubicacion: data.proyecto_ubicacion,
    asesor_nombre: data.asesor_nombre,
    condiciones_pago: data.condiciones_pago,
    tiempo_entrega: data.tiempo_entrega,
    validez_oferta: data.validez_oferta,
    iva_porcentaje: data.iva_porcentaje,
    subtotal,
    subtotal_formato: formatCOP(subtotal),
    iva_total: ivaTotal,
    iva_total_formato: formatCOP(ivaTotal),
    total_general: totalGeneral,
    total_general_formato: formatCOP(totalGeneral),
    secciones: data.secciones.map((s) => ({
      seccion_nombre: s.nombre,
      seccion_total: seccionTotal(s),
      seccion_total_formato: formatCOP(seccionTotal(s)),
      items: s.items.map((i) => ({
        item_descripcion: i.descripcion,
        item_cantidad: i.cantidad,
        item_valor_unitario: i.valorUnitario,
        item_valor_unitario_formato: formatCOP(i.valorUnitario),
        item_total: itemTotal(i),
        item_total_formato: formatCOP(itemTotal(i)),
      })),
    })),
  };
}

const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

export function buildHtmlDocument(data: Cotizacion) {
  const { subtotal, ivaTotal, totalGeneral } = calcTotals(data);

  const secciones = data.secciones
    .map(
      (s) => `
    <div style="margin-bottom: 24px;">
      <div style="background: #111827; color: #FFFFFF; padding: 10px 16px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px 4px 0 0;">${esc(s.nombre)}</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #F3F4F6; color: #374151; border-bottom: 2px solid #E5E7EB;">
            <th style="padding: 10px 12px; text-align: left; width: 50%;">Descripción</th>
            <th style="padding: 10px 12px; text-align: center; width: 15%;">Cant.</th>
            <th style="padding: 10px 12px; text-align: right; width: 17%;">Vr. Unitario</th>
            <th style="padding: 10px 12px; text-align: right; width: 18%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${s.items
            .map(
              (i) => `<tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; color: #1F2937; vertical-align: top;">${esc(i.descripcion)}</td>
            <td style="padding: 12px; text-align: center; color: #4B5563; vertical-align: top;">${esc(i.cantidad)}</td>
            <td style="padding: 12px; text-align: right; color: #4B5563; vertical-align: top;">${formatCOP(i.valorUnitario)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 600; color: #111827; vertical-align: top;">${formatCOP(itemTotal(i))}</td>
          </tr>`,
            )
            .join("\n")}
        </tbody>
      </table>
    </div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Cotización ${esc(data.cotizacion_numero)} - MEDULAR</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { box-shadow: none !important; margin: 0 !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#E5E7EB; font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
<div class="page" style="max-width: 850px; margin: 30px auto; background:#FFFFFF; box-shadow: 0 4px 24px rgba(34,37,42,0.12); padding: 0 0 40px 0;">

  <div style="padding: 40px 48px 24px 48px; border-bottom: 3px solid #C59B27; display:table; width:100%; box-sizing:border-box;">
    <div style="display:table-cell; vertical-align:middle; width:55%;">
      <img src="${LOGO_ISOLOGO}" alt="MEDULAR" style="max-width: 160px; height: auto; display: block;" />
    </div>
    <div style="display:table-cell; vertical-align:middle; width:45%; text-align:right;">
      <span style="font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px; display:block;">COTIZACIÓN</span>
      <span style="font-size: 14px; font-weight: 600; color: #C59B27; display:block; margin-top:4px;">Nº ${esc(data.cotizacion_numero)}</span>
      <span style="font-size: 12px; color: #6B7280; display:block; margin-top:6px;">Fecha: ${esc(data.fecha_emision)}</span>
      <span style="font-size: 12px; color: #6B7280; display:block;">Válido hasta: ${esc(data.fecha_vencimiento)}</span>
    </div>
  </div>

  <div style="padding: 32px 48px; display:table; width:100%; box-sizing:border-box; background:#F9FAFB; border-bottom: 1px solid #E5E7EB;">
    <div style="display:table-cell; width:50%; vertical-align:top;">
      <h3 style="font-size: 11px; text-transform: uppercase; color: #9CA3AF; margin: 0 0 8px 0; letter-spacing: 0.8px;">CLIENTE</h3>
      <p style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">${esc(data.cliente_nombre)}</p>
      <p style="font-size: 13px; color: #4B5563; margin: 0 0 2px 0;">${esc(data.cliente_empresa)}</p>
      <p style="font-size: 13px; color: #4B5563; margin: 0 0 2px 0;">NIT/CC: ${esc(data.cliente_nit)}</p>
      <p style="font-size: 13px; color: #4B5563; margin: 0 0 2px 0;">Tel: ${esc(data.cliente_telefono)}</p>
      <p style="font-size: 13px; color: #4B5563; margin: 0;">Email: ${esc(data.cliente_email)}</p>
    </div>
    <div style="display:table-cell; width:50%; vertical-align:top; text-align:right;">
      <h3 style="font-size: 11px; text-transform: uppercase; color: #9CA3AF; margin: 0 0 8px 0; letter-spacing: 0.8px;">PROYECTO</h3>
      <p style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">${esc(data.proyecto_nombre)}</p>
      <p style="font-size: 13px; color: #4B5563; margin: 0 0 2px 0;">Ubicación: ${esc(data.proyecto_ubicacion)}</p>
      <p style="font-size: 13px; color: #4B5563; margin: 0;">Asesor: ${esc(data.asesor_nombre)}</p>
    </div>
  </div>

  <div style="padding: 32px 48px;">
    <h3 style="font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; margin: 0 0 16px 0; letter-spacing: 0.5px;">Detalle de la Cotización</h3>
    ${secciones}

    <div style="margin-top: 32px; float: right; width: 320px;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; color: #4B5563; text-align: right;">Subtotal:</td>
          <td style="padding: 8px 12px; font-weight: 600; color: #111827; text-align: right; width: 140px;">${formatCOP(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; color: #4B5563; text-align: right;">IVA (${esc(data.iva_porcentaje)}%):</td>
          <td style="padding: 8px 12px; font-weight: 600; color: #111827; text-align: right;">${formatCOP(ivaTotal)}</td>
        </tr>
        <tr style="border-top: 2px solid #C59B27; background: #F9FAFB;">
          <td style="padding: 12px; font-weight: 700; color: #111827; text-align: right; font-size: 15px;">TOTAL:</td>
          <td style="padding: 12px; font-weight: 800; color: #C59B27; text-align: right; font-size: 16px;">${formatCOP(totalGeneral)}</td>
        </tr>
      </table>
      <div style="clear: both;"></div>
    </div>
    <div style="clear: both;"></div>

    <div style="margin-top: 48px; border-top: 1px solid #E5E7EB; padding-top: 24px; font-size: 12px; color: #6B7280; line-height: 1.6;">
      <p style="margin: 0 0 4px 0;"><strong style="color: #374151;">Condiciones de pago:</strong> ${esc(data.condiciones_pago)}</p>
      <p style="margin: 0 0 4px 0;"><strong style="color: #374151;">Tiempo de entrega:</strong> ${esc(data.tiempo_entrega)}</p>
      <p style="margin: 0;"><strong style="color: #374151;">Validez de la oferta:</strong> ${esc(data.validez_oferta)}</p>
    </div>

    <div style="margin-top: 60px; display:table; width:100%;">
      <div style="display:table-cell; width:50%;">
        <div style="border-top: 1px solid #9CA3AF; width: 220px; padding-top: 8px;">
          <p style="font-size: 13px; font-weight: 600; color: #111827; margin: 0;">MEDULAR</p>
          <p style="font-size: 11px; color: #6B7280; margin: 2px 0 0 0;">Aceptación / Comercial</p>
        </div>
      </div>
      <div style="display:table-cell; width:50%; text-align:right;">
        <div style="border-top: 1px solid #9CA3AF; width: 220px; padding-top: 8px; margin-left: auto;">
          <p style="font-size: 13px; font-weight: 600; color: #111827; margin: 0;">${esc(data.cliente_nombre)}</p>
          <p style="font-size: 11px; color: #6B7280; margin: 2px 0 0 0;">Aceptado por el Cliente</p>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}
