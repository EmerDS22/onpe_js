const getParticipacion = async () => {
    const id = (new URLSearchParams(window.location.search)).get('DPD')
    const data = await fetch (`http://localhost/onpe_sweb_php/participacion/Nacional/${DPD}`)
    if (data.status == 200){
        const participaciones = await data.json()
        let html = ``
        participacion.data.forEach(participacion => {
            html += `				
				<table class="table21">
                      <tbody id="resultados">
                        <tr class="titulo_tabla">
                          <td>DEPARTAMENTO</td>
                          <td>TOTAL ASISTENTES</td>
                          <td>% TOTAL ASISTENTES</td>
                          <td>TOTAL AUSENTES</td>
                          <td>% TOTAL AUSENTES</td>
                          <td>ELECTORES HÁBILES</td>
                        </tr>
                        <tr onclick="location.href='./participacion_total.html?id=nacional,${participacion.DPD}'" onmouseover="this.style.cursor = &quot;pointer&quot;; this.style.color = &quot;grey&quot;" onmouseout="this.style.color = &quot;black&quot;" style="cursor: pointer; color: black;">
                          <td>AMAZONAS</td>
                          <td>182,570</td>
                          <td>67.575%</td>
                          <td>87,605</td>
                          <td>32.425%</td>
                          <td>270,175</td>
                        </tr>
                        <tr>
                          <td>TOTALES</td>
                          <td>17,953,367</td>
                          <td>81.543%</td>
                          <td>4,063,663</td>
                          <td>18.457%</td>
                          <td>22,017,030</td>
                        </tr>
                      </tbody>
            `
        });
        document.getElementById('contenido-interno').innerHTML = html
    }
}