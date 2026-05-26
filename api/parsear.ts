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
      "categoria": string,
      "cantidad": number,
      "efectivo": number,
      "transferencia": number,
      "creditos": [
        { "cliente": string, "cantidad": number, "monto": number }
      ]
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

Reglas generales:
- Si un valor no se menciona, usar 0 o array vacío según corresponda
- "tieneFactura" es true solo si el usuario menciona factura o recibo explícitamente
- Todos los montos son números Float, no strings
- Si no menciona conteo físico, usar 0
- NUNCA uses "credito: 0" ni ninguna variante. El campo "creditos" SIEMPRE es un array (vacío [] si no hay créditos)

Reglas para créditos:
- Si un producto NO tiene crédito → "creditos": []
- Si un producto tiene crédito SIN nombre de cliente → "creditos": [{"cliente": "Sin nombre", "cantidad": 0, "monto": X}]
- Si hay varios clientes con crédito para el mismo producto → una entrada en "creditos" por cada cliente
- Los créditos de desayunos se asignan al plato específico mencionado (ej: crédito en bolón de queso → va en el producto "Bolón de queso")

Reglas de nombre y categoría:
- Almuerzos completos → nombre: "Almuerzo completo", categoria: "Almuerzo"
- Segundos → nombre: "Segundo", categoria: "Almuerzo"
- Sopas → nombre: "Sopa", categoria: "Almuerzo"
- Platos de desayuno (bolón, patacones, tortilla, americano, ceviche, etc.) → conservar el nombre específico del plato, categoria: "Desayunos"
- Bebidas (café, jugo, té, etc.) → conservar nombre, categoria: "Bebidas"
- Porciones (bistec, huevo, arroz, queso, etc.) → conservar nombre, categoria: "Porciones"
- Cualquier otro plato → conservar nombre, categoria: "Platos a la Carta"`

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
