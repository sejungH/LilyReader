function loadTags() {
    var tagsContainer = document.getElementById('tags');
    tagsContainer.innerHTML = '';
    for (const tag of TAGS) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm rounded-pill text-nowrap';
        button.dataset.bsToggle = 'button';
        button.textContent = tag;
        button.onclick = function () {
            let selected = [];
            this.parentElement.querySelectorAll('.active').forEach(item => {
                selected.push(item.textContent.trim());
            });
            reloadSeries();
        };
        tagsContainer.appendChild(button);
    }
}

function getTags() {
    var tagsContainer = document.getElementById('tags');
    var tags = [];
    tagsContainer.querySelectorAll('.active').forEach(item => {
        tags.push(item.textContent.trim());
    });
    return tags;
}

function loadView() {
    let view = localStorage.getItem('view') || 'list';
    document.getElementById('view-radio').querySelector(`input[id=btn${view}]`).checked = true;
}

function currView(view) {
    localStorage.setItem('view', view);
    reloadSeries();
}

async function loadSeries(series) {
    const view = localStorage.getItem('view') || 'list';
    var bookmarks = [];
    if (user) {
        bookmarks = user.bookmarks || [];
    }

    var episode_count = 0;
    series.episodes.forEach(ep => { if (ep.id > 0) episode_count++; });
    const last_episode = series.episodes.filter(ep => ep.id > 0).slice(-1)[0];
    const seriesListDiv = document.getElementById('series-list');

    if (view == "list" || location.pathname.includes("read")) {
        seriesListDiv.classList.add('accordion');
        seriesListDiv.classList.remove('row');

        const seriesElement = document.createElement('div');
        seriesElement.id = `series-${series.id}`;
        seriesElement.className = 'accordion-item';
        seriesElement.innerHTML = `
        <div id='series-header-${series.id}' class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                data-bs-target="#flush-collapse-${series.id}" aria-expanded="false" aria-controls="flush-collapse-${series.id}">
                <div class="row w-100">
                    <div class="col-auto">
                        <img id='series-cover-${series.id}' src="${series.cover}" class="rounded shadow" width="100" style="aspect-ratio: 2 / 3; object-fit: cover;" />
                    </div>
                    <div class="col">
                        <div id='series-title-${series.id}' class="fs-6 fw-bold mb-2">${getBookmarkIcon(bookmarks, series.id)}${series.title}</div>
                        <div class="my-2"><span class="badge bg-primary">총 에피소드</span> <span id="episode-count-${series.id}"
                                class="badge">${episode_count}</span></div>
                        <div class="my-2"><span class="badge bg-primary">최근 업데이트</span> <span id="status-${series.id}"
                                class="badge">${last_episode.datetime.toISOString().split('T')[0]}</span></div>
                        <div id="series-tags-${series.id}" class="d-flex align-items-center gap-1 my-2 series-tags">${series.tags ? series.tags.map(tag => `<span class="badge text-bg-light rounded-pill"><i class="bi bi-hash"></i>${tag}</span>`).join(' ') : ''}</div>
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
        seriesListDiv.appendChild(seriesElement);
        loadEpisode(series);

        document.getElementById(`flush-collapse-${series.id}`).addEventListener('shown.bs.collapse', function () {
            const header = document.getElementById(`series-header-${series.id}`);
            if (header) {
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        new Sortable(document.getElementById(`table-${series.id}`).getElementsByTagName('tbody')[0], {
            handle: '.handle',
            animation: 150,
            ghostClass: 'blue-background-class',
        });

    } else if (view == "grid") {
        seriesListDiv.classList.remove('accordion');
        seriesListDiv.classList.add('row');

        const seriesElement = document.createElement('div');
        seriesElement.id = `series-${series.id}`;
        seriesElement.className = 'col-4 col-md-2';
        seriesElement.innerHTML = `
            <div class="d-flex flex-column align-items-center mb-3" style="cursor: pointer;" onclick="location.href='./read?series=${series.id}'">
                <div class="position-relative w-100">
                    <img id="series-cover-${series.id}" src="${series.cover}" class="rounded shadow w-100" style="aspect-ratio: 2 / 3; object-fit: cover;" />
                    <div class="position-absolute top-0 start-0 fs-4 p-2">${getBookmarkIcon(bookmarks, series.id)}</div>
                    <div class="position-absolute top-0 end-0 fs-5 p-2">
                        <span class="badge text-bg-primary rounded-pill">${episode_count}</span>
                    </div>
                    <div class="position-absolute bottom-0 start-50 translate-middle-x fs-6 p-2">
                        <span class="badge text-bg-dark py-1 px-2 fw-light">${last_episode.datetime.toISOString().split('T')[0]}</span>
                    </div>
                </div>
                <div id="series-title-${series.id}" class="fw-bold mb-2 mt-2 text-center">${series.title}</div>
            </div>
        
        `;
        seriesListDiv.appendChild(seriesElement);
        let titleElement = document.getElementById(`series-title-${series.id}`);
        titleElement.style.fontSize = "0.8rem";
        titleElement.style.display = "-webkit-box";
        titleElement.style.webkitLineClamp = "2";
        titleElement.style.webkitBoxOrient = "vertical";
        titleElement.style.overflow = "hidden";
        titleElement.style.textOverflow = "ellipsis";
    }

    const img = document.getElementById(`series-cover-${series.id}`);
    img.onerror = function () {
        this.onerror = null;
        this.src = './images/cover_placeholder.png';
    };

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
                                <i class="bi bi-plus-circle-fill"></i> 새 애피소드
                            </button>
                            <button class="btn btn-sm btn-primary d-block" type="button" onclick="newSeries('${series.id}')">
                                <i class="bi bi-plus-circle-fill"></i> 시리즈로 추가
                            </button>
                            <button class='btn btn-sm btn-light d-block' type='button' onclick='newHorizontalLine("${series.id}")'>
                                <i class="bi bi-plus-circle-fill"></i> 구분선
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


function newEpisode(seriesId, episode = null) {
    if (seriesId == "new-series") {
        var episodeList = document.getElementById('episode-list');
        var newEpisodeItem = document.createElement('div');
        newEpisodeItem.className = 'list-group-item d-flex align-items-center border-0 px-0 pt-0';
        if (episode) {
            newEpisodeItem.innerHTML = `
            <i class="bi bi-list pe-2 d-block col-auto handle"></i>
            <div class="col">
                <span class="status fst-italic text-secondary"><small>${episode.title}</small></span>
                <span class="spinner-border spinner-border-sm visually-hidden" aria-hidden="true"></span>
                <div class="input-group input-group-sm">
                    <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                    <input type="url" class="form-control" placeholder="번역글 링크"
                        pattern="https://(gall\.dcinside\.com/|m\.dcinside\.com/).*"
                        title="URL은 https://gall.dcinside.com 또는 https://m.dcinside.com로 시작해야 합니다."
                        onchange="getTitle(this)" value="https://gall.dcinside.com/mgallery/board/view?id=lilyfever&no=${episode.id}"
                        data-episode='${JSON.stringify(episode)}' required/>
                </div>
            </div>
            <i class="bi bi-trash ps-2 text-danger d-block col-auto" style="cursor: pointer;" onclick="removeRow(this)"></i>`;

        } else {
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
        }
        episodeList.appendChild(newEpisodeItem);

    } else {
        var table = document.getElementById(`table-${seriesId}`);
        var tbody = table.getElementsByTagName('tbody')[0];
        var tr = document.createElement('tr');
        if (episode) {
            tr.innerHTML = `
            <td class="text-center align-middle handle"><i class="bi bi-list"></i></td>
            <td>
                <span class="status fst-italic text-secondary"><small>${episode.title}</small></span>
                <span class="spinner-border spinner-border-sm visually-hidden" aria-hidden="true"></span>
                <div class="input-group input-group-sm">
                    <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                    <input type="url" class="form-control" placeholder="번역글 링크" 
                        pattern="https://(gall\.dcinside\.com/|m\.dcinside\.com/).*" 
                        title="URL은 https://gall.dcinside.com/ 또는 https://m.dcinside.com/로 시작해야 합니다."
                        onchange="getTitle(this, '${seriesId}')" value="https://gall.dcinside.com/mgallery/board/view?id=lilyfever&no=${episode.id}" 
                        data-episode='${JSON.stringify(episode)}' />
                </div>
            </td>
            <td class="d-none d-md-table-cell"></td>
            <td class="text-center align-middle delete-icon">
                <i class="bi bi-trash text-danger" style="cursor: pointer;" onclick="removeRow(this)"></i>
            </td>`;
        } else {
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
        }

        tbody.appendChild(tr);
    }
}

function editSeries(seriesId) {
    let series;
    if (typeof window.series !== "undefined") { series = window.series };
    if (typeof window.seriesList !== "undefined") { series = window.seriesList.find(s => s.id === seriesId) };
    if (series) {
        var series_title = document.getElementById(`series-title-${seriesId}`);
        series_title.innerHTML = `
                <div class='input-group input-group-sm'>
                    <span class='input-group-text'><i class="bi bi-pencil-fill"></i></span>
                    <input type="text" id="input-edit-series-title-${seriesId}" class='form-control' value="${series.title}" required />
                </div>`;
        series_title.innerHTML += `
                <div class='input-group input-group-sm mt-2'>
                    <span class='input-group-text'><i class="bi bi-image"></i></span>
                    <input type="url" id="input-edit-series-cover-${seriesId}" class='form-control' value="${series.cover}" onchange="previewCoverImage(this, 'series-cover-${series.id}')" />
                </div>`;

        var series_tags = document.getElementById(`series-tags-${seriesId}`);
        for (let tag of series_tags.children) {
            tag.innerHTML += ` <i class="bi bi-x-lg"></i>`;
            tag.setAttribute('onclick', `removeTag(this)`);
        }
        series_tags.innerHTML += `
        <div class="dropdown d-inline-block">
            <button type="button" class="btn btn-outline-light badge rounded-pill dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">+ 태그추가</button>
            <ul class="dropdown-menu" id="tags-dropdown-${seriesId}">
                ${TAGS.map(tag => {
            if (series.tags.includes(tag)) {
                return `<li><button type="button" class="dropdown-item disabled" onclick="javascript:addTag(this)"><small>${tag}</small></button></li>`;
            } else {
                return `<li><button type="button" class="dropdown-item" onclick="javascript:addTag(this)"><small>${tag}</small></button></li>`;
            }
        }).join('')}
            </ul>
        </div>`;
        var table = document.getElementById(`table-${seriesId}`);
        for (var icon of table.getElementsByClassName('drag-icon')) {
            icon.classList.toggle('collapse');
        }
        for (var icon of table.getElementsByClassName('delete-icon')) {
            icon.classList.toggle('collapse');
        }

        newEpisode(seriesId);

        var tfoot = table.getElementsByTagName('tfoot')[0];
        tfoot.classList.toggle('collapse');

        document.getElementById(`btn-edit-series-${seriesId}`).classList.add('collapse')
        document.getElementById(`btn-close-edit-series-${seriesId}`).classList.toggle('collapse');
        document.getElementById(`btn-save-series-${seriesId}`).classList.toggle('collapse');
        document.getElementById(`btn-delete-series-${seriesId}`).classList.toggle('collapse');

        table.querySelectorAll('tbody tr').forEach(tr => {
            tr.removeAttribute('onclick');
        });

        document.querySelectorAll('.accordion-button').forEach(button => {
            button.removeAttribute('data-bs-toggle');
        });

    } else {
        console.error(`Series with ID ${seriesId} not found.`);
    }
}

function addTag(tagElement) {
    let tag = tagElement.textContent.trim();

    let series_tags = tagElement.closest('.series-tags');

    let span = document.createElement('span');
    span.className = 'badge text-bg-light rounded-pill';
    span.innerHTML = `<i class="bi bi-hash"></i>${tag} <i class="bi bi-x-lg"></i>`;
    span.setAttribute('onclick', `removeTag(this)`);
    series_tags.querySelector('div.dropdown').before(span);

    let dropdown = series_tags.querySelector(`div.dropdown`);
    dropdown.querySelectorAll('li').forEach(li => {
        let button = li.querySelector('button');
        if (button.textContent.trim() === tag) {
            button.classList.add('disabled');
        }
    });
}

function removeTag(tagElement) {
    let tag = tagElement.textContent.trim();
    let series_tags = tagElement.closest('.series-tags');

    let dropdown = series_tags.querySelector(`div.dropdown`);
    dropdown.querySelectorAll('li').forEach(li => {
        let button = li.querySelector('button');
        if (button.textContent.trim() === tag) {
            button.classList.remove('disabled');
        }
    });

    tagElement.remove();
}

function closeEdit(seriesId) {
    let series;
    if (typeof window.series !== "undefined") { series = window.series };
    if (typeof window.seriesList !== "undefined") { series = window.seriesList.find(s => s.id === seriesId) };
    if (series) {
        var series_title = document.getElementById(`series-title-${seriesId}`);
        series_title.innerHTML = series.title;
        var series_cover = document.getElementById(`series-cover-${seriesId}`);
        series_cover.src = series.cover;
        document.getElementById(`btn-delete-series-${seriesId}`).classList.toggle('collapse');

        let series_tags = document.getElementById(`series-tags-${seriesId}`);
        series_tags.innerHTML = '';
        series.tags.forEach(tag => {
            let span = document.createElement('span');
            span.className = 'badge text-bg-light rounded-pill';
            span.innerText = tag;
            series_tags.appendChild(span);
        });

        document.querySelectorAll('.accordion-button').forEach(button => {
            button.setAttribute('data-bs-toggle', 'collapse');
        });

        loadEpisode(series);
    }
}

async function saveSeries(seriesId) {
    let series;
    if (typeof window.series !== "undefined") { series = window.series };
    if (typeof window.seriesList !== "undefined") { series = window.seriesList.find(s => s.id === seriesId) };
    if (series) {
        showSpinner();
        var newTitle = document.getElementById(`input-edit-series-title-${seriesId}`).value;
        var newCover = document.getElementById(`series-cover-${seriesId}`).src;

        var newTags = [];
        for (let tag of document.getElementById(`series-tags-${seriesId}`).children) {
            if (tag.tagName === 'SPAN') {
                newTags.push(tag.textContent.trim());
            }
        }

        var newEpisodes = [];
        var tbody = document.getElementById(`table-${seriesId}`).getElementsByTagName('tbody')[0];
        var countlines = 0;
        series.episodes.forEach(ep => { if (ep.id < 0) countlines--; });
        for (let tr of tbody.getElementsByTagName('tr')) {
            if (tr.hasAttribute('data-id')) {
                let id = Number.parseInt(tr.getAttribute('data-id'));
                let episode = series.episodes.find(ep => ep.id == id);
                newEpisodes.push(episode);
            } else {
                let episodeInput = tr.querySelector('input[type="url"]');
                if (episodeInput && episodeInput.hasAttribute('data-episode')) {
                    let json = JSON.parse(episodeInput.getAttribute('data-episode'));
                    newEpisodes.push({ id: json.id, title: json.title, datetime: new Date(json.datetime) });
                }

                let lineInput = tr.querySelector('input[type="text"]');
                if (lineInput) {
                    countlines--;
                    newEpisodes.push({ id: countlines, title: DOMPurify.sanitize(lineInput.value), datetime: new Date() });
                }
            }
        }

        var newFilteredEpisodes = newEpisodes.filter(ep => ep.id > 0);
        if (newFilteredEpisodes.length == 0) {
            alert("시리즈에 유효한 에피소드가 없습니다.");
            hideSpinner();
            return;
        }

        await firebaseDB.updateData(series.id, { title: DOMPurify.sanitize(newTitle), cover: newCover, tags: newTags, episodes: newEpisodes });
        hideSpinner();

        await init();
        let bsCollapse = bootstrap.Collapse.getInstance(`#flush-collapse-${seriesId}`);
        if (!bsCollapse) {
            bsCollapse = new bootstrap.Collapse(`#flush-collapse-${seriesId}`, {
                toggle: false
            });
        }
        bsCollapse.toggle();
    }
}


async function getTitle(input, seriesId = null) {
    const url = input.value;
    const match = url.match(/https:\/\/(gall\.dcinside\.com\/|m\.dcinside\.com\/)/);

    if (match) {
        var title = input.parentElement.parentElement.children[0];
        var spinner = input.parentElement.parentElement.children[1]

        title.firstChild.innerText = "불러오는 중...";
        spinner.classList.remove('visually-hidden');

        if (seriesId) {
            document.getElementById(`btn-save-series-${seriesId}`).disabled = true;
        } else {
            if (window.seriesId) {
                document.getElementById(`btn-save-series-${window.seriesId}`).disabled = true;
            }
            if (document.getElementById('save-new-series')) {
                document.getElementById('save-new-series').disabled = true;
            }
        }

        const episode = await getEpisodeFromURL(url);
        if (episode instanceof Object) {
            title.firstChild.innerText = episode.title;
            spinner.classList.add('visually-hidden');
            input.setAttribute('data-episode', JSON.stringify(episode));
        } else {
            title.firstChild.innerText = "제목을 불러오는 데 실패했습니다.";
            spinner.classList.add('visually-hidden');
        }

        if (seriesId) {
            document.getElementById(`btn-save-series-${seriesId}`).disabled = false;
        } else {
            if (window.seriesId) {
                document.getElementById(`btn-save-series-${window.seriesId}`).disabled = false;
            }
            if (document.getElementById('save-new-series')) {
                document.getElementById('save-new-series').disabled = false;
            }
        }
    }
}

async function deleteSeries(seriesId) {
    let series;
    if (typeof window.series !== "undefined") { series = window.series };
    if (typeof window.seriesList !== "undefined") { series = window.seriesList.find(s => s.id === seriesId) };
    if (confirm(`[${series.title}] 을(를) 정말로 삭제하시겠습니까?`) == true) {
        showSpinner();
        await firebaseDB.deleteData(seriesId);
        hideSpinner();
        if (location.pathname == "/read") {
            location.href = './';
        } else {
            await init();
        }
    }
}

function reloadSeries(type = 'list') {
    const view = localStorage.getItem('view') || 'list';
    document.getElementById('series-list').innerHTML = '';
    let tags = getTags();
    if (window.seriesList) {
        if (tags.length == 0) {
            for (const series of window.seriesList) {
                loadSeries(series);
            }
        } else {
            for (const series of window.seriesList) {
                let match = true;
                for (const tag of tags) {
                    if (!series.tags.includes(tag)) {
                        match = false;
                    }
                }
                if (match) {
                    loadSeries(series);
                }
            }
        }

    }
}

function sortSeries(sortBy, asc = true) {
    if (window.seriesList) {
        if (sortBy == 'datetime') {
            seriesList.sort((a, b) => {
                const dateA = new Date(a.episodes[a.episodes.length - 1].datetime);
                const dateB = new Date(b.episodes[b.episodes.length - 1].datetime);
                return asc ? dateA - dateB : dateB - dateA;
            });
        } else if (sortBy == 'abc') {
            seriesList.sort((a, b) => {
                return asc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            });
        }
        document.querySelectorAll(`button[data-sortby]`).forEach(btn => { btn.classList.remove('active') });
        document.querySelector(`button[data-sortby="${sortBy}-${asc ? 'asc' : 'desc'}"]`).classList.add('active');
        document.getElementById('current-sort').innerHTML = document.querySelector(`button[data-sortby="${sortBy}-${asc ? 'asc' : 'desc'}"]`).innerHTML;
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

async function newSeries(seriesId) {
    try {
        var url = prompt("시리즈 모음이 포함된 URL을 입력하세요:");
        if (url) {
            new URL(url);
            var match = url.match(/https:\/\/(gall\.dcinside\.com\/|m\.dcinside\.com\/)/);
            if (match) {

                const loading = `<div id="loading-series" class="text-center py-2 text-secondary">
                                    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span> 시리즈 불러오는 중...
                                </div>`;
                if (seriesId == 'new-series') {
                    var episodeList = document.getElementById('episode-list');
                    episodeList.innerHTML += loading;

                    if (window.seriesId) {
                        document.getElementById(`btn-save-series-${window.seriesId}`).disabled = true;
                    }
                    if (document.getElementById('save-new-series')) {
                        document.getElementById('save-new-series').disabled = true;
                    }
                } else {
                    var table = document.getElementById(`table-${seriesId}`);
                    table.querySelector('tbody').innerHTML += `<tr id="loading-series"><td colspan="4">${loading}</td></tr>`;

                    document.getElementById(`btn-save-series-${seriesId}`).disabled = true;
                }

                const id = extractIDFromURL(url);
                const episodes = await getEpisodesFromSeries(id);
                episodes.forEach(ep => {
                    newEpisode(seriesId, ep);
                })

                if (seriesId == 'new-series') {
                    if (window.seriesId) {
                        document.getElementById(`btn-save-series-${window.seriesId}`).disabled = false;
                    }
                    if (document.getElementById('save-new-series')) {
                        document.getElementById('save-new-series').disabled = false;
                    }
                } else {
                    document.getElementById(`btn-save-series-${seriesId}`).disabled = false;
                }

                document.getElementById('loading-series').remove();
            }
        }
    } catch (error) {
        console.error(error);
        alert("유효하지 않은 URL입니다.");
        return;
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
        var bookmark = document.getElementById(`bookmark-${seriesId}`);

        if (bookmark.getAttribute('data-bookmarked') == "true") {
            bookmark.classList.add('bi-star');
            bookmark.classList.remove('bi-star-fill');
            bookmark.classList.add('text-secondary');
            bookmark.classList.remove('text-warning');
            bookmark.setAttribute('data-bookmarked', 'false');
            await firebaseDB.removeBookmark(user.id, seriesId);

            if (location.pathname.includes('bookmark')) {
                location.reload();
            }

        } else {
            bookmark.classList.remove('bi-star');
            bookmark.classList.add('bi-star-fill');
            bookmark.classList.remove('text-secondary');
            bookmark.classList.add('text-warning');
            bookmark.setAttribute('data-bookmarked', 'true');
            await firebaseDB.addBookmark(user.id, seriesId);
        }
    }
}

async function loadDcCon(id, html) {
    const match = html.match(/data-original="([^"]+)"/);
    if (match) {
        const googleScript = new GoogleScript();
        const img = document.createElement('img');
        const base64 = await googleScript.fetchBase64Image(match[1]);
        img.src = base64;
        img.width = 100;
        img.height = 100;
        img.alt = '디시콘';
        document.getElementById(`comment-${id}`).appendChild(img);
    } else {
        document.getElementById(`comment-${id}`).innerHTML = html;
    }
}