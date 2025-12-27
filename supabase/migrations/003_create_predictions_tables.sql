-- ============================================
-- TABLAS ADICIONALES: Predicciones, Registro y Historial
-- Ejecutar después de 001_create_matches_table.sql
-- ============================================

-- ============================================
-- TABLA: predictions
-- Predicciones actuales (antes de que termine la jornada)
-- ============================================

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    matchday INTEGER NOT NULL,
    match_id BIGINT NOT NULL REFERENCES matches(id),
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    prediction CHAR(1) NOT NULL CHECK (prediction IN ('1', 'X', '2')),
    odds DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un usuario solo puede apostar una vez por partido
    UNIQUE(username, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_username ON predictions(username);
CREATE INDEX IF NOT EXISTS idx_predictions_matchday ON predictions(matchday);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);

-- ============================================
-- TABLA: bet_registry
-- Registro para evitar apuestas duplicadas por jornada
-- ============================================

CREATE TABLE IF NOT EXISTS bet_registry (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    matchday INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un usuario solo puede apostar una vez por jornada
    UNIQUE(username, matchday)
);

CREATE INDEX IF NOT EXISTS idx_bet_registry_username ON bet_registry(username);
CREATE INDEX IF NOT EXISTS idx_bet_registry_matchday ON bet_registry(matchday);

-- ============================================
-- TABLA: history
-- Historial de apuestas con resultados
-- ============================================

CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    matchday INTEGER NOT NULL,
    match_id BIGINT NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    prediction CHAR(1) NOT NULL,
    odds DECIMAL(5,2) NOT NULL,
    actual_result CHAR(1),  -- Resultado real del partido
    correct BOOLEAN,        -- Si acertó o no
    points_earned DECIMAL(5,2) DEFAULT 0,  -- Puntos ganados (cuota si acertó)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_username ON history(username);
CREATE INDEX IF NOT EXISTS idx_history_matchday ON history(matchday);
CREATE INDEX IF NOT EXISTS idx_history_correct ON history(correct);

-- ============================================
-- TABLA: player_standings
-- Clasificación calculada de jugadores (opcional, se puede calcular on-the-fly)
-- ============================================

CREATE TABLE IF NOT EXISTS player_standings (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    points DECIMAL(10,2) DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    matchdays_played INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_standings_position ON player_standings(position);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_standings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Predictions are viewable by everyone" 
    ON predictions FOR SELECT 
    USING (true);

CREATE POLICY "Bet registry is viewable by everyone" 
    ON bet_registry FOR SELECT 
    USING (true);

CREATE POLICY "History is viewable by everyone" 
    ON history FOR SELECT 
    USING (true);

CREATE POLICY "Player standings are viewable by everyone" 
    ON player_standings FOR SELECT 
    USING (true);

-- Políticas de inserción (cualquiera puede insertar)
CREATE POLICY "Anyone can insert predictions" 
    ON predictions FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Anyone can insert bet registry" 
    ON bet_registry FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Anyone can insert history" 
    ON history FOR INSERT 
    WITH CHECK (true);

-- ============================================
-- FUNCIÓN: Calcular y actualizar clasificación de jugadores
-- ============================================

CREATE OR REPLACE FUNCTION update_player_standings()
RETURNS void AS $$
BEGIN
    -- Limpiar tabla actual
    DELETE FROM player_standings;
    
    -- Insertar nueva clasificación calculada desde history
    INSERT INTO player_standings (username, position, points, correct_predictions, matchdays_played, updated_at)
    SELECT 
        username,
        ROW_NUMBER() OVER (ORDER BY SUM(COALESCE(points_earned, 0)) DESC) as position,
        ROUND(SUM(COALESCE(points_earned, 0))::numeric, 2) as points,
        COUNT(*) FILTER (WHERE correct = true) as correct_predictions,
        COUNT(DISTINCT matchday) as matchdays_played,
        NOW() as updated_at
    FROM history
    GROUP BY username
    ORDER BY points DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VISTA: Resumen de apuestas por jornada
-- ============================================

CREATE OR REPLACE VIEW predictions_summary AS
SELECT 
    p.username,
    p.matchday,
    COUNT(*) as total_bets,
    STRING_AGG(p.prediction, ', ' ORDER BY p.match_id) as predictions,
    SUM(p.odds) as total_odds,
    MIN(p.created_at) as submitted_at
FROM predictions p
GROUP BY p.username, p.matchday;

-- ============================================
-- VISTA: Historial con resumen por jornada
-- ============================================

CREATE OR REPLACE VIEW history_by_matchday AS
SELECT 
    h.username,
    h.matchday,
    COUNT(*) as total_bets,
    COUNT(*) FILTER (WHERE h.correct = true) as correct_count,
    COUNT(*) FILTER (WHERE h.correct = false) as incorrect_count,
    ROUND(SUM(COALESCE(h.points_earned, 0))::numeric, 2) as points_earned,
    MIN(h.created_at) as bet_date
FROM history h
GROUP BY h.username, h.matchday
ORDER BY h.matchday DESC;
