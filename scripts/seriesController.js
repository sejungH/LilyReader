const TAGS = ["만화", "소설", "웹툰", "연재중", "완결(完)", "모음집", "창작"];

function convertSeries(data) {
    let episodes = [];
    for (const episodeData of data.episodes) {
        episodes.push({ id: episodeData.id, title: episodeData.title, datetime: new Date(episodeData.datetime.seconds * 1000) });
    }
    return { id: data.id, title: data.title, cover: data.cover, tags: data.tags ? data.tags : [], episodes: episodes };
}

async function getEpisodeFromURL(url) {
    try {
        const id = extractIDFromURL(url);
        if (id) {
            const response = await fetch(`https://corsproxy.lilyd3v.workers.dev/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: `https://m.dcinside.com/board/lilyfever/${id}`
                })
            });
            const html = await response.text();

            if (html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const title = doc.querySelector('title').textContent.replaceAll('- 대세는 백합 마이너 갤러리', '').trim();
                let dateString;
                if (doc.querySelector('.gall_date')) {
                    dateString = doc.querySelector('.gall_date').getAttribute('title').replaceAll(' ', 'T');
                } else if (doc.querySelector('.ginfo2')) {
                    dateString = doc.querySelector('.ginfo2').querySelectorAll('li')[1].textContent.replaceAll(' ', 'T').replaceAll('.', '-') + ':00';
                }

                const date = new Date(dateString);
                return { id: id, title: title, datetime: date };

            } else {
                throw new Error("Fetching URL has failed");
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching episode from URL:", error);
        return error;
    }
}

async function getContent(id) {
    try {
        const response = await fetch(`https://corsproxy.lilyd3v.workers.dev/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: `https://m.dcinside.com/board/lilyfever/${id}`
            })
        });
        const html = await response.text();
        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let content;
            if (doc.querySelector('.write_div')) {
                content = doc.querySelector('.write_div');
            } else if (doc.querySelector('.thum-txtin')) {
                content = doc.querySelector('.thum-txtin');
            } else {
                throw new Error("No content found");
            }

            content = await cleanUpContent(content);

            let writer;
            if (doc.querySelector('.nickname')) {
                writer = doc.querySelector('.nickname').title;
            } else if (doc.querySelector('.ginfo2')) {
                writer = doc.querySelector('.ginfo2').querySelectorAll('li')[0].firstChild.textContent;
            }

            let comments = [];
            if (doc.querySelector('ul.all-comment-lst')) {
                let id = 0;
                let ul = doc.querySelector('ul.all-comment-lst');
                ul.querySelectorAll('li.comment, li.comment-add').forEach(li => {
                    let a = li.querySelector('a.nick');
                    if (a) {
                        let nick = a.textContent;
                        let comment = li.querySelector('p.txt');
                        let datetime = li.querySelector('span.date').textContent;

                        if (li.classList.contains('comment')) {
                            comments.push({ id: id++, type: 'original', nickname: nick, comment: comment.innerHTML, datetime: datetime });
                        } else if (li.classList.contains('comment-add')) {
                            comments.push({ id: id++, type: 'reply', nickname: nick, comment: comment.innerHTML, datetime: datetime });
                        }
                    }
                });
            }

            return { content: content.innerHTML, writer: writer, comments: comments };

        } else {
            throw new Error("Fetching URL has failed");
        }

    } catch (error) {
        console.error("Error fetching Content from URL:", error);
        return error;
    }
}

async function getEpisodesFromSeries(id) {
    try {
        const response = await fetch(`https://corsproxy.lilyd3v.workers.dev/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: `https://m.dcinside.com/board/lilyfever/${id}`
            })
        });
        const html = await response.text();
        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            let episodes = [];
            const dc_series = doc.querySelectorAll('.dc_series');
            if (dc_series) {
                const links = Array.from(dc_series).flatMap(series => Array.from(series.querySelectorAll('a')).filter(a => a.href.includes('lilyfever')));
                const episodePromises = links.map(async a => {
                    const episode = await getEpisodeFromURL(a.href);
                    return episode;
                });
                episodes = await Promise.all(episodePromises);
            }
            return episodes;

        } else {
            throw new Error("Fetching URL has failed");
        }
    } catch (error) {
        console.error("Error fetching episodes from URL:", error);
        return error;
    }
}

function extractIDFromURL(url) {
    const param = new URLSearchParams(url);
    var no = param.get('no');
    if (no) {
        return parseInt(no);
    } else {
        const match = url.match(/\/(\d+)(?:\?.*)?$/);
        if (match) {
            const id = parseInt(match[1]);
            return isNaN(id) ? null : id;
        } else {
            return null;
        }
    }
}

function cleanUpContent(doc) {
    if (doc.querySelector('.dc_series')) {
        doc.querySelector('.dc_series').remove();
    }

    const paragraphs = Array.from(doc.querySelectorAll('p, div'));

    while (paragraphs.length > 0 && (paragraphs[0].innerHTML == '<br>' || paragraphs[0].innerHTML == '')) {
        paragraphs[0].remove();
        paragraphs.shift();
    }

    while (paragraphs.length > 0 && (paragraphs[paragraphs.length - 1].innerHTML == '<br>' || paragraphs[paragraphs.length - 1].innerHTML == '')) {
        paragraphs[paragraphs.length - 1].remove();
        paragraphs.pop();
    }

    for (const p of paragraphs) {
        if (!p.querySelector('div') && !p.querySelector('a')) {
            if (p.querySelector('span') || p.querySelector('font')) {
                p.innerHTML = extractTextBrImg(p);
            }
        }
    }

    const images = doc.querySelectorAll('img');
    for (const img of images) {
        if (img.classList.contains('written_dccon')) {
            img.remove();
        } else {
            img.removeAttribute('style');
            img.removeAttribute('class');
            img.removeAttribute('data-*');
            img.removeAttribute('onclick');
            img.removeAttribute('onerror');
            img.removeAttribute('loading');

            if (img.hasAttribute('data-original')) {
                img.setAttribute('src', img.getAttribute('data-original'));
                img.setAttribute('loading', 'lazy');
                img.removeAttribute('data-original');
            }
        }
    }

    var html = doc.innerHTML;

    html = html.replaceAll('\n', '');
    doc.innerHTML = html;

    return doc;
}

function extractTextBrImg(node) {
    let result = '';
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            result += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === 'BR') {
                result += '<br>';
            } else if (child.tagName === 'IMG') {
                result += child.outerHTML;
            } else {
                // span, font 등 불필요한 태그는 내부만 재귀적으로 추출
                result += extractTextBrImg(child);
            }
        }
    });
    return result;
}

function getURL(id) {
    return `https://gall.dcinside.com/mgallery/board/view/?id=lilyfever&no=${id}`;
}
