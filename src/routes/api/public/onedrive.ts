import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://connector-gateway.lovable.dev/microsoft_onedrive/v1.0";
const FOLDER = "Cotizaciones";

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["MICROSOFT_ONEDRIVE_API_KEY"];
  if (!lovableKey || !connKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connKey,
  } as Record<string, string>;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const safeName = (n: string) => n.replace(/[\\/:*?"<>|#%]/g, "").slice(0, 180);

export const Route = createFileRoute("/api/public/onedrive")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const h = headers();
        if (!h) return json({ error: "Conexión de OneDrive no configurada." }, 500);

        const url = new URL(request.url);
        const action = url.searchParams.get("action") || "list";

        if (action === "list") {
          const res = await fetch(
            `${GATEWAY}/me/drive/root:/${encodeURIComponent(FOLDER)}:/children?$top=200&$select=id,name,lastModifiedDateTime,size,webUrl,file&$orderby=lastModifiedDateTime desc`,
            { headers: h },
          );
          const text = await res.text();
          if (!res.ok) {
            if (res.status === 404) return json({ files: [] });
            console.error(`OneDrive list failed [${res.status}]: ${text}`);
            return json({ error: `OneDrive [${res.status}]: ${text}` }, res.status);
          }
          const data = JSON.parse(text) as { value?: Array<Record<string, unknown>> };
          const files = (data.value || [])
            .filter((f) => "file" in f)
            .map((f) => ({
              id: String(f["id"] ?? ""),
              nombre: String(f["name"] ?? ""),
              fecha: String(f["lastModifiedDateTime"] ?? ""),
              url: String(f["webUrl"] ?? ""),
            }));
          return json({ files });
        }

        if (action === "download") {
          const id = url.searchParams.get("id");
          if (!id) return json({ error: "Falta el id del archivo." }, 400);
          const res = await fetch(`${GATEWAY}/me/drive/items/${encodeURIComponent(id)}/content`, {
            headers: h,
          });
          if (!res.ok) {
            const text = await res.text();
            console.error(`OneDrive download failed [${res.status}]: ${text}`);
            return json({ error: `OneDrive [${res.status}]: ${text}` }, res.status);
          }
          const buf = new Uint8Array(await res.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
          return json({ contenido: btoa(bin) });
        }

        return json({ error: "Acción no soportada." }, 400);
      },

      POST: async ({ request }) => {
        const h = headers();
        if (!h) return json({ error: "Conexión de OneDrive no configurada." }, 500);

        const body = (await request.json()) as { nombre?: string; contenido?: unknown };
        const nombre = safeName(String(body.nombre || "").trim());
        if (!nombre) return json({ error: "Falta el nombre del archivo." }, 400);
        if (body.contenido == null) return json({ error: "Falta el contenido." }, 400);

        const payload = JSON.stringify(body.contenido, null, 2);
        const res = await fetch(
          `${GATEWAY}/me/drive/root:/${encodeURIComponent(FOLDER)}/${encodeURIComponent(nombre)}:/content`,
          { method: "PUT", headers: { ...h, "Content-Type": "application/json" }, body: payload },
        );
        const text = await res.text();
        if (!res.ok) {
          console.error(`OneDrive save failed [${res.status}]: ${text}`);
          return json({ error: `OneDrive [${res.status}]: ${text}` }, res.status);
        }
        const saved = JSON.parse(text) as Record<string, unknown>;
        return json({ ok: true, id: saved["id"], nombre: saved["name"] });
      },
    },
  },
});
