function initNav() {
    fetch('/nav.html')
        .then(response => response.text())
        .then(html => {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            document.body.prepend(temp);
        });
}

function loadSeries(series) {
    const seriesElement = document.createElement('div');
    seriesElement.id = `series-${series.id}`;
    seriesElement.className = 'accordion-item';
    seriesElement.innerHTML = `
    <div class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#flush-collapse-${series.id}" aria-expanded="false" aria-controls="flush-collapse-${series.id}">
            <div class="row">
                <div class="col-auto">
                    <img src="${series.cover}" width="100" />
                </div>
                <div class="col">
                    <div class="lead fw-bold mb-2">${series.title}</div>
                    <div><span class="badge bg-primary mb-2">총 에피소드</span> <span id="episode-count-${series.id}"
                            class="badge">${series.episodes.length}</span></div>
                    <div><span class="badge bg-primary">업데이트</span> <span id="status-${series.id}"
                            class="badge">${series.episodes[series.episodes.length - 1].datetime.toISOString().split('T')[0]}</span></div>
                </div>
            </div>
        </button>
    </div>
    <div id="flush-collapse-${series.id}" class="accordion-collapse collapse" data-bs-parent="#series-list">
        <div class="accordion-body"></div>
    </div>`;
    document.getElementById('series-list').appendChild(seriesElement);
    loadEpisode(series);

    new Sortable(document.getElementById(`table-${series.id}`).getElementsByTagName('tbody')[0], {
        handle: '.handle',
        animation: 150,
        ghostClass: 'blue-background-class',
    });
}


function loadEpisode(series) {
    let accordion_body = document.getElementById(`flush-collapse-${series.id}`).getElementsByClassName('accordion-body')[0];
    accordion_body.innerHTML = `
    <form onsubmit="saveSeries('${series.id}'); return false;">
        <div class="text-end">
            <button id="btn-delete-series-${series.id}" class="btn btn-sm btn-danger collapse" type="button" 
            onclick="if(confirm('[${series.title}] 을(를) 삭제하시겠습니까?') == true) { deleteSeries('${series.id}') }">
                <i class="bi bi-trash"></i> 삭제
            </button>
        </div>
        <table id="table-${series.id}" class="table table-sm table-striped table-hover">
            <thead>
                <tr>
                    <th class="collapse drag-icon" width='30'></th>
                    <th><small>에피소드</small></th>
                    <th class="d-none d-md-table-cell" width='110'><small>최근 업데이트</small></th>
                    <th class="collapse delete-icon" width='30'></th>
                </tr>
            </thead>
            <tbody>
                ${series.episodes.map(episode => `
                <tr data-id="${episode.id}" style="cursor: pointer;" onclick="location.href='read?series=${series.id}&episode=${episode.id}'">
                    <td class="text-center align-middle collapse drag-icon handle"><i class="bi bi-list"></i></td>
                    <td><small>${episode.title}</small></td>
                    <td class="d-none d-md-table-cell"><small>${episode.datetime.toISOString().split('T')[0]}</small></td>
                    <td class="text-center align-middle collapse delete-icon">
                        <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
                    </td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot class="collapse">
                <tr>
                    <td colspan="4">
                        <div class="d-grid">
                            <button class='btn btn-sm btn-success d-block' type='button' onclick='newEpisode("${series.id}")'>
                                <i class="bi bi-plus-circle-fill"></i> 새 애피소드 추가
                            </button>
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>
        <div class="text-end">
            <button id="btn-edit-series-${series.id}" class="btn btn-sm btn-outline-primary" type="button" onclick="editSeries('${series.id}')">
                <i class="bi bi-pencil-fill"></i> 수정
            </button>
            <button id="btn-close-edit-series-${series.id}" class="btn btn-sm btn-outline-danger collapse" type="button" onclick="closeEdit('${series.id}')">
                <i class="bi bi-x-lg"></i> 취소
            </button>
            <button id="btn-save-series-${series.id}" class="btn btn-sm btn-outline-primary collapse" type="submit">
                <i class="bi bi-floppy-fill"></i> 저장
            </button>
        </div>
    </form>`;
}

function hideSpinner() {
    document.getElementById('spinner').classList.remove('d-flex');
    document.getElementById('spinner').classList.add('d-none');
}

function showSpinner() {
    document.getElementById('spinner').classList.remove('d-none');
    document.getElementById('spinner').classList.add('d-flex');
}