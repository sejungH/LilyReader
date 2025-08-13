class DCController {

    trimHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        Array.from(tempDiv.children).forEach(child => {
            if (child.tagName === 'DIV') {
                child.remove();
            }
        });

        html = tempDiv.innerHTML;

        // 앞뒤 공백 제거
        html = html.replace(/^(?:\s*<p>(<br>)*<\/p>\s*)+/i, '');
        html = html.replace(/(?:\s*<p>(<br>)*<\/p>\s*)+$/i, '');

        return html;
    }

    generateURL(id) {
        if (id) {
            return `https://gall.dcinside.com/mgallery/board/view/?id=lilyfever&no=${id}`;
        } else {
            return '';
        }
    }

    extractIDFromURL(url) {
        const match = url.match(/no=(\d+)/);
        return match ? match[1] : null;
    }

}