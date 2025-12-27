/**
 * Netlify Function: Matches
 * Devuelve los partidos de la jornada actual desde Supabase
 */

import { getCurrentMatchdayMatches } from '../../lib/supabase.js';

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
    // Obtener partidos de la jornada actual desde Supabase
    const { matchday, matches } = await getCurrentMatchdayMatches();

    if (!matches || matches.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No matches available' })
      };
    }

    // Formatear respuesta para compatibilidad con frontend existente
    const formattedMatches = matches.map(match => {
      const dateObj = new Date(match.utcDate);
      
      return {
        Jornada: `Regular season - ${match.matchday}`,
        Fecha: dateObj.toISOString(),
        Hora: dateObj.toISOString(),
        Equipo_Local: match.homeTeam.name,
        ID_Local: match.homeTeam.id,
        Equipo_Visitante: match.awayTeam.name,
        ID_Visitante: match.awayTeam.id,
        Estado: match.status === 'FINISHED' ? 'Match finished' : 'Not started yet',
        Marcador: match.score || '',
        Resultado: match.result || '',
        ID_partido: match.id,
        Cuota_Local: match.odds?.home || 2.0,
        Cuota_Empate: match.odds?.draw || 3.0,
        Cuota_Visitante: match.odds?.away || 3.5
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedMatches)
    };

  } catch (error) {
    console.error('[matches] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
}
