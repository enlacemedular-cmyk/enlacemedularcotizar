import { createFileRoute } from "@tanstack/react-router";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/redaccion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json({ sugerencia: "" });

        let texto = "";
        let contexto = "";
        try {
          const body = (await request.json()) as { texto?: string; contexto?: string };
          texto = (body.texto || "").toString().slice(0, 800);
          contexto = (body.contexto || "").toString().slice(0, 120);
        } catch {
          return json({ sugerencia: "" });
        }
        if (texto.trim().length < 4) return json({ sugerencia: "" });

        try {
          const res = await fetch(AI_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content:
                    "Eres un corrector de redacción técnica en español para cotizaciones de construcción, diseño y remodelación en Colombia. Recibes un texto de un campo de formulario y devuelves ÚNICAMENTE la versión corregida y mejorada (ortografía, tildes, sintaxis, claridad y tono profesional). No agregues datos, precios ni información que no esté en el texto. No uses comillas, ni explicaciones, ni prefijos. Si el texto ya está correcto, devuelve exactamente el mismo texto.",
                },
                {
                  role: "user",
                  content: `Campo: ${contexto || "descripción"}\nTexto: ${texto}`,
                },
              ],
              temperature: 0.2,
              max_tokens: 400,
            }),
          });
          if (!res.ok) return json({ sugerencia: "" });
          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const raw = (data.choices?.[0]?.message?.content || "").trim().replace(/^["'`]+|["'`]+$/g, "");
          const sugerencia = raw && raw !== texto.trim() ? raw : "";
          return json({ sugerencia });
        } catch {
          return json({ sugerencia: "" });
        }
      },
    },
  },
});
