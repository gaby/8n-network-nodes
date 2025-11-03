"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpClient = exports.sendTcpData = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const net_1 = require("net");
async function sendTcpData(host, port, message, waitForResponse, connectionTimeout, responseTimeout, encoding, keepConnectionOpen, dependencies = {}) {
    const { createSocket = () => new net_1.Socket(), setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout, } = dependencies;
    return new Promise((resolve, reject) => {
        const socket = createSocket();
        let responseData = "";
        let connectionTimer;
        let responseTimer;
        // Connection timeout
        connectionTimer = setTimeoutFn(() => {
            socket.destroy();
            reject(new Error(`Connection timeout after ${connectionTimeout}ms`));
        }, connectionTimeout);
        socket.connect(port, host, () => {
            if (connectionTimer) {
                clearTimeoutFn(connectionTimer);
                connectionTimer = undefined;
            }
            // Send message
            socket.write(message, encoding, (error) => {
                if (error) {
                    socket.destroy();
                    reject(new Error(`Write error: ${error.message}`));
                    return;
                }
                // If not waiting for response, resolve immediately
                if (!waitForResponse) {
                    if (!keepConnectionOpen) {
                        socket.end();
                    }
                    resolve({
                        success: true,
                        protocol: "tcp",
                        host,
                        port,
                        message,
                        encoding,
                        status: "sent_no_wait",
                        bytes: Buffer.byteLength(message, encoding),
                        timestamp: new Date().toISOString(),
                        keepConnectionOpen,
                    });
                    return;
                }
                // Set response timeout
                responseTimer = setTimeoutFn(() => {
                    socket.destroy();
                    resolve({
                        success: true,
                        protocol: "tcp",
                        host,
                        port,
                        message,
                        encoding,
                        status: "no_response",
                        bytes: Buffer.byteLength(message, encoding),
                        timestamp: new Date().toISOString(),
                        keepConnectionOpen,
                    });
                }, responseTimeout);
            });
        });
        socket.on("data", (data) => {
            if (waitForResponse) {
                if (responseTimer) {
                    clearTimeoutFn(responseTimer);
                    responseTimer = undefined;
                }
                responseData += data.toString(encoding);
                if (!keepConnectionOpen) {
                    socket.end();
                }
                resolve({
                    success: true,
                    protocol: "tcp",
                    host,
                    port,
                    message,
                    encoding,
                    status: "response_received",
                    response: {
                        data: responseData,
                        bytes: data.length,
                    },
                    bytes: Buffer.byteLength(message, encoding),
                    timestamp: new Date().toISOString(),
                    keepConnectionOpen,
                });
            }
        });
        socket.on("close", () => {
            if (waitForResponse && responseData === "") {
                if (responseTimer) {
                    clearTimeoutFn(responseTimer);
                    responseTimer = undefined;
                }
                resolve({
                    success: true,
                    protocol: "tcp",
                    host,
                    port,
                    message,
                    encoding,
                    status: "connection_closed",
                    bytes: Buffer.byteLength(message, encoding),
                    timestamp: new Date().toISOString(),
                    keepConnectionOpen,
                });
            }
        });
        socket.on("error", (error) => {
            if (connectionTimer) {
                clearTimeoutFn(connectionTimer);
            }
            if (responseTimer) {
                clearTimeoutFn(responseTimer);
            }
            reject(new Error(`TCP Error: ${error.message}`));
        });
    });
}
exports.sendTcpData = sendTcpData;
class TcpClient {
    constructor() {
        this.description = {
            displayName: "TCP Client",
            name: "tcpClient",
            icon: "fa:paper-plane",
            group: ["output"],
            version: 1,
            subtitle: '={{$parameter["host"]}}:{{$parameter["port"]}}',
            description: "Send data via TCP protocol",
            defaults: {
                name: "TCP Client",
            },
            inputs: ["main"],
            outputs: ["main"],
            properties: [
                {
                    displayName: "Host",
                    name: "host",
                    type: "string",
                    default: "127.0.0.1",
                    required: true,
                    description: "Target host address",
                    placeholder: "127.0.0.1 or server.example.com",
                },
                {
                    displayName: "Port",
                    name: "port",
                    type: "number",
                    default: 8080,
                    required: true,
                    description: "Target port number",
                    typeOptions: {
                        minValue: 1,
                        maxValue: 65535,
                    },
                },
                {
                    displayName: "Message",
                    name: "message",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Message to send",
                    typeOptions: {
                        rows: 3,
                    },
                },
                {
                    displayName: "Options",
                    name: "options",
                    type: "collection",
                    placeholder: "Add Option",
                    default: {},
                    options: [
                        {
                            displayName: "Wait for Response",
                            name: "waitForResponse",
                            type: "boolean",
                            default: false,
                            description: "Whether to wait for a response from the server",
                        },
                        {
                            displayName: "Connection Timeout",
                            name: "connectionTimeout",
                            type: "number",
                            default: 5000,
                            description: "Connection timeout in milliseconds",
                            typeOptions: {
                                minValue: 100,
                                maxValue: 60000,
                            },
                        },
                        {
                            displayName: "Response Timeout",
                            name: "responseTimeout",
                            type: "number",
                            default: 3000,
                            description: "Response timeout in milliseconds",
                            displayOptions: {
                                show: {
                                    waitForResponse: [true],
                                },
                            },
                            typeOptions: {
                                minValue: 100,
                                maxValue: 30000,
                            },
                        },
                        {
                            displayName: "Encoding",
                            name: "encoding",
                            type: "options",
                            options: [
                                {
                                    name: "UTF-8",
                                    value: "utf8",
                                },
                                {
                                    name: "ASCII",
                                    value: "ascii",
                                },
                                {
                                    name: "Base64",
                                    value: "base64",
                                },
                                {
                                    name: "Hex",
                                    value: "hex",
                                },
                            ],
                            default: "utf8",
                            description: "Text encoding to use",
                        },
                        {
                            displayName: "Keep Connection Open",
                            name: "keepConnectionOpen",
                            type: "boolean",
                            default: false,
                            description: "Whether to keep the connection open after sending",
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        const helperOverrides = (_a = this.helpers) === null || _a === void 0 ? void 0 : _a.tcpClient;
        const executeDependencies = {
            sendTcpData,
            ...helperOverrides,
        };
        for (let i = 0; i < items.length; i++) {
            try {
                const host = this.getNodeParameter("host", i);
                const port = this.getNodeParameter("port", i);
                const message = this.getNodeParameter("message", i);
                const options = this.getNodeParameter("options", i);
                const waitForResponse = options.waitForResponse;
                const connectionTimeout = options.connectionTimeout || 5000;
                const responseTimeout = options.responseTimeout || 3000;
                const encoding = options.encoding || "utf8";
                const keepConnectionOpen = options.keepConnectionOpen;
                const result = await executeDependencies.sendTcpData(host, port, message, waitForResponse, connectionTimeout, responseTimeout, encoding, keepConnectionOpen);
                returnData.push({
                    json: result,
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), errorMessage, {
                    itemIndex: i,
                });
            }
        }
        return [returnData];
    }
}
exports.TcpClient = TcpClient;
