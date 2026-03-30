/**
 * CONFIGURACIÓN DE LA FUENTE DE DATOS
 */
const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?gid=813135547&single=true&output=csv';

/**
 * FUNCIÓN PRINCIPAL: CARGAR DATOS DESDE GOOGLE SHEETS
 */
async function cargarDatos() {
    const fechaMsg = document.getElementById('fecha-actualizacion');
    
    try {
        if (fechaMsg) fechaMsg.textContent = "Sincronizando con Google Sheets...";

        const urlFinal = `${urlPlanilla}&t=${Date.now()}`;
        const respuesta = await fetch(urlFinal);
        
        if (!respuesta.ok) {
            throw new Error(`No se pudo conectar (Status: ${respuesta.status})`);
        }
        
        const textRaw = await respuesta.text();
        const lineas = textRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
        const filas = lineas.slice(1); 

        if (filas.length === 0) {
            throw new Error("La planilla no tiene datos.");
        }

        const datosMapeados = filas.map((fila) => {
            const columnas = fila.split(',');
            const limpias = columnas.map(c => c ? c.replace(/^"|"$/g, '').trim() : "");

            if (!limpias[0]) return null;

            const extraerNumero = (val) => {
                if (!val) return 0;
                const num = val.toString().replace(/[^0-9-]/g, '');
                return parseInt(num) || 0;
            };

            const id = limpias[0];
            // FILTRO: Solo SPRAI-AA o SPRAI-DD
            if (!id.startsWith('SPRAI-AA') && !id.startsWith('SPRAI-DD')) return null;

            return {
                id: id,
                difLogs: extraerNumero(limpias[1]),
                clasifLogs: limpias[2] || '---',
                difImg: extraerNumero(limpias[3]),
                clasifImg: limpias[4] || '---'
            };
        }).filter(d => d !== null);

        if (datosMapeados.length === 0) {
            throw new Error("No hay equipos SPRAI-AA o SPRAI-DD en los datos.");
        }

        procesarYMostrar(datosMapeados);

    } catch (error) {
        console.error("❌ Error:", error);
        if (fechaMsg) fechaMsg.innerHTML = `<span style="color: #e74c3c;">❌ Error: ${error.message}</span>`;
        mostrarDatosDePrueba();
    }
}

/**
 * FUNCIÓN PARA ACTUALIZAR LA INTERFAZ Y GRÁFICOS
 */
function procesarYMostrar(datos) {
    const lista = document.getElementById('listaEquipos');
    const totalEl = document.getElementById('total-equipos');
    
    if (totalEl) totalEl.textContent = datos.length;

    if (lista) {
        lista.innerHTML = '';
        datos.sort((a, b) => a.id.localeCompare(b.id));
        datos.forEach(equipo => {
            // Color basado en Logs
            const claseLogs = equipo.difLogs <= 15 ? "success" : (equipo.difLogs <= 30 ? "warning" : "danger");
            // Color basado en Imágenes
            const claseImg = equipo.difImg <= 15 ? "success" : (equipo.difImg <= 30 ? "warning" : "danger");

            const row = `
                <tr>
                    <td class="p-4 text-sm font-medium text-gray-900">${equipo.id}</td>
                    <td class="p-4 text-sm text-gray-600">${equipo.difLogs} d</td>
                    <td class="p-4 text-sm"><span class="badge ${claseLogs}">${equipo.clasifLogs}</span></td>
                    <td class="p-4 text-sm text-gray-600">${equipo.difImg} d</td>
                    <td class="p-4 text-sm"><span class="badge ${claseImg}">${equipo.clasifImg}</span></td>
                </tr>`;
            lista.insertAdjacentHTML('beforeend', row);
        });
    }

    // Rangos de 15 días
    const rangosLabels = ["0-15d", "16-30d", "31-45d", "46-60d", "61-75d", "76-90d", "+90d"];
    
    // Paleta: Verde -> Amarillo -> Naranja -> Rojo -> Granate
    const coloresPalette = [
        '#2ecc71', '#f1c40f', '#f39c12', '#e67e22', '#d35400', '#e74c3c', '#c0392b'
    ];

    const obtenerDistribucion = (campo) => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        datos.forEach(d => {
            const val = d[campo];
            if (val <= 15) counts[0]++;
            else if (val <= 30) counts[1]++;
            else if (val <= 45) counts[2]++;
            else if (val <= 60) counts[3]++;
            else if (val <= 75) counts[4]++;
            else if (val <= 90) counts[5]++;
            else counts[6]++;
        });
        return counts;
    };

    // Renderizar Gráficos Circulares
    crearGraficoCircular('graficoLogs', 'Distribución Logs (AA/DD)', rangosLabels, obtenerDistribucion('difLogs'), coloresPalette);
    crearGraficoCircular('graficoImg', 'Distribución Imágenes (AA/DD)', rangosLabels, obtenerDistribucion('difImg'), coloresPalette);

    const fecha = document.getElementById('fecha-actualizacion');
    if (fecha && !fecha.innerHTML.includes('❌')) {
        fecha.textContent = `Sincronizado: ${new Date().toLocaleTimeString()}`;
    }
}

/**
 * Crea un gráfico de tipo Dona (Doughnut)
 */
function crearGraficoCircular(canvasId, titulo, labels, data, colores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    if (window[canvasId + 'Chart']) window[canvasId + 'Chart'].destroy();

    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores,
                borderWidth: 1,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: titulo,
                    font: { size: 14, weight: 'bold' }
                },
                legend: { 
                    position: 'right',
                    labels: { boxWidth: 10, font: { size: 10 } }
                }
            },
            cutout: '65%'
        }
    });
}

function mostrarDatosDePrueba() {
    const demo = [
        { id: 'SPRAI-AA-DEMO', difLogs: 5, clasifLogs: '0-15d', difImg: 45, clasifImg: '31-45d' },
        { id: 'SPRAI-DD-DEMO', difLogs: 95, clasifLogs: '+90d', difImg: 92, clasifImg: '+90d' }
    ];
    procesarYMostrar(demo);
}

document.addEventListener('DOMContentLoaded', cargarDatos);
