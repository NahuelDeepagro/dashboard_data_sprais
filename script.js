//const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv';

/**
 * CONFIGURACIÓN DE LA FUENTE DE DATOS
 * Pega aquí el enlace que obtuviste de "Archivo" -> "Compartir" -> "Publicar en la web" -> formato CSV.
 */
const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv';

/**
 * FUNCIÓN PRINCIPAL: CARGAR DATOS DESDE GOOGLE SHEETS
 */
async function cargarDatos() {
    try {
        // Verificación mejorada: Si la URL no empieza con http, usamos datos de prueba
        if (!urlPlanilla || urlPlanilla.includes('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv') || !urlPlanilla.startsWith('http')) {
            console.warn("⚠️ URL no configurada correctamente. Usando datos de prueba.");
            mostrarDatosDePrueba();
            return;
        }

        const respuesta = await fetch(urlPlanilla);
        if (!respuesta.ok) throw new Error("No se pudo obtener respuesta de Google Sheets");
        
        const csvText = await respuesta.text();
        
        // Dividimos por filas y eliminamos la primera (encabezados)
        const lineas = csvText.split(/\r?\n/);
        
        // Filtramos líneas vacías y omitimos el encabezado
        const filas = lineas.filter(linea => linea.trim() !== "").slice(1); 

        const datosMapeados = filas.map(fila => {
            // Dividimos por coma
            const columnas = fila.split(',');

            // Verificamos que al menos exista el ID del equipo
            if (!columnas[0] || columnas[0].trim() === "") return null;

            return {
                id: columnas[0]?.trim(),             // Col A: SPRIA ID
                difLogs: parseInt(columnas[1]) || 0,   // Col B: Dif Logs VS Hoy
                clasifLogs: columnas[2]?.trim(),      // Col C: Clasificacion Logs
                difImg: parseInt(columnas[3]) || 0,    // Col D: Dif Img VS Hoy
                clasifImg: columnas[4]?.trim()        // Col E: Clasificacion Img
            };
        }).filter(d => d !== null); // Limpiamos registros inválidos

        if (datosMapeados.length === 0) {
            throw new Error("La planilla parece estar vacía o mal formateada.");
        }

        procesarYMostrar(datosMapeados);

    } catch (error) {
        console.error("❌ Error al cargar los datos:", error);
        const fechaMsg = document.getElementById('fecha-actualizacion');
        if (fechaMsg) fechaMsg.textContent = "Error: Verifica que el enlace sea CSV y público.";
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

    // Ordenamos alfabéticamente por ID del equipo para que sea fácil de leer
    datos.sort((a, b) => a.id.localeCompare(b.id));

    datos.forEach(equipo => {
        let claseColor = "";
        let estadoText = "";

        // Clasificación basada en Dif Logs (Columna B)
        // Ajustamos la lógica para que sea igual a tu planilla auxiliar
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
                <td>${equipo.clasifImg || equipo.clasifLogs || 'Sin datos'}</td>
                <td><span class="badge ${claseColor}">${estadoText}</span></td>
            </tr>
        `;
        lista.insertAdjacentHTML('beforeend', row);
    });

    // Actualizar KPIs superiores
    const elAlDia = document.getElementById('count-al-dia');
    const elAviso = document.getElementById('count-aviso');
    const elCritico = document.getElementById('count-critico');
    
    if (elAlDia) elAlDia.textContent = alDia;
    if (elAviso) elAviso.textContent = aviso;
    if (elCritico) elCritico.textContent = critico;
    
    const fecha = document.getElementById('fecha-actualizacion');
    if (fecha) fecha.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;

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
    const porcentajeOk = total > 0 ? ((ok / total) * 100).toFixed(1) : 0;

    if (porcentajeOk > 85) {
        box.innerHTML = `✅ <strong>Estado Óptimo:</strong> El ${porcentajeOk}% de los equipos está al día.`;
        box.style.borderColor = "#2ecc71";
    } else if (porcentajeOk > 60) {
        box.innerHTML = `⚠️ <strong>Atención:</strong> Hay equipos que requieren revisión de sincronización.`;
        box.style.borderColor = "#f1c40f";
    } else {
        box.innerHTML = `🚨 <strong>Crítico:</strong> La mayoría de los equipos presentan retrasos importantes.`;
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
            labels: ['0-15 días', '15-30 días', '>30 días'],
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
 * DATOS DE PRUEBA (Solo se activan si falla la URL o no está configurada)
 */
function mostrarDatosDePrueba() {
    const backup = [
        { id: 'SISTEMA-ERROR-01', difLogs: 5, difImg: 5, clasifImg: '0-15 Días' },
        { id: 'SISTEMA-ERROR-02', difLogs: 40, difImg: 42, clasifImg: '> 30 Días' }
    ];
    procesarYMostrar(backup);
}

// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', cargarDatos);
// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', cargarDatos);
