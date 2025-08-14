// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbx-CuaEhQaqMbQ9CYIpX_K14UmkkjdLya0ik8JiX7LUYVRoizowaU6fq0JAlkBzxdE-/exec";
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA4ytSbKyzAfnTNNw3cKRN9VOCW6ORPPBY",
    authDomain: "dcreader-project.firebaseapp.com",
    projectId: "dcreader-project",
    storageBucket: "dcreader-project.firebasestorage.app",
    messagingSenderId: "612017471498",
    appId: "1:612017471498:web:b46b8b23074e0b1a065ff3",
    measurementId: "G-GP8PTD3TLS"
};

class Series {
    /**
     * 시리즈를 나타내는 클래스입니다.
     * @param {Number} id 
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
     * 에피소드를 추가합니다.
     * @param {Episode} episode 
     */
    addBook(episode) {
        this.books.push(episode);
    }

    /**
     * 에피소드를 제거합니다.
     * @param {Number} episodeId 
     */
    removeBook(id) {
        this.episodes = this.episodes.filter(episodes => episodes.id !== id);
    }

    /**
     * 특정 ID를 가진 에피소드를 반환합니다.
     * @param {Number} id 
     * @returns {Episode|null}
     */
    getBookById(id) {
        return this.episodes.find(book => book.id === id);
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

    static fromURL(url) {
        return new Episode(Episode.extractIDFromURL(url), Episode.getTitleFromURL(url), new Date());
    }

    getURL() {
        return `https://gall.dcinside.com/mgallery/board/view/?id=lilyfever&no=${this.id}`;
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
     * URL에서 에피소드 제목을 추출합니다.
     * @param {String} url 
     * @returns {String}
     */
    static async getTitleFromURL(url) {
        try {
            const response = await fetch(WEBAPP_URL, {
                redirect: "follow",
                method: "POST",
                body: JSON.stringify({ url: url }),
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
            });
            const data = await response.json();
            if (data) {
                console.log(data);
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.data.html, 'text/html');
                const title = doc.querySelector('title').textContent;

                return title;

            } else {
                throw new Error("Fetching URL has failed");
            }
        } catch (error) {
            console.error("Error fetching title from URL:", error);
            return null;
        }
    }
}

class FirebaseDB {

    constructor() {
        this.app = initializeApp(FIREBASE_CONFIG);
        this.db = getFirestore(app);
    }

    /** 
     *  
     * @param {String} query 
     * @returns {Promise<Object>}
     */
    static async readData(query = null) {
        const data = await getDocs(collection(this.db, "series"));
        return data;
    }


    /**
     * 
     * @param {*} doc 
     */
    static async writeData(doc) {
        try {
            const docRef = await addDoc(collection(this.db, "series"), doc);
            console.log("Document written with ID: ", docRef.id);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }

}