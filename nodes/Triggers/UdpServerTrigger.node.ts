import {
  INodeType,
  INodeTypeDescription,
  IDataObject,
  ITriggerFunctions,
  ITriggerResponse,
  NodeOperationError,
} from "n8n-workflow";

import { createSocket as createDgramSocket, Socket as UDPSocket } from "dgram";

export interface UdpServerTriggerDependencies {
  createSocket: () => UDPSocket;
}

export class UdpServerTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: "UDP Server Trigger",
    name: "udpServerTrigger",
    icon: "fa:broadcast-tower",
    group: ["trigger"],
    version: 1,
    subtitle: '={{$parameter["port"]}}',
    description:
      "Start a UDP server and trigger workflow when data is received",
    defaults: {
      name: "UDP Server Trigger",
    },
    inputs: [],
    outputs: ["main"] as any,
    properties: [
      {
        displayName: "Port",
        name: "port",
        type: "number",
        default: 9090,
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
          {
            displayName: "Buffer Size",
            name: "bufferSize",
            type: "number",
            default: 1024,
            description: "Maximum buffer size for incoming messages (bytes)",
            typeOptions: {
              minValue: 64,
              maxValue: 65536,
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
    const sendResponse = options.sendResponse as boolean;
    const responseMessage = (options.responseMessage as string) || "";
    // const bufferSize = (options.bufferSize as number) || 1024;

    let server: UDPSocket;

    const closeFunction = async () => {
      if (server) {
        server.close();
      }
    };

    const helperOverrides = (
      this.helpers as unknown as
        | { udpServerTrigger?: Partial<UdpServerTriggerDependencies> }
        | undefined
    )?.udpServerTrigger;
    const executeDependencies = {
      createSocket: () => createDgramSocket("udp4"),
      ...helperOverrides,
    };

    try {
      server = executeDependencies.createSocket();

      server.on("message", (data: Buffer, rinfo) => {
        const receivedData = data.toString(encoding as BufferEncoding);

        // Send response if configured
        if (sendResponse) {
          const responseBuffer = Buffer.from(
            responseMessage,
            encoding as BufferEncoding
          );
          server.send(
            responseBuffer,
            0,
            responseBuffer.length,
            rinfo.port,
            rinfo.address,
            (error) => {
              if (error) {
                console.error("UDP Response error:", error);
              }
            }
          );
        }

        // Trigger workflow
        this.emit([
          [
            {
              json: {
                protocol: "udp",
                server: {
                  host,
                  port,
                },
                client: {
                  address: rinfo.address,
                  port: rinfo.port,
                  family: rinfo.family,
                  size: rinfo.size,
                },
                data: receivedData,
                encoding,
                bytes: data.length,
                timestamp: new Date().toISOString(),
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

      server.on("error", (error: Error) => {
        if (error.message.includes("EADDRINUSE")) {
          throw new NodeOperationError(
            this.getNode(),
            `Port ${port} is already in use. Please choose a different port.`
          );
        }
        throw new NodeOperationError(
          this.getNode(),
          `UDP Server Error: ${error.message}`
        );
      });

      server.on("listening", () => {
        const address = server.address();
        console.log(
          `UDP Server listening on ${address?.address}:${address?.port}`
        );
      });

      server.bind(port, host);
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
