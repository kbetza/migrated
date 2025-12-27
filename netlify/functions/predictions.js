/**
 * Netlify Function: Predictions
 * Guarda apuestas en Supabase
 */

import { hasPlayerBet, registerBet, addPrediction } from '../../lib/supabase.js';

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
    const jornada = parseInt(bets[0].jornada, 10);

    if (!jugador || !jornada) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing player or matchday' })
      };
    }

    // Verificar si ya apostó
    const alreadyBet = await hasPlayerBet(jugador, jornada);
    
    if (alreadyBet) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ 
          error: 'Ya has enviado tu apuesta para esta jornada.',
          alreadySubmitted: true 
        })
      };
    }

    // Formatear predicción
    const prediction = {
      username: jugador,
      matchday: jornada,
      bets: bets.map(bet => ({
        matchId: parseInt(bet.idpartido, 10),
        homeTeam: bet.equipo_Local,
        awayTeam: bet.equipo_Visitante,
        prediction: bet.pronostico,
        odds: parseFloat(String(bet.cuota).replace(',', '.'))
      }))
    };

    // Guardar en Supabase
    await addPrediction(prediction);
    
    // Registrar para evitar duplicados
    await registerBet(jugador, jornada);

    console.log(`[predictions] Saved bet from ${jugador} for matchday ${jornada}`);

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
