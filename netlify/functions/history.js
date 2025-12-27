/**
 * Netlify Function: History
 * Obtiene historial de apuestas desde Supabase
 */

import { getPlayerHistory } from '../../lib/supabase.js';

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

    if (!jugador) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing jugador parameter' })
      };
    }

    const history = await getPlayerHistory(jugador);

    // Agrupar por jornada para el frontend
    const grouped = {};
    
    for (const entry of history) {
      const matchday = entry.matchday;
      
      if (!grouped[matchday]) {
        grouped[matchday] = {
          jornada: matchday,
          fecha: entry.created_at,
          resumen: {
            aciertos: 0,
            fallos: 0,
            pendientes: 0,
            puntos: 0
          },
          partidos: []
        };
      }
      
      const partido = {
        equipo_local: entry.home_team,
        equipo_visitante: entry.away_team,
        pronostico: entry.prediction,
        cuota: parseFloat(entry.odds),
        resultado_real: entry.actual_result,
        acierto: entry.correct
      };
      
      grouped[matchday].partidos.push(partido);
      
      if (entry.correct === true) {
        grouped[matchday].resumen.aciertos++;
        grouped[matchday].resumen.puntos += parseFloat(entry.points_earned) || 0;
      } else if (entry.correct === false) {
        grouped[matchday].resumen.fallos++;
      } else {
        grouped[matchday].resumen.pendientes++;
      }
    }

    const result = Object.values(grouped).sort((a, b) => b.jornada - a.jornada);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('[history] Error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([])
    };
  }
}
