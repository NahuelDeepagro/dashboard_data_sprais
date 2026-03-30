// 1. NUESTROS DATOS (Simulando tu Google Sheet)
const datosProyectos = [
    { id: 'SPRAI-AA-001', docs: 45210, difLogs: 1, starlink: 'OK' },
    { id: 'SPRAI-AA-002', docs: 38900, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AA-003', docs: 12050, difLogs: 5, starlink: 'OK' },
    { id: 'SPRAI-AA-006', docs: 51200, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AA-013', docs: 0, difLogs: 789, starlink: 'NO funciona' },
    { id: 'SPRAI-AA-014', docs: 28400, difLogs: 2, starlink: 'OK' }
];

// 2. ACTUALIZAR TARJETAS
function actualizarResumen() {
    const total = datosProyectos.length;
    const retrasados = datosProyectos.filter(d => d.difLogs > 1).length;
    const fallasSt = datosProyectos.filter(d => d.starlink !== 'OK').length;

    document.getElementById('totalEquipos').textContent = total;
    document.getElementById('equiposRetrasados').textContent = retrasados;
    document.getElementById('equiposSinStarlink').textContent = fallasSt;
    document.getElementById('fecha-actualizacion').textContent = `Última actualización: ${new Date().toLocaleDateString()}`;
}

// 3. GENERAR TABLA
function generarTabla() {
    const cuerpo = document.getElementById('cuerpoTabla');
    cuerpo.innerHTML = ''; // Limpiar tabla

    datosProyectos.forEach(equipo => {
        const fila = document.createElement('tr');
        
        // Alerta visual si los logs tienen más de 3 días de retraso
        const claseAlerta = equipo.difLogs > 3 ? 'class="status-bad"' : '';

        fila.innerHTML = `
            <td><strong>${equipo.id}</strong></td>
            <td>${equipo.docs.toLocaleString()}</td>
            <td ${claseAlerta}>${equipo.difLogs} días</td>
            <td>${equipo.starlink}</td>
        `;
        cuerpo.appendChild(fila);
    });
}

// 4. GENERAR GRÁFICO
function generarGrafico() {
    const ctx = document.getElementById('graficoUploads').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datosProyectos.map(d => d.id),
            datasets: [{
                label: 'Documentos Subidos',
                data: datosProyectos.map(d => d.docs),
                backgroundColor: '#00ad9f',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// EJECUTAR TODO AL CARGAR
actualizarResumen();
generarTabla();
generarGrafico();
