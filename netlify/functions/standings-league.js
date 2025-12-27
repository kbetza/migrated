/**
 * Netlify Function: Standings League
 * Devuelve la clasificación de equipos de La Liga desde Supabase
 */

import { getLeagueStandings } from '../../lib/supabase.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300'
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
    const standings = await getLeagueStandings();

    if (!standings || standings.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Standings not available' })
      };
    }

    // Formatear para compatibilidad con frontend existente
    const formattedStandings = standings.map(team => ({
      Pos: team.position,
      Equipo: team.team.name,
      PJ: team.played,
      PG: team.won,
      PE: team.drawn,
      PP: team.lost,
      GF: team.goalsFor,
      GC: team.goalsAgainst,
      DG: team.goalDifference,
      Pts: team.points,
      id_equipo: team.team.id
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedStandings)
    };

  } catch (error) {
    console.error('[standings-league] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
}
