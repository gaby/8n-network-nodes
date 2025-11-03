import {
  INodeType,
  INodeTypeDescription,
  IDataObject,
  ITriggerFunctions,
  ITriggerResponse,
  NodeOperationError,
} from "n8n-workflow";

import { createServer as createNetServer, Server, Socket } from "net";

export interface TcpServerTriggerDependencies {
  createServer: () => Server;
}

export class TcpServerTrigger implements INodeType {
  description: INodeTypeDescription = {
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
    outputs: ["main"] as any,
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

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const port = this.getNodeParameter("port") as number;
    const host = this.getNodeParameter("host") as string;
    const options = this.getNodeParameter("options") as IDataObject;
    const encoding = (options.encoding as string) || "utf8";
    const maxConnections = (options.maxConnections as number) || 10;
    const keepConnectionOpen = options.keepConnectionOpen as boolean;
    const sendResponse = options.sendResponse as boolean;
    const responseMessage = (options.responseMessage as string) || "";

    let server: Server;

    const closeFunction = async () => {
      if (server) {
        server.close();
      }
    };

    const helperOverrides = (
      this.helpers as unknown as
        | { tcpServerTrigger?: Partial<TcpServerTriggerDependencies> }
        | undefined
    )?.tcpServerTrigger;
    const executeDependencies = {
      createServer: () => createNetServer(),
      ...helperOverrides,
    };

    try {
      server = executeDependencies.createServer();

      server.maxConnections = maxConnections;

      server.on("connection", (socket: Socket) => {
        const clientInfo = {
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          localAddress: socket.localAddress,
          localPort: socket.localPort,
        };

        socket.on("data", (data: Buffer) => {
          const receivedData = data.toString(encoding as BufferEncoding);

          // Send response if configured
          if (sendResponse) {
            socket.write(responseMessage, encoding as BufferEncoding);
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

        socket.on("error", (error: Error) => {
          console.error("TCP Socket error:", error);
        });

        socket.on("close", () => {
          console.log("TCP Client disconnected:", clientInfo);
        });
      });

      server.on("error", (error: Error) => {
        if (error.message.includes("EADDRINUSE")) {
          throw new NodeOperationError(
            this.getNode(),
            `Port ${port} is already in use. Please choose a different port.`
          );
        }
        throw new NodeOperationError(
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
      throw new NodeOperationError(this.getNode(), errorMessage);
    }

    return {
      closeFunction,
    };
  }
}
