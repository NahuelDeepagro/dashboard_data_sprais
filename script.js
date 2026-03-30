// --- 1. SIMULACIÓN DE DATOS (Hardcoded) ---
// Estos datos simulan las filas de tu Google Sheet
const datosSimulados = [
    { spriaId: 'SPRAI-AA-001', docCount: 1500, difLogsHoy: 1, starlink: 'OK' },
    { spriaId: 'SPRAI-AA-002', docCount: 2200, difLogsHoy: 0, starlink: 'OK' },
    { spriaId: 'SPRAI-AA-003', docCount: 800, difLogsHoy: 3, starlink: 'OK' },
    { spriaId: 'SPRAI-AA-006', docCount: 3100, difLogsHoy: 0, starlink: 'OK' },
    { spriaId: 'SPRAI-AA-013', docCount: 0, difLogsHoy: 789, starlink: 'NO funciona' }, // Ejemplo de alerta
    { spriaId: 'SPRAI-AA-014', docCount: 1200, difLogsHoy: 1, starlink: 'OK' },
];

// --- 2. CÁLCULO DE RESÚMENES ---
// Calculamos los números para las tarjetas superiores
const total = datosSimulados.length;
// Supongamos que >1 día de diferencia en logs es "retrasado"
const retrasados = datosSimulados.filter(equipo => equipo.difLogsHoy > 1).length;
const sinStarlink = datosSimulados.filter(equipo => equipo.starlink === 'NO funciona').length;

// --- 3. ACTUALIZAR EL DOM (HTML) ---
// Ponemos los números calculados en las tarjetas
document.getElementById('totalEquipos').textContent = total;
document.getElementById('equiposRetrasados').textContent = retrasados;
document.getElementById('equiposSinStarlink').textContent = sinStarlink;

// --- 4. CONFIGURACIÓN DEL GRÁFICO (Chart.js) ---
const ctx = document.getElementById('graficoUploads').getContext('2d');

// Preparamos los datos para el gráfico de barras: IDs de equipo vs Document Count
const etiquetasHtml = datosSimulados.map(equipo => equipo.spriaId);
const datosDocCount = datosSimulados.map(equipo => equipo.docCount);

const miGrafico = new Chart(ctx, {
    type: 'bar', // Tipo de gráfico: barras
    data: {
        labels: etiquetasHtml, // Eje X
        datasets: [{
            label: 'Cantidad de Documentos Subidos (doc_count)',
            data: datosDocCount, // Eje Y
            backgroundColor: '#00ad9f', // Color de Netlify
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // Permite que se ajuste al tamaño del contenedor CSS
        scales: {
            y: {
                beginAtZero: true // El eje Y empieza en 0
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Comparación de Actividad por Equipo'
            }
        }
    }
});
