//const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv';

**
 * CONFIGURACIÓN DE LA FUENTE DE DATOS
 * Pega aquí el enlace que obtuviste de "Publicar en la web" -> formato CSV.
 */
const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv';

/**
 * FUNCIÓN PRINCIPAL: CARGAR DATOS DESDE GOOGLE SHEETS
 */
async function cargarDatos() {
    try {
        if (!urlPlanilla || urlPlanilla === 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv') {
            console.warn("⚠️ No se ha configurado la URL del CSV. Mostrando datos de prueba.");
            mostrarDatosDePrueba();
            return;
        }

        const respuesta = await fetch(urlPlanilla);
        if (!respuesta.ok) throw new Error("No se pudo conectar con Google Sheets");
        
        const csvText = await respuesta.text();
        
        // Dividimos por filas y eliminamos la primera (encabezados)
        const lineas = csvText.split(/\r?\n/);
        const filas = lineas.slice(1); 

        const datosMapeados = filas.map(fila => {
            // Dividimos por coma
            const columnas = fila.split(',');

            if (columnas.length < 2) return null; // Saltar filas vacías

            return {
                id: columnas[0]?.trim(),           // Col A: SPRIA ID
                difLogs: parseInt(columnas[1]) || 0, // Col B: Dif Logs VS Hoy
                clasifLogs: columnas[2]?.trim(),    // Col C: Clasificacion Logs
                difImg: parseInt(columnas[3]) || 0,  // Col D: Dif Img VS Hoy
                clasifImg: columnas[4]?.trim()      // Col E: Clasificacion Img
            };
        }).filter(d => d && d.id && d.id !== ""); // Filtrar nulos o vacíos

        procesarYMostrar(datosMapeados);

    } catch (error) {
        console.error("❌ Error al cargar los datos:", error);
        document.getElementById('fecha-actualizacion').textContent = "Error al conectar con la base de datos.";
        mostrarDatosDePrueba();
    }
}

/**
 * FUNCIÓN PARA ACTUALIZAR LA INTERFAZ
 */
function procesarYMostrar(datos) {
    let alDia = 0;   
    let aviso = 0;   
    let critico = 0; 

    const lista = document.getElementById('listaEquipos');
    if (!lista) return;
    lista.innerHTML = '';

    // Ordenamos alfabéticamente por ID del equipo
    datos.sort((a, b) => a.id.localeCompare(b.id));

    datos.forEach(equipo => {
        let claseColor = "";
        let estadoText = "";

        // Clasificación basada en Dif Logs (Columna B)
        if (equipo.difLogs <= 15) {
            alDia++;
            claseColor = "success";
            estadoText = "Operativo";
        } else if (equipo.difLogs <= 30) {
            aviso++;
            claseColor = "warning";
            estadoText = "En Riesgo";
        } else {
            critico++;
            claseColor = "danger";
            estadoText = "Crítico";
        }

        const row = `
            <tr>
                <td><strong>${equipo.id}</strong></td>
                <td>${equipo.difLogs} días</td>
                <td>${equipo.difImg} días</td>
                <td>${equipo.clasifImg || 'Sin clasificar'}</td>
                <td><span class="badge ${claseColor}">${estadoText}</span></td>
            </tr>
        `;
        lista.insertAdjacentHTML('beforeend', row);
    });

    // Actualizar KPIs superiores
    document.getElementById('count-al-dia').textContent = alDia;
    document.getElementById('count-aviso').textContent = aviso;
    document.getElementById('count-critico').textContent = critico;
    
    const fecha = document.getElementById('fecha-actualizacion');
    if (fecha) fecha.textContent = `Sincronizado: ${new Date().toLocaleTimeString()}`;

    // Actualizar Mensaje de Salud y Gráfico
    actualizarMensajeSalud(alDia, aviso, critico);
    generarGrafico(alDia, aviso, critico);
}

/**
 * MENSAJE DINÁMICO SEGÚN ESTADO GENERAL
 */
function actualizarMensajeSalud(ok, av, cr) {
    const box = document.getElementById('status-message');
    if (!box) return;
    
    const total = ok + av + cr;
    const porcentajeOk = ((ok / total) * 100).toFixed(1);

    if (porcentajeOk > 85) {
        box.innerHTML = `✅ <strong>Estado Óptimo:</strong> El sistema tiene un ${porcentajeOk}% de operatividad.`;
        box.style.borderColor = "#2ecc71";
    } else if (porcentajeOk > 60) {
        box.innerHTML = `⚠️ <strong>Atención:</strong> Revisar equipos en intervalo de 15-30 días.`;
        box.style.borderColor = "#f1c40f";
    } else {
        box.innerHTML = `🚨 <strong>Urgente:</strong> Menos del 60% de los equipos están al día.`;
        box.style.borderColor = "#e74c3c";
    }
}

/**
 * GENERACIÓN DEL GRÁFICO DE DONA (Chart.js)
 */
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
                borderWidth: 2,
                hoverOffset: 15
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

/**
 * DATOS DE PRUEBA (Por si falla la conexión o no hay URL)
 */
function mostrarDatosDePrueba() {
    const backup = [
        { id: 'MODO-PRUEBA-01', difLogs: 2, difImg: 2, clasifImg: '0-15 Días' },
        { id: 'MODO-PRUEBA-02', difLogs: 22, difImg: 25, clasifImg: '15-30 Días' },
        { id: 'MODO-PRUEBA-03', difLogs: 45, difImg: 45, clasifImg: '> 30 Días' }
    ];
    procesarYMostrar(backup);
}

// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', cargarDatos);
