/**
 * Netlify Function: Predictions
 * Versión simplificada sin Netlify Blobs
 */

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const bets = JSON.parse(event.body || '[]');

    if (!Array.isArray(bets) || bets.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid data format' })
      };
    }

    const jugador = bets[0].jugador;
    const jornada = bets[0].jornada;

    if (!jugador || !jornada) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing player or matchday' })
      };
    }

    // Por ahora, simplemente aceptamos la apuesta sin guardar
    // TODO: Implementar almacenamiento cuando Blobs esté configurado
    console.log(`[predictions] Received bet from ${jugador} for matchday ${jornada}`);
    console.log(`[predictions] Bets:`, JSON.stringify(bets, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'ok' })
    };

  } catch (error) {
    console.error('[predictions] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
}