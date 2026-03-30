// 1. CONFIGURACIÓN DE LA FUENTE DE DATOS
// Reemplaza esta URL con tu enlace de "Publicar en la web" (formato CSV) de Google Sheets
const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pubhtml';

// Datos de respaldo (se mostrarán si la URL de arriba no funciona o está vacía)
const datosRespaldo = [
    { id: 'SPRAI-AA-001', docs: 45210, difLogs: 1, starlink: 'OK' },
    { id: 'SPRAI-AA-002', docs: 38900, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AA-003', docs: 12050, difLogs: 14, starlink: 'OK' },
    { id: 'SPRAI-AA-004', docs: 25600, difLogs: 2, starlink: 'OK' },
    { id: 'SPRAI-AA-005', docs: 31200, difLogs: 5, starlink: 'OK' },
    { id: 'SPRAI-AA-006', docs: 51200, difLogs: 22, starlink: 'OK' },
    { id: 'SPRAI-AA-007', docs: 18400, difLogs: 1, starlink: 'OK' },
    { id: 'SPRAI-AA-008', docs: 21500, difLogs: 18, starlink: 'OK' },
    { id: 'SPRAI-AA-009', docs: 42100, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AA-010', docs: 9500, difLogs: 45, starlink: 'OK' },
    { id: 'SPRAI-AA-011', docs: 33200, difLogs: 3, starlink: 'OK' },
    { id: 'SPRAI-AA-012', docs: 29800, difLogs: 1, starlink: 'OK' },
    { id: 'SPRAI-AA-013', docs: 0, difLogs: 789, starlink: 'Error' },
    { id: 'SPRAI-AA-014', docs: 28400, difLogs: 2, starlink: 'OK' },
    { id: 'SPRAI-AB-001', docs: 15600, difLogs: 12, starlink: 'OK' },
    { id: 'SPRAI-AB-002', docs: 22100, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AB-003', docs: 19800, difLogs: 4, starlink: 'OK' },
    { id: 'SPRAI-AB-004', docs: 41000, difLogs: 19, starlink: 'OK' },
    { id: 'SPRAI-AB-005', docs: 37500, difLogs: 1, starlink: 'OK' },
    { id: 'SPRAI-AC-001', docs: 52000, difLogs: 0, starlink: 'OK' },
    { id: 'SPRAI-AC-002', docs: 48900, difLogs: 3, starlink: 'OK' },
    { id: 'SPRAI-AC-010', docs: 11200, difLogs: 60, starlink: 'Error' }
];

// 2. FUNCIÓN PARA OBTENER DATOS (FETCH)
async function cargarDatos() {
    try {
        if (urlPlanilla === 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pubhtml') {
            console.log("Usando datos de respaldo locales.");
            procesarYMostrar(datosRespaldo);
            return;
        }

        const respuesta = await fetch(urlPlanilla);
        const csvText = await respuesta.text();
        const filas = csvText.split('\n').slice(1); // Omitir encabezado

        const datosMapeados = filas.map(fila => {
            const columnas = fila.split(',');
            return {
                id: columnas[0]?.trim(), // SPRIA ID
                docs: parseInt(columnas[1]) || 0, // doc_count
                difLogs: parseInt(columnas[4]) || 0, // dif_logs_vs_hoy
                starlink: columnas[5]?.trim() || 'N/A' // starlink_status
            };
        }).filter(d => d.id); // Eliminar filas vacías

        procesarYMostrar(datosMapeados);
    } catch (error) {
        console.error("Error cargando Google Sheets:", error);
        procesarYMostrar(datosRespaldo);
    }
}

// 3. FUNCIÓN PARA PROCESAR Y MOSTRAR EN PANTALLA
function procesarYMostrar(datos) {
    let alDia = 0;   
    let aviso = 0;   
    let critico = 0; 

    const lista = document.getElementById('listaEquipos');
    if (!lista) return;
    lista.innerHTML = '';

    // Ordenar por ID
    datos.sort((a, b) => a.id.localeCompare(b.id));

    datos.forEach(equipo => {
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

    document.getElementById('count-al-dia').textContent = alDia;
    document.getElementById('count-aviso').textContent = aviso;
    document.getElementById('count-critico').textContent = critico;
    document.getElementById('fecha-actualizacion').textContent = `Sincronizado: ${new Date().toLocaleTimeString()}`;

    actualizarMensajeSalud(alDia, aviso, critico);
    generarGrafico(alDia, aviso, critico);
}

// 4. MENSAJE DINÁMICO DE SALUD
function actualizarMensajeSalud(ok, av, cr) {
    const box = document.getElementById('status-message');
    if (!box) return;
    
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

// 5. GRÁFICO DE TORTA
function generarGrafico(ok, av, cr) {
    const canvas = document.getElementById('graficoIntervalos');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
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

// Iniciar aplicación intentando cargar datos reales
document.addEventListener('DOMContentLoaded', cargarDatos);
