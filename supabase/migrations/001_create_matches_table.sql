-- ============================================
-- TABLA: matches
-- Almacena todos los partidos de La Liga
-- ============================================

-- Crear tabla de partidos
CREATE TABLE IF NOT EXISTS matches (
    id BIGINT PRIMARY KEY,                          -- ID del partido (de football-data.org)
    matchday INTEGER NOT NULL,                       -- Número de jornada (1-38)
    utc_date TIMESTAMPTZ NOT NULL,                  -- Fecha y hora del partido en UTC
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, POSTPONED, CANCELLED
    
    -- Equipo local
    home_team_id INTEGER NOT NULL,
    home_team_name VARCHAR(100) NOT NULL,
    
    -- Equipo visitante
    away_team_id INTEGER NOT NULL,
    away_team_name VARCHAR(100) NOT NULL,
    
    -- Marcador (NULL si no ha empezado)
    home_score INTEGER,
    away_score INTEGER,
    
    -- Resultado: '1' (local), 'X' (empate), '2' (visitante), NULL si no terminado
    result CHAR(1),
    
    -- Cuotas calculadas
    odds_home DECIMAL(5,2),
    odds_draw DECIMAL(5,2),
    odds_away DECIMAL(5,2),
    
    -- Metadatos
    season VARCHAR(10) NOT NULL DEFAULT '2024',      -- Temporada (ej: '2024' para 2024-25)
    competition VARCHAR(10) NOT NULL DEFAULT 'PD',   -- Código de competición (PD = La Liga)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(matchday);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_utc_date ON matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_matches_updated_at ON matches;
CREATE TRIGGER trigger_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_matches_updated_at();

-- ============================================
-- TABLA: league_standings
-- Clasificación de equipos de La Liga
-- ============================================

CREATE TABLE IF NOT EXISTS league_standings (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL UNIQUE,
    team_name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    season VARCHAR(10) NOT NULL DEFAULT '2024',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_league_standings_position ON league_standings(position);
CREATE INDEX IF NOT EXISTS idx_league_standings_team_id ON league_standings(team_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_league_standings_updated_at ON league_standings;
CREATE TRIGGER trigger_league_standings_updated_at
    BEFORE UPDATE ON league_standings
    FOR EACH ROW
    EXECUTE FUNCTION update_matches_updated_at();

-- ============================================
-- VISTA: current_matchday_view
-- Partidos de la jornada actual con formato completo
-- ============================================

CREATE OR REPLACE VIEW current_matchday_view AS
SELECT 
    m.id,
    m.matchday,
    m.utc_date,
    m.status,
    m.home_team_id,
    m.home_team_name,
    m.away_team_id,
    m.away_team_name,
    m.home_score,
    m.away_score,
    m.result,
    m.odds_home,
    m.odds_draw,
    m.odds_away,
    CASE 
        WHEN m.home_score IS NOT NULL AND m.away_score IS NOT NULL 
        THEN m.home_score || ' - ' || m.away_score 
        ELSE NULL 
    END as score_display
FROM matches m
WHERE m.matchday = (
    SELECT MIN(matchday) 
    FROM matches 
    WHERE status != 'FINISHED' 
    AND season = '2024'
)
AND m.season = '2024'
ORDER BY m.utc_date;

-- ============================================
-- RLS (Row Level Security) - Opcional
-- ============================================

-- Habilitar RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (todos pueden leer)
CREATE POLICY "Matches are viewable by everyone" 
    ON matches FOR SELECT 
    USING (true);

CREATE POLICY "League standings are viewable by everyone" 
    ON league_standings FOR SELECT 
    USING (true);

-- Política de escritura solo para servicio (usando service_role key)
CREATE POLICY "Service can insert matches" 
    ON matches FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Service can update matches" 
    ON matches FOR UPDATE 
    USING (true);

CREATE POLICY "Service can insert standings" 
    ON league_standings FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Service can update standings" 
    ON league_standings FOR UPDATE 
    USING (true);
