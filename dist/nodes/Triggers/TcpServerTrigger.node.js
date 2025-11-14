"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServerTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const net_1 = require("net");
class TcpServerTrigger {
  constructor() {
    this.description = {
      displayName: "TCP Server Trigger",
      name: "tcpServerTrigger",
      icon: "fa:server",
      group: ["trigger"],
      version: 1,
      subtitle: '={{$parameter["port"]}}',
      description:
        "Start a TCP server and trigger workflow when data is received",
      defaults: {
        name: "TCP Server Trigger",
      },
      inputs: [],
      outputs: ["main"],
      properties: [
        {
          displayName: "Port",
          name: "port",
          type: "number",
          default: 8080,
          required: true,
          description: "Port to listen on",
          typeOptions: {
            minValue: 1,
            maxValue: 65535,
          },
        },
        {
          displayName: "Host",
          name: "host",
          type: "string",
          default: "127.0.0.1",
          required: true,
          description:
            "Host/IP address to bind to (127.0.0.1 for localhost, 0.0.0.0 for all interfaces)",
          placeholder: "127.0.0.1 or 0.0.0.0",
        },
        {
          displayName: "Options",
          name: "options",
          type: "collection",
          placeholder: "Add Option",
          default: {},
          options: [
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
              description: "Text encoding to use for received data",
            },
            {
              displayName: "Max Connections",
              name: "maxConnections",
              type: "number",
              default: 10,
              description: "Maximum number of simultaneous connections",
              typeOptions: {
                minValue: 1,
                maxValue: 1000,
              },
            },
            {
              displayName: "Keep Connection Open",
              name: "keepConnectionOpen",
              type: "boolean",
              default: false,
              description:
                "Whether to keep connections open after receiving data",
            },
            {
              displayName: "Send Response",
              name: "sendResponse",
              type: "boolean",
              default: false,
              description: "Whether to send a response back to the client",
            },
            {
              displayName: "Response Message",
              name: "responseMessage",
              type: "string",
              default: "",
              description:
                "Message to send back to client (if Send Response is enabled)",
              displayOptions: {
                show: {
                  sendResponse: [true],
                },
              },
            },
          ],
        },
      ],
    };
  }
  async trigger() {
    var _a;
    const port = this.getNodeParameter("port");
    const host = this.getNodeParameter("host");
    const options = this.getNodeParameter("options");
    const encoding = options.encoding || "utf8";
    const maxConnections = options.maxConnections || 10;
    const keepConnectionOpen = options.keepConnectionOpen;
    const sendResponse = options.sendResponse;
    const responseMessage = options.responseMessage || "";
    let server;
    const closeFunction = async () => {
      if (server) {
        server.close();
      }
    };
    const helperOverrides =
      (_a = this.helpers) === null || _a === void 0
        ? void 0
        : _a.tcpServerTrigger;
    const executeDependencies = {
      createServer: () => (0, net_1.createServer)(),
      ...helperOverrides,
    };
    try {
      server = executeDependencies.createServer();
      server.maxConnections = maxConnections;
      server.on("connection", (socket) => {
        const clientInfo = {
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          localAddress: socket.localAddress,
          localPort: socket.localPort,
        };
        socket.on("data", (data) => {
          const receivedData = data.toString(encoding);
          // Send response if configured
          if (sendResponse) {
            socket.write(responseMessage, encoding);
          }
          // Close connection if not keeping open
          if (!keepConnectionOpen) {
            socket.end();
          }
          // Trigger workflow
          this.emit([
            [
              {
                json: {
                  protocol: "tcp",
                  server: {
                    host,
                    port,
                  },
                  client: clientInfo,
                  data: receivedData,
                  encoding,
                  bytes: data.length,
                  timestamp: new Date().toISOString(),
                  keepConnectionOpen,
                  responseSent: sendResponse,
                },
                binary: {
                  data: {
                    data: data.toString("base64"),
                    mimeType: "application/octet-stream",
                  },
                },
              },
            ],
          ]);
        });
        socket.on("error", (error) => {
          console.error("TCP Socket error:", error);
        });
        socket.on("close", () => {
          console.log("TCP Client disconnected:", clientInfo);
        });
      });
      server.on("error", (error) => {
        if (error.message.includes("EADDRINUSE")) {
          throw new n8n_workflow_1.NodeOperationError(
            this.getNode(),
            `Port ${port} is already in use. Please choose a different port.`
          );
        }
        throw new n8n_workflow_1.NodeOperationError(
          this.getNode(),
          `TCP Server Error: ${error.message}`
        );
      });
      server.listen(port, host, () => {
        console.log(`TCP Server listening on ${host}:${port}`);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new n8n_workflow_1.NodeOperationError(this.getNode(), errorMessage);
    }
    return {
      closeFunction,
    };
  }
}
exports.TcpServerTrigger = TcpServerTrigger;
