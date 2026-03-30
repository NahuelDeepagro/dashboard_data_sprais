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
    const fechaMsg = document.getElementById('fecha-actualizacion');
    
    try {
        // 1. Verificación de URL
        if (!urlPlanilla || urlPlanilla.includes('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?output=csv') || !urlPlanilla.startsWith('http')) {
            console.warn("⚠️ URL no configurada. Cargando modo demostración.");
            if (fechaMsg) fechaMsg.innerHTML = '<span style="color: orange;">⚠️ Usando datos de prueba (URL no configurada)</span>';
            mostrarDatosDePrueba();
            return;
        }

        if (fechaMsg) fechaMsg.textContent = "Conectando con Google Sheets...";

        // 2. Evitar Caché
        const urlFinal = urlPlanilla.includes('?') 
            ? `${urlPlanilla}&t=${Date.now()}` 
            : `${urlPlanilla}?t=${Date.now()}`;

        const respuesta = await fetch(urlFinal);
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const textRaw = await respuesta.text();
        
        // Diagnóstico: Ver si recibimos HTML (error común de login) o CSV
        if (textRaw.includes('<html') || textRaw.includes('<!DOCTYPE')) {
            throw new Error("El enlace devuelve una página web, no un archivo CSV. Asegúrate de elegir 'Valores separados por comas (.csv)' al publicar.");
        }

        // 3. Procesamiento de líneas
        const lineas = textRaw.split(/\r?\n/).filter(l => l.trim() !== "");
        
        if (lineas.length <= 1) {
            throw new Error("La planilla parece estar vacía (solo tiene encabezados o nada).");
        }

        const filas = lineas.slice(1); // Omitir encabezado

        // 4. Mapeo de Datos
        const datosMapeados = filas.map((fila, index) => {
            // Detectar separador
            const separador = fila.includes(';') ? ';' : ',';
            const columnas = fila.split(separador).map(c => c.replace(/^"|"$/g, '').trim());

            // Validación de estructura mínima (Columnas A y B deben existir)
            if (!columnas[0] || columnas[0] === "") return null;

            return {
                id: columnas[0],                         // Col A: SPRIA ID
                difLogs: parseInt(columnas[1]) || 0,     // Col B: Dif Logs VS Hoy
                clasifLogs: columnas[2] || '---',        // Col C: Clasificacion Logs
                difImg: parseInt(columnas[3]) || 0,      // Col D: Dif Img VS Hoy
                clasifImg: columnas[4] || '---'          // Col E: Clasificacion Img
            };
        }).filter(d => d !== null);

        if (datosMapeados.length === 0) {
            throw new Error("No se encontraron equipos válidos en el archivo.");
        }

        procesarYMostrar(datosMapeados);

    } catch (error) {
        console.error("❌ Error de Conexión:", error);
        if (fechaMsg) {
            fechaMsg.innerHTML = `<span style="color: #e74c3c;">❌ Error: ${error.message}</span>`;
        }
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

    // Orden alfabético
    datos.sort((a, b) => a.id.localeCompare(b.id));

    datos.forEach(equipo => {
        let claseColor = "";
        let estadoText = "";

        // Lógica basada en Dif Logs
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
                <td>${equipo.clasifLogs}</td>
                <td>${equipo.difImg} días</td>
                <td><span class="badge ${claseColor}">${equipo.clasifImg}</span></td>
            </tr>
        `;
        lista.insertAdjacentHTML('beforeend', row);
    });

    actualizarKPIs(alDia, aviso, critico);
    
    const fecha = document.getElementById('fecha-actualizacion');
    if (fecha && !fecha.innerHTML.includes('❌')) {
        fecha.textContent = `Sincronizado: ${new Date().toLocaleTimeString()}`;
    }

    actualizarMensajeSalud(alDia, aviso, critico);
    generarGrafico(alDia, aviso, critico);
}

function actualizarKPIs(ok, av, cr) {
    const ids = { 'count-al-dia': ok, 'count-aviso': av, 'count-critico': cr };
    for (const [id, val] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
}

function actualizarMensajeSalud(ok, av, cr) {
    const box = document.getElementById('status-message');
    if (!box) return;
    
    const total = ok + av + cr;
    const porc = total > 0 ? ((ok / total) * 100).toFixed(1) : 0;

    box.innerHTML = porc > 85 
        ? `✅ <strong>Estado Óptimo:</strong> El ${porc}% de la flota sincroniza bien.`
        : `⚠️ <strong>Revisión Necesaria:</strong> Hay ${av + cr} equipos con retraso.`;
    box.style.borderColor = porc > 85 ? "#2ecc71" : "#f1c40f";
}

function generarGrafico(ok, av, cr) {
    const canvas = document.getElementById('graficoIntervalos');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    if (window.miGrafico) window.miGrafico.destroy();

    window.miGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['0-15d', '15-30d', '>30d'],
            datasets: [{
                data: [ok, av, cr],
                backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function mostrarDatosDePrueba() {
    const lista = document.getElementById('listaEquipos');
    // Solo mostramos prueba si la tabla está vacía
    if (lista && lista.children.length === 0) {
        const backup = [
            { id: 'DEMO-AL-DIA', difLogs: 2, clasifLogs: '0-15 Días', difImg: 2, clasifImg: '0-15 Días' },
            { id: 'DEMO-RETRASO', difLogs: 45, clasifLogs: '> 30 Días', difImg: 45, clasifImg: '> 30 Días' }
        ];
        procesarYMostrar(backup);
    }
}

document.addEventListener('DOMContentLoaded', cargarDatos);
