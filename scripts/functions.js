async function loadSeries(series) {
    var bookmarks = [];
    if (user) {
        bookmarks = user.bookmarks || [];
    }

    var episode_count = 0;
    series.episodes.forEach(ep => { if (ep.id > 0) episode_count++; });
    const last_episode = series.episodes.filter(ep => ep.id > 0).slice(-1)[0];

    const seriesElement = document.createElement('div');
    seriesElement.id = `series-${series.id}`;
    seriesElement.className = 'accordion-item';
    seriesElement.innerHTML = `
    <div id='series-header-${series.id}' class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#flush-collapse-${series.id}" aria-expanded="false" aria-controls="flush-collapse-${series.id}">
            <div class="row w-100">
                <div class="col-auto">
                    <img id='series-cover-${series.id}' src="${series.cover}" width="100" />
                </div>
                <div class="col">
                    <div id='series-title-${series.id}' class="fs-6 fw-bold mb-3">${getBookmarkIcon(bookmarks, series.id)}${series.title}</div>
                    <div><span class="badge bg-primary mb-2">총 에피소드</span> <span id="episode-count-${series.id}"
                            class="badge">${episode_count}</span></div>
                    <div><span class="badge bg-primary">최근 업데이트</span> <span id="status-${series.id}"
                            class="badge">${last_episode.datetime.toISOString().split('T')[0]}</span></div>
                    <div class="text-end mt-3">
                        <a href="javascript:deleteSeries('${series.id}')" id="btn-delete-series-${series.id}" class="btn btn-sm btn-danger collapse">
                            <i class="bi bi-trash"></i> 삭제</a>
                    </div>
                </div>
            </div>
        </button>
    </div>
    <div id="flush-collapse-${series.id}" class="accordion-collapse collapse" data-bs-parent="#series-list">
        <div class="accordion-body"></div>
    </div>`;
    document.getElementById('series-list').appendChild(seriesElement);
    loadEpisode(series);

    const img = document.getElementById(`series-cover-${series.id}`);
    img.onerror = function () {
        this.onerror = null;
        this.src = './images/cover_placeholder.png';
    };

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
        <table id="table-${series.id}" class="table table-sm table-striped table-hover">
            <thead>
                <tr>
                    <th class="collapse drag-icon" width='30'></th>
                    <th><small>에피소드</small></th>
                    <th class="d-none d-md-table-cell text-center" width='100'><small>작성일</small></th>
                    <th class="collapse delete-icon" width='30'></th>
                </tr>
            </thead>
            <tbody>
                ${series.episodes.map(episode => {
        if (episode.id > 0) {
            if (user && user.viewed && user.viewed[series.id] && user.viewed[series.id].includes(episode.id)) {
                return `
            <tr data-id="${episode.id}" style="cursor: pointer;" onclick="location.href='read?series=${series.id}&episode=${episode.id}'">
                <td class="text-center align-middle collapse drag-icon handle"><i class="bi bi-list"></i></td>
                <td class="text-secondary-emphasis"><small>${episode.title}</small></td>
                <td class="d-none d-md-table-cell text-center text-secondary-emphasis"><small>${episode.datetime.toISOString().split('T')[0]}</small></td>
                <td class="text-center align-middle collapse delete-icon">
                    <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
                </td>
            </tr>`;
            } else {
                return `
            <tr data-id="${episode.id}" style="cursor: pointer;" onclick="location.href='read?series=${series.id}&episode=${episode.id}'">
                <td class="text-center align-middle collapse drag-icon handle"><i class="bi bi-list"></i></td>
                <td><small>${episode.title}</small></td>
                <td class="d-none d-md-table-cell text-center"><small>${episode.datetime.toISOString().split('T')[0]}</small></td>
                <td class="text-center align-middle collapse delete-icon">
                    <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
                </td>
            </tr>`;
            }
        } else {
            return `
            <tr data-id="${episode.id}">
                <td class="text-center align-middle collapse drag-icon handle bg-black"><i class="bi bi-list"></i></td>
                <td class="fw-bold bg-black"><small>${episode.title}</small></td>
                <td class="d-none d-md-table-cell bg-black"></td>
                <td class="text-center align-middle collapse delete-icon bg-black">
                    <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
                </td>
            </tr>`;
        }
    }).join('')}
            </tbody>
            <tfoot class="collapse">
                <tr>
                    <td colspan="4">
                        <div class="d-flex justify-content-center gap-2">
                            <button class='btn btn-sm btn-success d-block' type='button' onclick='newEpisode("${series.id}")'>
                                <i class="bi bi-plus-circle-fill"></i> 새 애피소드 추가
                            </button>
                            <button class='btn btn-sm btn-light d-block' type='button' onclick='newHorizontalLine("${series.id}")'>
                                <i class="bi bi-plus-circle-fill"></i> 구분선 추가
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


function newEpisode(seriesId) {
    if (seriesId == "new-series") {
        var episodeList = document.getElementById('episode-list');
        var newEpisodeItem = document.createElement('div');
        newEpisodeItem.className = 'list-group-item d-flex align-items-center border-0 px-0 pt-0';
        newEpisodeItem.innerHTML = `
        <i class="bi bi-list pe-2 d-block col-auto handle"></i>
        <div class="col">
            <span class="status fst-italic text-secondary"><small>에피소드 제목</small></span>
            <span class="spinner-border spinner-border-sm visually-hidden" aria-hidden="true"></span>
            <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                <input type="url" class="form-control" placeholder="번역글 링크"
                    pattern="https://(gall\.dcinside\.com/|m\.dcinside\.com/).*"
                    title="URL은 https://gall.dcinside.com 또는 https://m.dcinside.com로 시작해야 합니다."
                    onchange="getTitle(this)" required/>
            </div>
        </div>
        <i class="bi bi-trash ps-2 text-danger d-block col-auto" style="cursor: pointer;" onclick="removeRow(this)"></i>`;
        episodeList.appendChild(newEpisodeItem);

    } else {
        var table = document.getElementById(`table-${seriesId}`);
        var tbody = table.getElementsByTagName('tbody')[0];
        var tr = document.createElement('tr');
        tr.innerHTML = `
        <td class="text-center align-middle handle"><i class="bi bi-list"></i></td>
        <td>
            <span class="status fst-italic text-secondary"><small>에피소드 제목</small></span>
            <span class="spinner-border spinner-border-sm visually-hidden" aria-hidden="true"></span>
            <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                <input type="url" class="form-control" placeholder="번역글 링크" 
                    pattern="https://(gall\.dcinside\.com/|m\.dcinside\.com/).*" 
                    title="URL은 https://gall.dcinside.com/ 또는 https://m.dcinside.com/로 시작해야 합니다."
                    onchange="getTitle(this, '${seriesId}')" />
            </div>
        </td>
        <td class="d-none d-md-table-cell"></td>
        <td class="text-center align-middle delete-icon">
            <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
        </td>`;
        tbody.appendChild(tr);
    }
}


function newHorizontalLine(seriesId) {
    if (seriesId == "new-series") {
        var episodeList = document.getElementById('episode-list');
        var newEpisodeItem = document.createElement('div');
        newEpisodeItem.className = 'list-group-item d-flex align-items-center bg-black border-0 px-0 py-1';
        newEpisodeItem.innerHTML = `
        <i class="bi bi-list pe-2 d-block col-auto handle"></i>
        <div class="col">
            <div class="input-group input-group-sm">
                <input type="text" class="form-control" placeholder="구분선 내용" required/>
            </div>
        </div>
        <i class="bi bi-trash ps-2 text-danger d-block col-auto" style="cursor: pointer;" onclick="removeRow(this)"></i>`;
        episodeList.appendChild(newEpisodeItem);

    } else {
        var table = document.getElementById(`table-${seriesId}`);
        var tbody = table.getElementsByTagName('tbody')[0];
        var tr = document.createElement('tr');
        tr.innerHTML = `
        <td class="text-center align-middle handle bg-black"><i class="bi bi-list"></i></td>
        <td class="bg-black">
            <div class="input-group input-group-sm">
                <input type="text" class="form-control" placeholder="구분선 내용" required/>
            </div>
        </td>
        <td class="d-none d-md-table-cell bg-black"></td>
        <td class="text-center align-middle delete-icon bg-black">
            <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
        </td>`;
        tbody.appendChild(tr);
    }
}

function removeRow(element) {
    var row = element.closest('tr');
    if (row) {
        row.remove();
    } else {
        if (document.getElementById('episode-list').children.length > 1) {
            row = element.closest('.list-group-item');
            if (row) {
                row.remove();
            }
        }
    }
}

function previewCoverImage(input, id) {
    const url = input.value;
    const img = document.getElementById(id);

    try {
        new URL(url);
        img.src = url;
        img.onerror = function () {
            this.onerror = null;
            this.src = './images/cover_placeholder.png';
        };

    } catch (error) {
        img.src = './images/cover_placeholder.png';
    }
}

async function showSuggestions(value) {
    const data = await firebaseDB.readData();
    const suggestions = data.filter(series => series.title.includes(value)).slice(0, 10);
    const list = document.getElementById('autocomplete-list');
    list.innerHTML = '';
    suggestions.forEach(series => {
        const item = document.createElement('li');
        item.innerHTML = `<a href='read.html?series=${series.id}' class='dropdown-item text-wrap'><small>${series.title}</small></a>`;
        list.appendChild(item);
    });
    if (value && suggestions.length > 0) {
        list.classList.add('show');
    } else {
        list.classList.remove('show');
    }
}

function hideSpinner() {
    document.getElementById('spinner').classList.remove('d-flex');
    document.getElementById('spinner').classList.add('d-none');
}

function showSpinner() {
    document.getElementById('spinner').classList.remove('d-none');
    document.getElementById('spinner').classList.add('d-flex');
}

function displayError(no, message) {
    document.querySelector('#main-container').innerHTML = `
    <div class="position-absolute top-50 start-50 translate-middle text-center w-100 text-secondary">
        <h1 class='fw-bold'>ERROR ${no}</h1>
        <span>${message}</span>
    </div>`;
}

function getBookmarkIcon(bookmarks, seriesId) {
    if (user) {
        if (bookmarks.includes(seriesId)) {
            return `<i id="bookmark-${seriesId}" class="bi bi-star-fill text-warning" data-bookmarked="true"
onclick="toggleBookmark(event, '${seriesId}')" style="cursor: pointer;"></i> `;
        } else {
            return `<i id="bookmark-${seriesId}" class="bi bi-star text-secondary" data-bookmarked="false"
onclick="toggleBookmark(event, '${seriesId}')" style="cursor: pointer;"></i> `;
        }
    } else {
        return '';
    }
}

async function toggleBookmark(event = null, seriesId) {
    if (user) {
        var userInfo = JSON.parse(window.sessionStorage.getItem('googleUser'));
        var bookmark = document.getElementById(`bookmark - ${seriesId} `);

        if (bookmark.getAttribute('data-bookmarked') == "true") {
            bookmark.classList.add('bi-star');
            bookmark.classList.remove('bi-star-fill');
            bookmark.classList.add('text-secondary');
            bookmark.classList.remove('text-warning');
            bookmark.setAttribute('data-bookmarked', 'false');
            await firebaseDB.removeBookmark(userInfo.email, seriesId);

            if (location.pathname.includes('bookmark')) {
                location.reload();
            }

        } else {
            bookmark.classList.remove('bi-star');
            bookmark.classList.add('bi-star-fill');
            bookmark.classList.remove('text-secondary');
            bookmark.classList.add('text-warning');
            bookmark.setAttribute('data-bookmarked', 'true');
            await firebaseDB.addBookmark(userInfo.email, seriesId);
        }
    }
}

async function handleCredentialResponse(response) {
    const token = response.credential;
    const userInfo = parseJwt(token);
    window.sessionStorage.setItem('googleUser', JSON.stringify(userInfo));
    const user = await firebaseDB.getUser(userInfo.email);
    if (!user) {
        await firebaseDB.addUser(userInfo);
    }
    location.reload();
}