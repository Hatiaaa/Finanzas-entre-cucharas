import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { texto } = await req.json()

    if (!texto || typeof texto !== 'string') {
      return new Response(JSON.stringify({ error: 'Texto requerido' }), { status: 400 })
    }

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

    const parsed = JSON.parse(responseText)

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error en /api/parsear:', error)
    return new Response(JSON.stringify({ error: 'Error procesando el texto' }), { status: 500 })
  }
}
