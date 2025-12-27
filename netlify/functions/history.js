/**
 * Netlify Function: History
 * Obtiene historial de apuestas desde GitHub
 */

import { getPlayerHistory } from '../../lib/github-storage.js';

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
          fecha: entry.timestamp,
          resumen: {
            aciertos: 0,
            fallos: 0,
            pendientes: 0,
            puntos: 0
          },
          partidos: []
        };
      }
      
      for (const bet of entry.bets) {
        const partido = {
          equipo_local: bet.homeTeam,
          equipo_visitante: bet.awayTeam,
          pronostico: bet.prediction,
          cuota: bet.odds,
          resultado_real: bet.actualResult || null,
          acierto: bet.correct
        };
        
        grouped[matchday].partidos.push(partido);
        
        if (bet.correct === true) {
          grouped[matchday].resumen.aciertos++;
          grouped[matchday].resumen.puntos += bet.odds;
        } else if (bet.correct === false) {
          grouped[matchday].resumen.fallos++;
        } else {
          grouped[matchday].resumen.pendientes++;
        }
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