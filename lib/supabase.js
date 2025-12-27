/**
 * Cliente de Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ============================================
// PREDICCIONES
// ============================================

export async function addPrediction(prediction) {
  const { username, matchday, bets } = prediction;
  
  // Insertar cada apuesta
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

export async function registerBet(username, matchday) {
  const { error } = await supabase
    .from('bet_registry')
    .insert({
      username: username.toLowerCase(),
      matchday
    });
  
  if (error && error.code !== '23505') { // Ignore duplicate key error
    console.error('[supabase] Error registering bet:', error);
    throw error;
  }
  
  return true;
}

// ============================================
// HISTORIAL
// ============================================

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