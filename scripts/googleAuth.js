

function initGoogleAuth() {
    var googleUser = window.sessionStorage.getItem('googleUser');

    const login_container = document.getElementById('login_container');
    if (!googleUser) {
        login_container.innerHTML = `
        <div id="g_id_onload" class="g_id_onload"
            data-client_id="612017471498-k523pec9qoqkb2pb6195j54knipkkmnj.apps.googleusercontent.com"
            data-context="signin" data-ux_mode="popup" data-callback="handleCredentialResponse"
            data-auto_prompt="false">
        </div>
        <div class="g_id_signin" data-type="standard" data-shape="circle" data-theme="outline"
            data-text="signin" data-size="large" data-logo_alignment="center">
        </div>`;

    } else {
        var userInfo = JSON.parse(googleUser);
        login_container.classList.add('position-relative');
        login_container.innerHTML = `
        <button class="btn btn-outline-light rounded-pill d-flex align-items-center justify-content-center gap-1 w-100 w-md-auto px-2"
            type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="${userInfo.picture}" alt="Profile Picture" class="rounded-circle"  style="height:1.6rem; width:1.6rem; object-fit:cover;"/>
            <span class="text-uppercase"><small>${userInfo.given_name}</small></span>
        </button>
        <ul class="dropdown-menu dropdown-menu-md-end w-100 w-md-auto">
            <li><a class="dropdown-item text-center" href="bookmark"><small><i class="bi bi-star-fill text-warning"></i> 북마크 관리</small></a></li>
            <li><a class="dropdown-item text-center" href="javascript:logout()"><small><i class="bi bi-box-arrow-right"></i> 로그아웃</small></a></li>
        </ul>`;
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

async function initUser() {
    const firebaseDB = new FirebaseDB();
    if (window.sessionStorage.getItem('googleUser')) {
        var userInfo = JSON.parse(window.sessionStorage.getItem('googleUser'));
        var user = await firebaseDB.getUser(userInfo.email);
        return user;
    } else {
        return null;
    }
}

function logout() {
    window.sessionStorage.removeItem('googleUser');
    location.reload();
}