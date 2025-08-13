// dbController.js

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbx-CuaEhQaqMbQ9CYIpX_K14UmkkjdLya0ik8JiX7LUYVRoizowaU6fq0JAlkBzxdE-/exec";

class DBController {
    /**
     * 데이터 읽기
     * @param {String} func - Google Apps Script에서 수행할 함수 이름 (예: "readData")
     * @param {String|null} id - 선택적 매개변수, 특정 ID
     * @returns {Promise<Object[]>} - 헤더를 키로 하는 객체 배열
     * @description Google Apps Script에서 데이터를 읽어와서 객체 배열로 변환합니다.
     */
    async fetchData(func, id = null) {
        try {
            let newWebAppUrl = WEBAPP_URL + `?func=${func}` + (id ? `&id=${id}` : '');
            const res = await fetch(newWebAppUrl);
            const data = await res.json();
            console.log("읽기 성공:", data);

            if (func == 'googlesheet') {
                // 구글 시트 데이터는 2차원 배열로 오므로 변환 필요
                return this.convertData(data);
            } else {
                return data; // 일반 데이터는 그대로 반환
            }
        } catch (err) {
            console.error("읽기 실패:", err);
            throw err; // 에러도 다시 throw
        }
    }

    /**
     * 데이터 쓰기
     * @param {String[]} row 
     * @returns {Promise<void>}
     * @description row는 문자열 배열로, 각 요소는 시트의 열에 해당합니다.
     */
    async writeData(row) {
        return fetch(WEBAPP_URL, {
            redirect: "follow",
            method: "POST",
            body: JSON.stringify({ func: 'write', row: row }),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        })
            .then(res => res.text())
            .then(data => console.log("쓰기 성공:", data))
            .catch(err => console.error("쓰기 실패:", err));
    }

    async updateData(id, row) {
        return fetch(WEBAPP_URL, {
            redirect: "follow",
            method: "POST",
            body: JSON.stringify({ func: 'update', id: id, row: row }),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        })
            .then(res => res.text())
            .then(data => console.log("업데이트 성공:", data))
            .catch(err => console.error("업데이트 실패:", err));
    }

    async deleteData(id) {
        return fetch(WEBAPP_URL, {
            redirect: "follow",
            method: "POST",
            body: JSON.stringify({ func: 'delete', id: id }),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        })
            .then(res => res.text())
            .then(data => console.log("삭제 성공:", data))
            .catch(err => console.error("삭제 실패:", err));
    }


    async updateEpisodes(series, episodeItems) {
        series.episodes.forEach(ep => ep.found = false);

        // update 작업용 프로미스 모음
        const updatePromises = [];

        // 1) 업데이트 or 새로 쓰기 작업
        episodeItems.forEach((input, index) => {
            let id = dcController.extractIDFromURL(input.value);
            let found = series.episodes.find(ep => ep.id == id);

            if (found) {
                if (found.index != index) {
                    let row = [series.series, index.toString(), found.episode, id];
                    console.log("업데이트할 데이터:", row);
                    // 프로미스 배열에 추가
                    updatePromises.push(this.updateData(id, row));
                }
                found['found'] = true;
            } else {
                // 새로 쓰기 프로미스도 배열에 추가
                const p = this.fetchData('dcinside', id)
                    .then(data => {
                        let title = data.title.trim();
                        let row = [series.series, index.toString(), title, id];
                        console.log("새로 쓸 데이터:", row);
                        return this.writeData(row);
                    })
                    .catch(err => {
                        console.error("에피소드 제목 추출 실패:", err);
                    });
                updatePromises.push(p);
            }
        });

        // 2) 삭제 작업용 프로미스 모음
        const deletePromises = [];
        series.episodes.forEach(ep => {
            if (!ep.found) {
                console.log("삭제할 데이터:", ep.id);
                deletePromises.push(this.deleteData(ep.id));
            }
        });

        // 모든 작업이 끝날 때까지 기다림
        await Promise.all([...updatePromises, ...deletePromises]);
    }


    /**
     * 데이터를 객체 배열로 변환
     * @param {Array} data - 2차원 배열 형태의 데이터
     * @returns {Object[]} - 헤더를 키로 하는 객체 배열
     * @description 첫 번째 행을 헤더로 사용하여 나머지 행을 객체
     * 형태로 변환합니다.
     */
    convertData(data) {
        if (!Array.isArray(data) || data.length < 2) return [];
        const headers = data[0];
        return data.slice(1).map(row =>
            headers.reduce((obj, header, idx) => {
                obj[header] = row[idx];
                return obj;
            }, {})
        );
    }
}
