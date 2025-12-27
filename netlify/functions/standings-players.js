/**
 * Netlify Function: Standings Players
 * Devuelve la clasificación de jugadores desde Supabase
 */

import { getPlayerStandings } from '../../lib/supabase.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60'
};

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Solo GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Obtener clasificación desde Supabase
    const standings = await getPlayerStandings();

    if (!standings || standings.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }

    // Formatear para compatibilidad con frontend existente
    const formattedStandings = standings.map(player => ({
      Posicion: player.position,
      Jugador: player.username,
      'Puntos ganados': player.points,
      Aciertos: player.correctPredictions,
      'Apuestas realizadas': player.matchdaysPlayed
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedStandings)
    };

  } catch (error) {
    console.error('[standings-players] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
}
