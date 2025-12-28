/**
 * ============================================
 * APUESTA-ACTUAL.JS
 * ============================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const loadingContainer = document.getElementById('loading-container');
  const apuestaActual = document.getElementById('apuesta-actual');
  
  if (!loadingContainer || !apuestaActual) return;
  
  loadApuestaActual();
});

async function loadApuestaActual() {
  const loadingContainer = document.getElementById('loading-container');
  const apuestaActualContainer = document.getElementById('apuesta-actual');
  const sinApuestaContainer = document.getElementById('sin-apuesta');
  const tablaBody = document.getElementById('bodyRows');
  const numJornada = document.getElementById('num-jornada');
  const resumenApuesta = document.getElementById('resumen-apuesta');
  
  const jugador = getCurrentUser();
  
  if (!jugador) {
    window.location.href = 'index.html';
    return;
  }
  
  try {
    const url = `${API_URLS.apuestaActual}?jugador=${encodeURIComponent(jugador)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data || !data.bets || data.bets.length === 0) {
      loadingContainer.classList.add('hidden');
      if (sinApuestaContainer) {
        sinApuestaContainer.classList.remove('hidden');
      } else {
        loadingContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">No tienes apuesta activa</p>
            <a href="apuestas.html" class="btn">Realizar apuesta</a>
          </div>
        `;
        loadingContainer.classList.remove('hidden');
      }
      return;
    }
    
    const apuestas = data.bets;
    const jornadaActual = data.matchday;
    
    if (numJornada) {
      numJornada.textContent = `JORNADA ${jornadaActual}`;
    }
    
    let aciertos = 0, fallos = 0, pendientes = 0, sumaCuotas = 0, puntosObtenidos = 0;
    
    apuestas.forEach(apuesta => {
      sumaCuotas += parseFloat(apuesta.odds) || 0;
      if (apuesta.correct === true) {
        aciertos++;
        puntosObtenidos += parseFloat(apuesta.odds) || 0;
      } else if (apuesta.correct === false) {
        fallos++;
      } else {
        pendientes++;
      }
    });
    
    if (resumenApuesta) {
      resumenApuesta.innerHTML = `
        <div class="resumen-grid">
          <div class="resumen-item">
            <span class="resumen-label">Partidos jugados</span>
            <span class="resumen-value">${aciertos + fallos} / ${apuestas.length}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Aciertos</span>
            <span class="resumen-value">${aciertos}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Suma cuotas</span>
            <span class="resumen-value">${sumaCuotas.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Puntos</span>
            <span class="resumen-value highlight">${puntosObtenidos.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      `;
    }
    
    apuestas.forEach(apuesta => {
      const tr = document.createElement('tr');
      const tieneResultado = apuesta.actualResult && apuesta.actualResult !== '';
      
      let aciertoIcon = '<span class="estado-pendiente">⏳</span>';
      if (tieneResultado) {
        if (apuesta.correct === true) {
          aciertoIcon = '<span class="estado-acierto">✅</span>';
          tr.classList.add('fila-acierto');
        } else if (apuesta.correct === false) {
          aciertoIcon = '<span class="estado-fallo">❌</span>';
          tr.classList.add('fila-fallo');
        }
      }
      
      const cuotaFormateada = parseFloat(apuesta.odds).toFixed(2).replace('.', ',');
      const resultadoDisplay = tieneResultado ? apuesta.actualResult : '<span class="pendiente">Por jugar</span>';
      
      tr.innerHTML = `
        <td>${apuesta.homeTeam || '-'}</td>
        <td>${apuesta.awayTeam || '-'}</td>
        <td><span class="pronostico-badge">${apuesta.prediction || '-'}</span></td>
        <td class="cuota-value">${cuotaFormateada}</td>
        <td class="resultado-value">${resultadoDisplay}</td>
        <td>${aciertoIcon}</td>
      `;
      
      tablaBody.appendChild(tr);
    });
    
    loadingContainer.classList.add('hidden');
    apuestaActualContainer.classList.remove('hidden');
    
  } catch (error) {
    console.error('Error al cargar apuesta actual:', error);
    loadingContainer.innerHTML = `
      <p style="color: var(--text-error);">Error cargando tu apuesta.</p>
      <button class="btn" onclick="location.reload()">Reintentar</button>
    `;
  }
}
