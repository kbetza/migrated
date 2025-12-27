/**
 * Netlify Function: Current Bet
 */

import { supabase } from '../../lib/supabase.js';

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

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('username', jugador.toLowerCase())
      .order('matchday', { ascending: false });

    if (error) {
      console.error('[current-bet] Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ matchday: null, bets: [] })
      };
    }

    const matchday = data[0].matchday;
    const betsForMatchday = data.filter(bet => bet.matchday === matchday);

    const response = {
      matchday,
      timestamp: betsForMatchday[0]?.created_at,
      bets: betsForMatchday.map(bet => ({
        matchId: bet.match_id,
        homeTeam: bet.home_team,
        awayTeam: bet.away_team,
        prediction: bet.prediction,
        odds: parseFloat(bet.odds),
        actualResult: null,
        correct: null
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('[current-bet] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
}