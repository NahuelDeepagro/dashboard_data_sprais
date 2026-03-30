/**
 * CONFIGURACIÓN DE LA FUENTE DE DATOS
 * Enlace actualizado a la hoja "Auxiliar" con el nuevo GID (813135547)
 */
const urlPlanilla = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-uq57ZAjgxzlcjOIWtlO_kya8IyM8RVDQW7iu_RkPMVVaWr91VCtxsTJQP6fjRmQj7855fMcoeu9h/pub?gid=813135547&single=true&output=csv';

/**
 * FUNCIÓN PRINCIPAL: CARGAR DATOS DESDE GOOGLE SHEETS
 */
async function cargarDatos() {
    const fechaMsg = document.getElementById('fecha-actualizacion');
    
    try {
        if (fechaMsg) fechaMsg.textContent = "Sincronizando con Google Sheets...";

        // Agregamos un timestamp para evitar caché
        const urlFinal = `${urlPlanilla}&t=${Date.now()}`;

        const respuesta = await fetch(urlFinal);
        
        if (!respuesta.ok) {
            throw new Error(`No se pudo conectar (Status: ${respuesta.status})`);
        }
        
        const textRaw = await respuesta.text();
        
        // Procesamos las líneas eliminando espacios en blanco al inicio/final de cada línea
        const lineas = textRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
        const filas = lineas.slice(1); 

        if (filas.length === 0) {
            throw new Error("La planilla no tiene datos después del encabezado.");
        }

        const datosMapeados = filas.map((fila) => {
            // Dividir por comas simple (Google CSV suele ser estándar)
            const columnas = fila.split(',');
            
            // Limpieza segura: solo si la columna existe
            const limpias = columnas.map(c => c ? c.replace(/^"|"$/g, '').trim() : "");

            // Si la columna A (ID) está vacía, ignoramos la fila
            if (!limpias[0] || limpias[0] === "") return null;

            // Función auxiliar para extraer números de forma segura
            const extraerNumero = (val) => {
                if (!val) return 0;
                const num = val.toString().replace(/[^0-9-]/g, '');
                return parseInt(num) || 0;
            };

            return {
                id: limpias[0],                                 // Col A: SPRIA ID
                difLogs: extraerNumero(limpias[1]),             // Col B: Dif Logs VS Hoy
                clasifLogs: limpias[2] || '---',                // Col C: Clasificacion Logs
                difImg: extraerNumero(limpias[3]),              // Col D: Dif Img VS Hoy
                clasifImg: limpias[4] || '---'                  // Col E: Clasificacion Img
            };
        }).filter(d => d !== null);

        if (datosMapeados.length === 0) {
            throw new Error("No se encontraron datos válidos en la hoja Auxiliar.");
        }

        procesarYMostrar(datosMapeados);

    } catch (error) {
        console.error("❌ Error de Conexión:", error);
        if (fechaMsg) {
            fechaMsg.innerHTML = `<span style="color: #e74c3c;">❌ Error: ${error.message}</span>`;
        }
        setTimeout(mostrarDatosDePrueba, 2000);
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

    // Orden alfabético por ID
    datos.sort((a, b) => a.id.localeCompare(b.id));

    datos.forEach(equipo => {
        let claseColor = "";
        
        // Lógica de colores basada en Dif Logs (Columna B)
        if (equipo.difLogs <= 15) {
            alDia++;
            claseColor = "success";
        } else if (equipo.difLogs <= 30) {
            aviso++;
            claseColor = "warning";
        } else {
            critico++;
            claseColor = "danger";
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
        ? `✅ <strong>Estado Óptimo:</strong> El ${porc}% de la flota está sincronizada.`
        : `⚠️ <strong>Revisión Necesaria:</strong> Se detectan ${av + cr} equipos con demoras.`;
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
            labels: ['0-15 días', '15-30 días', '>30 días'],
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
    if (lista && lista.children.length === 0) {
        const backup = [
            { id: 'EQUIPO-A-TEST', difLogs: 5, clasifLogs: '0-15 Días', difImg: 5, clasifImg: '0-15 Días' },
            { id: 'EQUIPO-B-TEST', difLogs: 40, clasifLogs: '> 30 Días', difImg: 40, clasifImg: '> 30 Días' }
        ];
        procesarYMostrar(backup);
    }
}

document.addEventListener('DOMContentLoaded', cargarDatos);
