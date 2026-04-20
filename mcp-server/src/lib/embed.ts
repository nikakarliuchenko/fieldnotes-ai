export async function embedQuery(query: string): Promise<number[]> {
  if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is required')

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [query],
      model: 'voyage-3.5-lite',
      input_type: 'query',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Voyage AI embedding failed (${response.status}): ${body}`)
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> }
  return data.data[0].embedding
}
