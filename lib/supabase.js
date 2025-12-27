/**
 * Cliente de Supabase - Versión actualizada
 * Incluye funciones para partidos, clasificación y predicciones
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ============================================
// PARTIDOS (MATCHES)
// ============================================

/**
 * Obtiene todos los partidos de una temporada
 */
export async function getAllMatches(season = '2024') {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('season', season)
    .order('matchday', { ascending: true })
    .order('utc_date', { ascending: true });

  if (error) {
    console.error('[supabase] Error getting all matches:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene los partidos de una jornada específica
 */
export async function getMatchesByMatchday(matchday, season = '2024') {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('matchday', matchday)
    .eq('season', season)
    .order('utc_date', { ascending: true });

  if (error) {
    console.error('[supabase] Error getting matches by matchday:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene la jornada actual (primera jornada con partidos no finalizados)
 */
export async function getCurrentMatchday(season = '2024') {
  const { data, error } = await supabase
    .from('matches')
    .select('matchday')
    .eq('season', season)
    .neq('status', 'FINISHED')
    .order('matchday', { ascending: true })
    .limit(1);

  if (error) {
    console.error('[supabase] Error getting current matchday:', error);
    return null;
  }

  if (data && data.length > 0) {
    return data[0].matchday;
  }

  // Si todos los partidos están finalizados, devolver la última jornada
  const { data: lastData } = await supabase
    .from('matches')
    .select('matchday')
    .eq('season', season)
    .order('matchday', { ascending: false })
    .limit(1);

  return lastData?.[0]?.matchday || 1;
}

/**
 * Obtiene los partidos de la jornada actual con formato completo
 */
export async function getCurrentMatchdayMatches(season = '2024') {
  const currentMatchday = await getCurrentMatchday(season);
  
  if (!currentMatchday) {
    return { matchday: null, matches: [] };
  }

  const matches = await getMatchesByMatchday(currentMatchday, season);
  
  // Formatear matches al formato esperado por el frontend
  const formattedMatches = matches.map(match => ({
    id: match.id,
    matchday: match.matchday,
    utcDate: match.utc_date,
    status: match.status,
    homeTeam: {
      id: match.home_team_id,
      name: match.home_team_name
    },
    awayTeam: {
      id: match.away_team_id,
      name: match.away_team_name
    },
    score: match.home_score !== null && match.away_score !== null 
      ? `${match.home_score} - ${match.away_score}` 
      : null,
    result: match.result,
    odds: {
      home: parseFloat(match.odds_home) || 2.0,
      draw: parseFloat(match.odds_draw) || 3.0,
      away: parseFloat(match.odds_away) || 3.5
    }
  }));

  return {
    matchday: currentMatchday,
    matches: formattedMatches
  };
}

/**
 * Actualiza un partido (resultado, estado, etc.)
 */
export async function updateMatch(matchId, updates) {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('[supabase] Error updating match:', error);
    throw error;
  }

  return data;
}

/**
 * Inserta o actualiza múltiples partidos (upsert)
 */
export async function upsertMatches(matches) {
  const { data, error } = await supabase
    .from('matches')
    .upsert(matches, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('[supabase] Error upserting matches:', error);
    throw error;
  }

  return data;
}

// ============================================
// CLASIFICACIÓN DE LIGA
// ============================================

/**
 * Obtiene la clasificación de la liga
 */
export async function getLeagueStandings(season = '2024') {
  const { data, error } = await supabase
    .from('league_standings')
    .select('*')
    .eq('season', season)
    .order('position', { ascending: true });

  if (error) {
    console.error('[supabase] Error getting league standings:', error);
    return [];
  }

  // Formatear al formato esperado
  return (data || []).map(team => ({
    position: team.position,
    team: {
      id: team.team_id,
      name: team.team_name
    },
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goalsFor: team.goals_for,
    goalsAgainst: team.goals_against,
    goalDifference: team.goal_difference,
    points: team.points
  }));
}

/**
 * Actualiza la clasificación de la liga
 */
export async function upsertLeagueStandings(standings, season = '2024') {
  const rows = standings.map(team => ({
    team_id: team.team?.id || team.team_id,
    team_name: team.team?.name || team.team_name,
    position: team.position,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goals_for: team.goalsFor || team.goals_for,
    goals_against: team.goalsAgainst || team.goals_against,
    goal_difference: team.goalDifference || team.goal_difference,
    points: team.points,
    season: season
  }));

  const { data, error } = await supabase
    .from('league_standings')
    .upsert(rows, { onConflict: 'team_id' })
    .select();

  if (error) {
    console.error('[supabase] Error upserting league standings:', error);
    throw error;
  }

  return data;
}

// ============================================
// PREDICCIONES
// ============================================

/**
 * Añade una predicción
 */
export async function addPrediction(prediction) {
  const { username, matchday, bets } = prediction;
  
  const rows = bets.map(bet => ({
    username: username.toLowerCase(),
    matchday,
    match_id: bet.matchId,
    home_team: bet.homeTeam,
    away_team: bet.awayTeam,
    prediction: bet.prediction,
    odds: bet.odds
  }));
  
  const { error } = await supabase
    .from('predictions')
    .insert(rows);
  
  if (error) {
    console.error('[supabase] Error adding prediction:', error);
    throw error;
  }
  
  return true;
}

/**
 * Obtiene predicciones de una jornada
 */
export async function getPredictions(matchday) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('matchday', matchday);
  
  if (error) {
    console.error('[supabase] Error getting predictions:', error);
    return [];
  }
  
  return data || [];
}

// ============================================
// REGISTRO DE APUESTAS
// ============================================

/**
 * Verifica si un jugador ya apostó en una jornada
 */
export async function hasPlayerBet(username, matchday) {
  const { data, error } = await supabase
    .from('bet_registry')
    .select('id')
    .eq('username', username.toLowerCase())
    .eq('matchday', matchday)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('[supabase] Error checking bet:', error);
  }
  
  return !!data;
}

/**
 * Registra que un jugador ha apostado
 */
export async function registerBet(username, matchday) {
  const { error } = await supabase
    .from('bet_registry')
    .insert({
      username: username.toLowerCase(),
      matchday
    });
  
  if (error && error.code !== '23505') {
    console.error('[supabase] Error registering bet:', error);
    throw error;
  }
  
  return true;
}

// ============================================
// HISTORIAL
// ============================================

/**
 * Obtiene el historial de un jugador
 */
export async function getPlayerHistory(username) {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('username', username.toLowerCase())
    .order('matchday', { ascending: false });
  
  if (error) {
    console.error('[supabase] Error getting history:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Archiva predicciones de una jornada finalizada
 */
export async function archivePredictions(matchday, results) {
  // Obtener predicciones de la jornada
  const { data: predictions, error: fetchError } = await supabase
    .from('predictions')
    .select('*')
    .eq('matchday', matchday);
  
  if (fetchError) {
    console.error('[supabase] Error fetching predictions:', fetchError);
    throw fetchError;
  }
  
  if (!predictions || predictions.length === 0) {
    return true;
  }
  
  // Crear registros de historial con resultados
  const historyRows = predictions.map(pred => {
    const result = results.find(r => r.matchId === pred.match_id);
    const actualResult = result?.result || null;
    const correct = actualResult ? pred.prediction === actualResult : null;
    const pointsEarned = correct ? pred.odds : 0;
    
    return {
      username: pred.username,
      matchday: pred.matchday,
      match_id: pred.match_id,
      home_team: pred.home_team,
      away_team: pred.away_team,
      prediction: pred.prediction,
      odds: pred.odds,
      actual_result: actualResult,
      correct,
      points_earned: pointsEarned,
      created_at: pred.created_at
    };
  });
  
  // Insertar en historial
  const { error: insertError } = await supabase
    .from('history')
    .insert(historyRows);
  
  if (insertError) {
    console.error('[supabase] Error inserting history:', insertError);
    throw insertError;
  }
  
  // Eliminar predicciones procesadas
  const { error: deleteError } = await supabase
    .from('predictions')
    .delete()
    .eq('matchday', matchday);
  
  if (deleteError) {
    console.error('[supabase] Error deleting predictions:', deleteError);
  }
  
  return true;
}

// ============================================
// CLASIFICACIÓN DE JUGADORES
// ============================================

/**
 * Obtiene la clasificación de jugadores desde el historial
 */
export async function getPlayerStandings() {
  const { data, error } = await supabase
    .from('history')
    .select('username, correct, points_earned, matchday');
  
  if (error) {
    console.error('[supabase] Error getting standings:', error);
    return [];
  }
  
  // Agrupar por jugador
  const standings = {};
  
  for (const row of data || []) {
    if (!standings[row.username]) {
      standings[row.username] = {
        username: row.username,
        points: 0,
        correctPredictions: 0,
        matchdays: new Set()
      };
    }
    
    if (row.correct) {
      standings[row.username].correctPredictions++;
      standings[row.username].points += parseFloat(row.points_earned) || 0;
    }
    standings[row.username].matchdays.add(row.matchday);
  }
  
  // Convertir a array y ordenar
  return Object.values(standings)
    .map(s => ({
      username: s.username,
      points: Math.round(s.points * 100) / 100,
      correctPredictions: s.correctPredictions,
      matchdaysPlayed: s.matchdays.size
    }))
    .sort((a, b) => b.points - a.points)
    .map((s, i) => ({ position: i + 1, ...s }));
}
