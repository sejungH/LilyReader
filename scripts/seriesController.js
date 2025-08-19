async function getEpisodeFromURL(url) {
    try {
        const id = extractIDFromURL(url);
        if (id) {
            const response = await fetch(`https://corsproxy.io/?https://m.dcinside.com/board/lilyfever/${id}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = await response.text();

            if (html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const title = doc.querySelector('title').textContent.replaceAll('- 대세는 백합 마이너 갤러리', '').trim();
                let dateString;
                if (doc.querySelector('.gall_date')) {
                    dateString = doc.querySelector('.gall_date').getAttribute('title').replaceAll(' ', 'T');
                } else {
                    dateString = doc.querySelector('.ginfo2').querySelectorAll('li')[1].textContent.replaceAll(' ', 'T') + ':00';
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
        const response = await fetch(`https://corsproxy.io/?${getURL(id)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();

        if (html) {
            console.log(html);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let content = doc.querySelector('.write_div');
            if (!content) {
                content = doc.querySelector('.thum-txtin');
            }
            content = cleanUpContent(content);

            let writer;
            if (doc.querySelector('.nickname')) {
                writer = doc.querySelector('.nickname').title;
            } else {
                writer = doc.querySelector('.ginfo2').querySelectorAll('li')[0].firstChild.textContent;
            }

            return { content: content.innerHTML, writer: writer };

        } else {
            throw new Error("Fetching URL has failed");
        }

    } catch (error) {
        console.error("Error fetching Content from URL:", error);
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
    console.log(doc);
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
        p.querySelectorAll('span[style]').forEach(span => {
            span.removeAttribute('style');
        });
    }

    const images = doc.querySelectorAll('img');
    for (const img of images) {
        img.removeAttribute('style');
        img.removeAttribute('class');
        img.removeAttribute('data-*');
        img.removeAttribute('onclick');
        img.removeAttribute('onerror');
        img.removeAttribute('loading');

        if (img.hasAttribute('data-original')) {
            img.setAttribute('src', img.getAttribute('data-original'));
            img.removeAttribute('data-original');
        }
    }

    var html = doc.innerHTML;

    html = html.replaceAll('\n', '');
    html = html.replace(/(<p( style="[0-9a-zA-Z\-\:\;]+")*>(<br>)?<\/p>){2,}/g, '<p><br></p>');
    doc.innerHTML = html;

    return doc;
}

function getURL(id) {
    return `https://gall.dcinside.com/mgallery/board/view/?id=lilyfever&no=${id}`;
}
