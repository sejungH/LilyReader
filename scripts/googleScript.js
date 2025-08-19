class GoogleScript {
    constructor() {
        this.scriptId = 'AKfycbyr6z69Ao4JTE1kNOnz2zGRp2r7LrZaBJ22P_Sc9KujZjzCbZn2Gyc4eAweMUs0EWyr';
        this.scriptUrl = `https://script.google.com/macros/s/${this.scriptId}/exec`;
    }

    async fetchURL(url) {
        try {
            const response = await fetch(this.scriptUrl + `?mode=page&url=${url}`);
            return await response.text();
        } catch (error) {
            console.error('Error fetching URL:', error);
            throw error;
        }
    }

    async fetchBase64Image(url) {
        try {
            const response = await fetch(this.scriptUrl + `?mode=image&url=${url}`);
            return await response.text();
        } catch (error) {
            console.error('Error fetching URL:', error);
            throw error;
        }
    }
}
