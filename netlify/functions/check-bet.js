/**
 * Netlify Function: Check Bet
 * Verifica si un jugador ya apostó en una jornada
 */

import { hasPlayerBet } from '../../lib/supabase.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const jugador = params.jugador;
    const jornada = parseInt(params.jornada, 10);

    if (!jugador || !jornada) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing parameters' })
      };
    }

    const hasBet = await hasPlayerBet(jugador, jornada);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ hasBet })
    };

  } catch (error) {
    console.error('[check-bet] Error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ hasBet: false })
    };
  }
}