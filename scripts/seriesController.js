class Series {
    /**
     * 시리즈를 나타내는 클래스입니다.
     * @param {String} id 
     * @param {String} title 
     * @param {String} cover 
     * @param {Array<Episode>} episodes 
     */
    constructor(id, title, cover, episodes = []) {
        this.id = id;
        this.title = title;
        this.cover = cover;
        this.episodes = episodes;
    }

    /**
     * 시리즈 객체를 생성합니다.
     * @param {Object} data 
     */
    static fromDict(data) {
        let episodes = [];
        for (const episodeData of data.episodes) {
            episodes.push(Episode.fromDict(episodeData));
        }

        return new Series(data.id, data.title, data.cover, episodes);
    }

    /**
     * 에피소드를 추가합니다.
     * @param {Episode} episode 
     */
    addBook(episode) {
        this.books.push(episode);
    }

    /**
     * 에피소드를 제거합니다.
     * @param {Number} id 
     */
    removeBook(id) {
        this.episodes = this.episodes.filter(episodes => episodes.id !== id);
    }

    /**
     * 특정 ID를 가진 에피소드를 반환합니다.
     * @param {Number} id 
     * @returns {Episode|null}
     */
    getEpisodeById(id) {
        return this.episodes.find(episode => episode.id === id);
    }

    toObject() {
        return {
            title: this.title,
            cover: this.cover,
            episodes: this.episodes.map(episode => episode.toObject())
        }
    }
}

class Episode {
    /**
     * 에피소드를 나타내는 클래스입니다.
     * @param {Number} id 
     * @param {String} title 
     * @param {Date} datetime 
     */
    constructor(id, title, datetime) {
        this.id = id;
        this.title = title;
        this.datetime = datetime;
    }

    /**
     * 에피소드 객체를 생성합니다.
     * @param {Object} data 
     * @returns {Episode}
     */
    static fromDict(data) {
        return new Episode(data.id, data.title, new Date(data.datetime));
    }

    /**
     * URL에서 에피소드 객체를 생성합니다.
     * @param {String} url 
     * @returns {Episode|Error}
     */
    static async fromURL(url) {
        try {
            const id = Episode.extractIDFromURL(url);
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
                    dateString = doc.querySelector('.ginfo2').querySelectorAll('li')[1].textContent.replaceAll(' ', 'T') += ':00';
                }

                const date = new Date(dateString);
                return new Episode(id, title, date);

            } else {
                throw new Error("Fetching URL has failed");
            }

        } catch (error) {
            console.error("Error fetching title from URL:", error);
            return error;
        }
    }

    /**
     * 에피소드의 내용을 가져옵니다.
     * @returns {String}
     */
    async getContent() {
        try {
            const response = await fetch(`https://corsproxy.io/?https://m.dcinside.com/board/lilyfever/${this.id}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = await response.text();

            if (html) {
                console.log(`https://m.dcinside.com/board/lilyfever/${this.id}`);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                let content = doc.querySelector('.write_div');
                if (!content) {
                    content = doc.querySelector('.thum-txtin');
                }
                content = Episode.cleanUpContent(content);

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

    /**
     * 에피소드의 내용을 정리합니다.
     * @param {Document} doc 
     * @returns {Document}
     */
    static cleanUpContent(doc) {
        // html.querySelectorAll('div').forEach(node => node.remove());

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

        return doc;
    }

    /**
     * 에피소드의 ID를 URL에서 추출합니다.
     * @param {String} url 
     * @returns {Number|null}
     */
    static extractIDFromURL(url) {
        if (url.startsWith('https://m.dcinside.com')) {
            const id = url.split('/').pop();
            return id ? parseInt(id) : null;
        } else {
            const match = url.match(/no=(\d+)/);
            return match ? parseInt(match[1]) : null;
        }
    }

    /**
     * 에피소드의 URL을 반환합니다.
     * @returns {String}
     */
    getURL() {
        return `https://gall.dcinside.com/mgallery/board/view/?id=lilyfever&no=${this.id}`;
    }

    /**
     * 에피소드의 정보를 객체 형태로 반환합니다.
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            title: this.title,
            datetime: this.datetime.toISOString()
        };
    }
}

window.Series = Series;
window.Episode = Episode;