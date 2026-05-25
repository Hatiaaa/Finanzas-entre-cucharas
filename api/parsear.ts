import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `Eres un asistente de contabilidad para un restaurante.
Tu única tarea es extraer datos de cierres de caja desde texto libre en español.

Devuelve ÚNICAMENTE un objeto JSON válido. Sin explicaciones, sin markdown, sin bloques de código.

Estructura exacta:
{
  "baseInicial": number,
  "conteoFisico": number,
  "productos": [
    {
      "nombre": string,
      "cantidad": number,
      "efectivo": number,
      "transferencia": number,
      "credito": number
    }
  ],
  "gastos": [
    {
      "descripcion": string,
      "valor": number,
      "tieneFactura": boolean
    }
  ]
}

Reglas:
- Si un valor no se menciona, usar 0
- "tieneFactura" es true solo si el usuario menciona factura o recibo explícitamente
- Normalizar nombres de productos: "Almuerzo completo", "Segundos", "Sopas", "Desayuno", "Porción", "Bebidas"
- Si menciona un producto no listado, incluirlo con el nombre que usó
- Todos los montos son números Float, no strings
- Si no menciona conteo físico, usar 0`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' })
  }

  try {
    const { texto } = req.body || {}

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ error: 'Texto requerido' })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: texto }]
    })

    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    // Eliminar posibles bloques markdown ```json ... ```
    const clean = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const parsed = JSON.parse(clean)

    return res.status(200).json(parsed)
  } catch (error: any) {
    console.error('Error en /api/parsear:', error)
    return res.status(500).json({
      error: 'Error procesando el texto',
      detail: error?.message || String(error)
    })
  }
}
