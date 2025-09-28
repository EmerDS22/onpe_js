const API_BASE = 'http://localhost/onpe_sweb_php';
const appContainer = document.getElementById('app-container');

const routes = {
    '': 'template-home',
    '#actas_ubigeo': 'template-actas-ubigeo',
    '#actas_numero': 'template-actas-numero',
    '#participacion': 'template-participacion',
    '#participacion_total': 'template-participacion-total',
};

function router() {
    const path = window.location.hash.split('/')[0] || '';
    const templateId = routes[path] || routes['']; 
    const template = document.getElementById(templateId);

    if (template) {
        appContainer.innerHTML = ''; 
        appContainer.appendChild(template.content.cloneNode(true));
        initializeView(path);
    } else {
        console.error(`Template no encontrado para la ruta: ${path}`);
        appContainer.innerHTML = '<p>Error: Contenido no encontrado.</p>';
    }
}

function initializeView(path) {
    switch (path) {
        case '#actas_ubigeo':
            initActasUbigeo();
            break;
        case '#actas_numero':
            initActasNumero();
            break;
        case '#participacion_total':
            initParticipacionTotal();
            break;
    }
}

document.addEventListener('DOMContentLoaded', router);
window.addEventListener('hashchange', router);

function initActasUbigeo() {
    const ambitoSelect = document.getElementById('cdgoAmbito');
    const depSelect = document.getElementById('cdgoDep');
    const provSelect = document.getElementById('cdgoProv');
    const distSelect = document.getElementById('cdgoDist');
    const localSelect = document.getElementById('actas_ubigeo');

    if (!ambitoSelect) return; 

    document.getElementById('divMesasContainer').innerHTML = '';
    document.getElementById('divActaDetailContainer').innerHTML = '';

    ambitoSelect.addEventListener('change', handleAmbitoChange);
    depSelect.addEventListener('change', handleDepartamentoChange);
    provSelect.addEventListener('change', handleProvinciaChange);
    distSelect.addEventListener('change', handleDistritoChange);
    localSelect.addEventListener('change', handleLocalChange);

    handleAmbitoChange();
}


function initActasNumero() {
    const form = document.getElementById('myform');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleNumeroSearch();
    });
}

function getUbigeoSeleccionado() {
    return {
        ambito: document.getElementById('cdgoAmbito').value,
        departamento: document.getElementById('cdgoDep').value,
        provincia: document.getElementById('cdgoProv').value,
        distrito: document.getElementById('cdgoDist').value,
        local: document.getElementById('actas_ubigeo').value,
    };
}

function handleAmbitoChange() {
    const { ambito } = getUbigeoSeleccionado();
    const scope = ambito === 'P' ? 'Peru' : 'Extranjero';
    document.getElementById('lblDepartamento').textContent = ambito === 'P' ? 'Departamento:' : 'Continente:';
    
    clearSelect(document.getElementById('cdgoDep'), '--SELECCIONE--');
    handleDepartamentoChange(); 
    
    fetchAndPopulate(`actas/ubigeo/${scope}`, 'cdgoDep', 'Detalle');
}

function handleDepartamentoChange() {
    const { ambito, departamento } = getUbigeoSeleccionado();
    const scope = ambito === 'P' ? 'Peru' : 'Extranjero';
    
    clearSelect(document.getElementById('cdgoProv'), '--SELECCIONE--');
    handleProvinciaChange();
    
    if (departamento) {
        fetchAndPopulate(`actas/ubigeo/${scope}/${departamento}`, 'cdgoProv', 'Detalle');
    }
}

function handleProvinciaChange() {
    const { ambito, departamento, provincia } = getUbigeoSeleccionado();
    const scope = ambito === 'P' ? 'Peru' : 'Extranjero';
    
    clearSelect(document.getElementById('cdgoDist'), '--SELECCIONE--');
    handleDistritoChange();
    
    if (provincia) {
        fetchAndPopulate(`actas/ubigeo/${scope}/${departamento}/${provincia}`, 'cdgoDist', 'Detalle');
    }
}

function handleDistritoChange() {
    const { ambito, departamento, provincia, distrito } = getUbigeoSeleccionado();
    const scope = ambito === 'P' ? 'Peru' : 'Extranjero';

    clearSelect(document.getElementById('actas_ubigeo'), '--SELECCIONE--');
    handleLocalChange();

    if (distrito) {
        fetchAndPopulate(`actas/ubigeo/${scope}/${departamento}/${provincia}/${distrito}`, 'actas_ubigeo', 'RazonSocial', 'idLocalVotacion');
    }
}

async function handleLocalChange() {
    const mesasContainer = document.getElementById('divMesasContainer');
    mesasContainer.innerHTML = '';
    document.getElementById('divActaDetailContainer').innerHTML = '';

    const { ambito, departamento, provincia, distrito, local } = getUbigeoSeleccionado();
    const scope = ambito === 'P' ? 'Peru' : 'Extranjero';

    if (local && local !== "-1?-1") {
        mesasContainer.innerHTML = '<p>Cargando mesas...</p>';
        const localId = document.querySelector('#actas_ubigeo').value;
        const endpoint = `actas/ubigeo/${scope}/${departamento}/${provincia}/${distrito}/${localId}`;

        try {
            const result = await apiFetch(endpoint);
            if (result.success && result.data) {
                displayMesas(result.data);
            } else {
                mesasContainer.innerHTML = '<p>No se encontraron mesas para este local.</p>';
            }
        } catch (error) {
            mesasContainer.innerHTML = '<p>Error al cargar las mesas. Intente nuevamente.</p>';
        }
    }
}

function displayMesas(data) {
    const container = document.getElementById('divMesasContainer');
    const mesas = Array.isArray(data) ? data : [data];
    
    let tableHTML = `<div class="col-xs-12 pbot30"><p class="subtitle">LISTADO DE MESAS (${mesas.length} en total)</p><div id="page-wrap"><table class="table17" cellspacing="0"><tbody><tr>`;
    mesas.forEach((mesa, index) => {
        tableHTML += `<td style="cursor:pointer;" data-mesa-id="${mesa.idGrupoVotacion}"><a>${mesa.idGrupoVotacion}</a></td>`;
        if ((index + 1) % 10 === 0) tableHTML += '</tr><tr>';
    });
    tableHTML += '</tr></tbody></table></div></div>';
    container.innerHTML = tableHTML;

    container.querySelectorAll('td[data-mesa-id]').forEach(cell => {
        cell.addEventListener('click', () => {
            const mesaId = cell.getAttribute('data-mesa-id');
            container.innerHTML = ''; 
            fetchAndDisplayMesaDetail(`actas/numero/${mesaId}`, 'divActaDetailContainer');
        });
    });
}

function handleNumeroSearch() {
    const nroMesa = document.getElementById('nroMesa').value.trim();
    if (nroMesa.length === 6 && /^\d+$/.test(nroMesa)) {
        fetchAndDisplayMesaDetail(`actas/numero/${nroMesa}`, 'divDetalle');
    } else {
        alert('Por favor, ingrese un número de mesa válido de 6 dígitos.');
    }
}

async function fetchAndDisplayMesaDetail(endpoint, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = 'Buscando detalle del acta...';
    try {
        const result = await apiFetch(endpoint);
        if (result.success && result.data) {
            const data = result.data;
            let backButton = '';
            if (containerId === 'divActaDetailContainer') { 
                backButton = `<button class="btn btn-primary pull-right" onclick="initActasUbigeo()"><span class="glyphicon glyphicon-chevron-left"></span> REGRESAR</button>`;
            }
            container.innerHTML = `
                <div class="contenido-resultados">
                    ${backButton}
                    <p>&nbsp;</p>
                    <div class="row">
                        <div class="tab-content">
                            <div id="detMesa">
                                <div class="row">
                                    <div class="col-xs-3 col-md-4">
                                        <div class="mesap01"><img src="images/mp-sin.jpg" class="img-responsive"></div>
                                    </div>
                                    <div class="col-xs-9 col-md-8">
                                        <p class="subtitle1">ACTA ELECTORAL</p>
                                        <table class="table13" cellspacing="0">
                                            <thead><tr><th>Mesa N°</th><th>N° Copia</th></tr></thead>
                                            <tbody><tr><td>${data.idGrupoVotacion}</td><td>${data.nCopia || 'N/A'}</td></tr></tbody>
                                        </table>
                                        <p class="subtitle1">INFORMACIÓN UBIGEO</p>
                                        <table class="table14" cellspacing="0">
                                            <tbody>
                                                <tr class="titulo_tabla"><td>${data.ambito === 'E' ? 'Continente' : 'Departamento'}</td><td>${data.ambito === 'E' ? 'País' : 'Provincia'}</td><td>Distrito</td><td>Local de votación</td></tr>
                                                <tr><td>${data.Departamento}</td><td>${data.Provincia}</td><td>${data.Distrito}</td><td>${data.RazonSocial}</td></tr>
                                            </tbody>
                                        </table>
                                        <p class="subtitle1">INFORMACIÓN MESA</p>
                                        <table class="table15" cellspacing="0">
                                            <tbody>
                                                <tr class="titulo_tabla"><td>Electores hábiles</td><td>Total votantes</td><td>Estado del acta</td></tr>
                                                <tr><td>${data.ElectoresHabiles}</td><td>${data.TotalVotantes}</td><td>${data.estadoActa || 'NORMAL'}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <p class="subtitle1">INFORMACIÓN DEL ACTA ELECTORAL</p>
                                <table class="table06">
                                    <tbody>
                                        <tr class="titulo_tabla"><td colspan="2">Organización política</td><td>Total de Votos</td></tr>
                                        <tr><td>PERUANOS POR EL KAMBIO</td><td><img width="40px" height="40px" src="images/simbolo_pkk.jpg"></td><td>${data.P1}</td></tr>
                                        <tr><td>FUERZA POPULAR</td><td><img width="40px" height="40px" src="images/simbolo_keyko.jpg"></td><td>${data.P2}</td></tr>
                                        <tr><td colspan="2">VOTOS EN BLANCO</td><td>${data.VotosBlancos}</td></tr>
                                        <tr><td colspan="2">VOTOS NULOS</td><td>${data.VotosNulos}</td></tr>
                                        <tr><td colspan="2">VOTOS IMPUGNADOS</td><td>${data.VotosImpugnados}</td></tr>
                                        <tr><td colspan="2">TOTAL DE VOTOS EMITIDOS</td><td>${data.TotalVotantes}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`;
        } else {
            container.innerHTML = `<div class="contenido-resultados"><div class="tab-info">${result.message || 'El número de mesa no existe o no se encontró.'}</div></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="contenido-resultados"><div class="tab-info">Ocurrió un error al realizar la búsqueda.</div></div>`;
    }
}

function initParticipacionTotal() {
    cargarDatosParticipacion();
    configurarBotonRegresar();
}

function getUrlParams() {
    const hashParts = window.location.hash.split('/');
    if (hashParts.length > 1) {
        const params = hashParts[1].split(',');
        return {
            ambito: params[0] || 'Nacional',
            departamento: params[1] || null,
            provincia: params[2] || null,
        };
    }
    return { ambito: 'Nacional', departamento: null, provincia: null };
}

async function cargarDatosParticipacion() {
    const params = getUrlParams();
    let apiUrl = `${API_BASE}/participacion/${params.ambito}`;
    
    if (params.departamento) apiUrl += `/${params.departamento}`;
    if (params.provincia) apiUrl += `/${params.provincia}`;

    try {
        const result = await apiFetch(apiUrl.substring(API_BASE.length + 1)); 
        if (result.success && result.data) {
            actualizarTablaParticipacion(result.data, params);
            actualizarResumenParticipacion(result.data, params);
            actualizarBreadcrumb(params);
        } else {
            mostrarMensajeErrorParticipacion();
        }
    } catch (error) {
        mostrarMensajeErrorParticipacion();
    }
}

function actualizarTablaParticipacion(datos, params) {
    const tbody = document.getElementById('resultados-participacion');
    if (!tbody) return;

    const firstHeaderCell = tbody.querySelector('.titulo_tabla td:first-child');
    if (params.ambito === 'Extranjero' && !params.departamento) {
        firstHeaderCell.textContent = 'Continente';
    } else if (params.ambito === 'Extranjero' && params.departamento && !params.provincia) {
        firstHeaderCell.textContent = 'PAÍS';
    } else if (params.ambito === 'Nacional' && params.departamento && !params.provincia) {
        firstHeaderCell.textContent = 'PROVINCIA';
    } else if (params.ambito === 'Nacional' && params.departamento) {
        firstHeaderCell.textContent = 'DISTRITO';
    } else {
        firstHeaderCell.textContent = 'DEPARTAMENTO';
    }

    tbody.querySelectorAll("tr:not(.titulo_tabla)").forEach(row => row.remove());
    
    let totalAsistentes = 0, totalAusentes = 0, totalHabiles = 0;
    const datosArray = Array.isArray(datos) ? datos : [datos];

    datosArray.forEach(row => {
        const tr = document.createElement('tr');
        let nextLevel = '';
        const locationName = row.DPD;

        if (!params.departamento) nextLevel = `#participacion_total/${params.ambito},${row.DPD}`;
        else if (!params.provincia) nextLevel = `#participacion_total/${params.ambito},${params.departamento},${row.DPD}`;

        if (nextLevel) {
            tr.style.cursor = 'pointer';
            tr.onclick = () => window.location.hash = nextLevel;
            tr.onmouseover = () => tr.style.backgroundColor = '#f0f0f0';
            tr.onmouseout = () => tr.style.backgroundColor = '';
        }

        const asistentes = parseInt(String(row.TV).replace(/,/g, ''));
        const ausentes = parseInt(String(row.TA).replace(/,/g, ''));
        const habiles = parseInt(String(row.EH).replace(/,/g, ''));
        
        totalAsistentes += asistentes;
        totalAusentes += ausentes;
        totalHabiles += habiles;

        tr.innerHTML = `
            <td>${locationName}</td>
            <td>${formatNumber(asistentes)}</td>
            <td>${row.PTV}</td>
            <td>${formatNumber(ausentes)}</td>
            <td>${row.PTA}</td>
            <td>${formatNumber(habiles)}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalRow = document.createElement('tr');
    totalRow.style.fontWeight = 'bold';
    totalRow.style.backgroundColor = '#f5f5f5';
    const porcAsistentes = totalHabiles > 0 ? ((totalAsistentes / totalHabiles) * 100).toFixed(3) : 0;
    const porcAusentes = totalHabiles > 0 ? ((totalAusentes / totalHabiles) * 100).toFixed(3) : 0;
    totalRow.innerHTML = `
        <td>TOTALES</td>
        <td>${formatNumber(totalAsistentes)}</td>
        <td>${porcAsistentes}%</td>
        <td>${formatNumber(totalAusentes)}</td>
        <td>${porcAusentes}%</td>
        <td>${formatNumber(totalHabiles)}</td>
    `;
    tbody.appendChild(totalRow);
}

function actualizarResumenParticipacion(datos, params) {
    let totalAsistentes = 0, totalAusentes = 0, totalHabiles = 0;
    const datosArray = Array.isArray(datos) ? datos : [datos];
    datosArray.forEach(row => {
        totalAsistentes += parseInt(String(row.TV).replace(/,/g, ''));
        totalAusentes += parseInt(String(row.TA).replace(/,/g, ''));
        totalHabiles += parseInt(String(row.EH).replace(/,/g, ''));
    });

    const porcParticipacion = totalHabiles > 0 ? ((totalAsistentes / totalHabiles) * 100).toFixed(3) : 0;
    const porcAusentismo = totalHabiles > 0 ? ((totalAusentes / totalHabiles) * 100).toFixed(3) : 0;

    let ambitoTexto = params.ambito;
    if (params.provincia) ambitoTexto = `${params.departamento} / ${params.provincia}`;
    else if (params.departamento) ambitoTexto = params.departamento;
    
    document.getElementById('ambito-texto').textContent = `Ámbito: ${ambitoTexto}`;
    document.getElementById('electores-habiles-texto').textContent = `ELECTORES HÁBILES ${formatNumber(totalHabiles)}`;
    
    const resumenTbody = document.getElementById('participacion-resumen');
    if (resumenTbody) {
        resumenTbody.innerHTML = `
            <tr><td>TOTAL: ${formatNumber(totalAsistentes)}</td><td>TOTAL: ${formatNumber(totalAusentes)}</td></tr>
            <tr><td>% TOTAL: ${porcParticipacion}%</td><td>% TOTAL: ${porcAusentismo}%</td></tr>`;
    }

    const img = document.getElementById('participacion-img');
    if (img) img.src = `images/estadistico.png?_tot_participacion=${porcParticipacion}&_tot_ausentismo=${porcAusentismo}`;
}

function actualizarBreadcrumb(params) {
    const container = document.getElementById('breadcrumb-container');
    if (!container) return;

    let breadcrumbHTML = '<span>Ubicación: </span>';
    const ambitoLink = params.ambito === 'Nacional' ? '#participacion_total/Nacional' : '#participacion_total/Extranjero';
    breadcrumbHTML += `<a href="${ambitoLink}">${params.ambito}</a>`;
    
    if (params.departamento) {
        breadcrumbHTML += ` > <a href="${ambitoLink},${params.departamento}">${params.departamento}</a>`;
    }
    if (params.provincia) {
        breadcrumbHTML += ` > ${params.provincia}`;
    }
    container.innerHTML = breadcrumbHTML;
}

function configurarBotonRegresar() {
    const botonRegresar = document.getElementById('btnRegresarParticipacion');
    if (!botonRegresar) return;
    
    botonRegresar.onclick = (e) => {
        e.preventDefault();
        const params = getUrlParams();
        if (params.provincia) {
            window.location.hash = `#participacion_total/${params.ambito},${params.departamento}`;
        } else if (params.departamento) {
            window.location.hash = `#participacion_total/${params.ambito}`;
        } else {
            window.location.hash = '#participacion';
        }
    };
}

function mostrarMensajeErrorParticipacion() {
    const tbody = document.getElementById('resultados-participacion');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">No se pudieron cargar los datos.</td></tr>`;
    }
}

async function apiFetch(endpoint) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Error en fetch para ${endpoint}:`, error);
        throw error;
    }
}

async function fetchAndPopulate(endpoint, selectId, textField, valueField = null) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    
    try {
        const result = await apiFetch(endpoint);
        if (result.success && result.data) {
            populateSelect(selectElement, result.data, textField, valueField || textField);
        } else {
            clearSelect(selectElement, '--No hay datos--');
        }
    } catch (error) {
        clearSelect(selectElement, '--Error al cargar--');
    }
}

function populateSelect(selectElement, data, textField, valueField) {
    const items = Array.isArray(data) ? data : [data];
    selectElement.innerHTML = '<option value="">--SELECCIONE--</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElement.appendChild(option);
    });
}

function clearSelect(selectElement, defaultText) {
    if (selectElement) {
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    }
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}