-- ============================================
-- DATOS DE EJEMPLO: Partidos Jornada 17
-- Ejecutar después de crear las tablas
-- ============================================

-- Insertar partidos de la jornada 17
INSERT INTO matches (id, matchday, utc_date, status, home_team_id, home_team_name, away_team_id, away_team_name, home_score, away_score, result, odds_home, odds_draw, odds_away, season, competition)
VALUES
    (544371, 17, '2025-12-20T20:00:00Z', 'SCHEDULED', 77, 'Athletic Club', 80, 'RCD Espanyol de Barcelona', NULL, NULL, NULL, 1.70, 3.60, 5.50, '2024', 'PD'),
    (544372, 17, '2025-12-21T16:00:00Z', 'SCHEDULED', 90, 'Real Betis Balompié', 275, 'Getafe CF', NULL, NULL, NULL, 1.95, 3.40, 4.40, '2024', 'PD'),
    (544373, 17, '2025-12-21T18:30:00Z', 'SCHEDULED', 285, 'Elche CF', 87, 'Rayo Vallecano de Madrid', NULL, NULL, NULL, 2.60, 3.10, 2.85, '2024', 'PD'),
    (544374, 17, '2025-12-21T21:00:00Z', 'SCHEDULED', 745, 'Levante UD', 92, 'Real Sociedad de Fútbol', NULL, NULL, NULL, 3.60, 3.30, 2.05, '2024', 'PD'),
    (544375, 17, '2025-12-22T16:00:00Z', 'SCHEDULED', 86, 'Real Madrid CF', 559, 'Sevilla FC', NULL, NULL, NULL, 1.45, 4.50, 6.50, '2024', 'PD'),
    (544376, 17, '2025-12-22T18:30:00Z', 'SCHEDULED', 79, 'CA Osasuna', 263, 'Deportivo Alavés', NULL, NULL, NULL, 2.05, 3.20, 4.00, '2024', 'PD'),
    (544377, 17, '2025-12-22T21:00:00Z', 'SCHEDULED', 298, 'Girona FC', 78, 'Club Atlético de Madrid', NULL, NULL, NULL, 2.85, 3.25, 2.45, '2024', 'PD'),
    (544378, 17, '2025-12-23T20:00:00Z', 'SCHEDULED', 94, 'Villarreal CF', 81, 'FC Barcelona', NULL, NULL, NULL, 3.10, 3.60, 2.15, '2024', 'PD'),
    (544379, 17, '2025-12-23T20:00:00Z', 'SCHEDULED', 280, 'Real Oviedo', 264, 'RC Celta de Vigo', NULL, NULL, NULL, 3.10, 3.25, 2.35, '2024', 'PD'),
    (544380, 17, '2025-12-23T20:00:00Z', 'SCHEDULED', 95, 'Valencia CF', 89, 'RCD Mallorca', NULL, NULL, NULL, 2.10, 3.20, 3.70, '2024', 'PD')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    result = EXCLUDED.result,
    odds_home = EXCLUDED.odds_home,
    odds_draw = EXCLUDED.odds_draw,
    odds_away = EXCLUDED.odds_away,
    updated_at = NOW();

-- ============================================
-- DATOS DE EJEMPLO: Clasificación Liga
-- ============================================

INSERT INTO league_standings (team_id, team_name, position, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, season)
VALUES
    (81, 'FC Barcelona', 1, 16, 12, 3, 1, 42, 15, 27, 39, '2024'),
    (86, 'Real Madrid CF', 2, 16, 11, 3, 2, 38, 18, 20, 36, '2024'),
    (78, 'Club Atlético de Madrid', 3, 16, 10, 4, 2, 30, 12, 18, 34, '2024'),
    (77, 'Athletic Club', 4, 16, 9, 5, 2, 28, 14, 14, 32, '2024'),
    (94, 'Villarreal CF', 5, 16, 8, 5, 3, 26, 20, 6, 29, '2024'),
    (92, 'Real Sociedad de Fútbol', 6, 16, 7, 6, 3, 22, 16, 6, 27, '2024'),
    (89, 'RCD Mallorca', 7, 16, 7, 5, 4, 18, 15, 3, 26, '2024'),
    (90, 'Real Betis Balompié', 8, 16, 7, 4, 5, 22, 20, 2, 25, '2024'),
    (298, 'Girona FC', 9, 16, 6, 6, 4, 24, 22, 2, 24, '2024'),
    (264, 'RC Celta de Vigo', 10, 16, 6, 5, 5, 23, 24, -1, 23, '2024'),
    (79, 'CA Osasuna', 11, 16, 5, 7, 4, 18, 18, 0, 22, '2024'),
    (559, 'Sevilla FC', 12, 16, 5, 6, 5, 20, 22, -2, 21, '2024'),
    (87, 'Rayo Vallecano de Madrid', 13, 16, 5, 5, 6, 16, 19, -3, 20, '2024'),
    (263, 'Deportivo Alavés', 14, 16, 5, 4, 7, 17, 24, -7, 19, '2024'),
    (275, 'Getafe CF', 15, 16, 4, 6, 6, 14, 18, -4, 18, '2024'),
    (95, 'Valencia CF', 16, 16, 4, 4, 8, 16, 24, -8, 16, '2024'),
    (80, 'RCD Espanyol de Barcelona', 17, 16, 3, 5, 8, 15, 26, -11, 14, '2024'),
    (745, 'Levante UD', 18, 16, 3, 4, 9, 14, 28, -14, 13, '2024'),
    (280, 'Real Oviedo', 19, 16, 2, 5, 9, 12, 26, -14, 11, '2024'),
    (285, 'Elche CF', 20, 16, 2, 3, 11, 10, 32, -22, 9, '2024')
ON CONFLICT (team_id) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    position = EXCLUDED.position,
    played = EXCLUDED.played,
    won = EXCLUDED.won,
    drawn = EXCLUDED.drawn,
    lost = EXCLUDED.lost,
    goals_for = EXCLUDED.goals_for,
    goals_against = EXCLUDED.goals_against,
    goal_difference = EXCLUDED.goal_difference,
    points = EXCLUDED.points,
    updated_at = NOW();
