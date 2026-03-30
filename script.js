// 1. DATOS DE LOS EQUIPOS (Basados en tu planilla de Sheets)
// Aquí puedes ver cómo los clasificamos por la diferencia de días (difLogs)
const equiposData = [
    { id: 'SPRAI-AA-001', docs: 45210, difLogs: 1, starlink: 'OK' },
    { id: 'SPRAI-AA-002', docs: 38900, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AA-003', docs: 12050, difLogs: 14, starlink: 'OK' },
    { id: 'SPRAI-AA-006', docs: 51200, difLogs: 22, starlink: 'OK' }, // Intervalo 15-30
    { id: 'SPRAI-AA-008', docs: 21500, difLogs: 18, starlink: 'OK' }, // Intervalo 15-30
    { id: 'SPRAI-AA-010', docs: 9500, difLogs: 45, starlink: 'OK' },  // Intervalo >30
    { id: 'SPRAI-AA-013', docs: 0, difLogs: 789, starlink: 'Error' }, // Intervalo >30
    { id: 'SPRAI-AA-014', docs: 28400, difLogs: 2, starlink: 'OK' }
];

// 2. FUNCIÓN PARA CLASIFICAR POR INTERVALOS
function clasificarEquipos() {
    let alDia = 0;   // 0 - 15 días
    let aviso = 0;   // 15 - 30 días
    let critico = 0; // > 30 días

    const lista = document.getElementById('listaEquipos');
    lista.innerHTML = '';

    equiposData.forEach(equipo => {
        let intervaloText = "";
        let claseColor = "";

        if (equipo.difLogs <= 15) {
            alDia++;
            intervaloText = "0-15 Días";
            claseColor = "success";
        } else if (equipo.difLogs <= 30) {
            aviso++;
            intervaloText = "15-30 Días";
            claseColor = "warning";
        } else {
            critico++;
            intervaloText = "> 30 Días";
            claseColor = "danger";
        }

        // Insertar fila en la tabla
        const row = `
            <tr>
                <td><strong>${equipo.id}</strong></td>
                <td>${equipo.docs.toLocaleString()}</td>
                <td>Hace ${equipo.difLogs} días</td>
                <td>${intervaloText}</td>
                <td><span class="badge ${claseColor}">${claseColor === 'success' ? 'Operativo' : (claseColor === 'warning' ? 'Revisar' : 'Inactivo')}</span></td>
            </tr>
        `;
        lista.insertAdjacentHTML('beforeend', row);
    });

    // Actualizar números en tarjetas
    document.getElementById('count-al-dia').textContent = alDia;
    document.getElementById('count-aviso').textContent = aviso;
    document.getElementById('count-critico').textContent = critico;
    document.getElementById('fecha-actualizacion').textContent = `Sincronizado: ${new Date().toLocaleTimeString()}`;

    actualizarMensajeSalud(alDia, aviso, critico);
    generarGrafico(alDia, aviso, critico);
}

// 3. MENSAJE DINÁMICO DE SALUD
function actualizarMensajeSalud(ok, av, cr) {
    const box = document.getElementById('status-message');
    const total = ok + av + cr;
    const porcentajeOk = ((ok / total) * 100).toFixed(1);

    if (porcentajeOk > 80) {
        box.innerHTML = `✅ <strong>Estado Óptimo:</strong> El ${porcentajeOk}% de la flota está sincronizando correctamente.`;
        box.style.borderColor = "#2ecc71";
    } else {
        box.innerHTML = `⚠️ <strong>Atención:</strong> Hay ${av + cr} equipos que requieren revisión de conexión o Starlink.`;
        box.style.borderColor = "#f1c40f";
    }
}

// 4. GRÁFICO DE TORTA
function generarGrafico(ok, av, cr) {
    const ctx = document.getElementById('graficoIntervalos').getContext('2d');
    
    // Si ya existe un gráfico, lo destruimos para evitar errores de renderizado
    if (window.miGrafico) window.miGrafico.destroy();

    window.miGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Al Día (0-15d)', 'Aviso (15-30d)', 'Crítico (>30d)'],
            datasets: [{
                data: [ok, av, cr],
                backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'],
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', clasificarEquipos);
