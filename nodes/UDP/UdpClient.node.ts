import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IDataObject,
} from "n8n-workflow";

import { createSocket as createDgramSocket, Socket as UdpSocket } from "dgram";

type TimeoutFn = (
  handler: (...args: any[]) => void,
  timeout: number,
  ...arguments_: any[]
) => NodeJS.Timeout;

type ClearTimeoutFn = (timeout: NodeJS.Timeout) => void;

export interface UdpClientTransportDependencies {
  createSocket?: () => UdpSocket;
  setTimeoutFn?: TimeoutFn;
  clearTimeoutFn?: ClearTimeoutFn;
}

export interface UdpClientExecutionDependencies {
  sendUdpData: typeof sendUdpData;
}

export async function sendUdpData(
  host: string,
  port: number,
  message: string,
  waitForResponse: boolean,
  responseTimeout: number,
  encoding: BufferEncoding,
  dependencies: UdpClientTransportDependencies = {}
): Promise<IDataObject> {
  const {
    createSocket = () => createDgramSocket("udp4"),
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  } = dependencies;

  return new Promise((resolve, reject) => {
    const socket = createSocket();
    let responseData = "";
    let responseTimer: NodeJS.Timeout | undefined;

    const messageBuffer = Buffer.from(message, encoding);

    socket.send(messageBuffer, 0, messageBuffer.length, port, host, (error) => {
      if (error) {
        socket.close();
        reject(new Error(`UDP Send Error: ${error.message}`));
        return;
      }

      // If not waiting for response, resolve immediately
      if (!waitForResponse) {
        socket.close();
        resolve({
          success: true,
          protocol: "udp",
          host,
          port,
          message,
          encoding,
          status: "sent_no_wait",
          bytes: messageBuffer.length,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Set response timeout
      responseTimer = setTimeoutFn(() => {
        socket.close();
        resolve({
          success: true,
          protocol: "udp",
          host,
          port,
          message,
          encoding,
          status: "no_response",
          bytes: messageBuffer.length,
          timestamp: new Date().toISOString(),
        });
      }, responseTimeout);
    });

    if (waitForResponse) {
      socket.on("message", (data: Buffer, rinfo) => {
        if (responseTimer) {
          clearTimeoutFn(responseTimer);
          responseTimer = undefined;
        }
        responseData = data.toString(encoding);
        socket.close();

        resolve({
          success: true,
          protocol: "udp",
          host,
          port,
          message,
          encoding,
          status: "response_received",
          response: {
            data: responseData,
            bytes: data.length,
            from: {
              address: rinfo.address,
              port: rinfo.port,
            },
          },
          bytes: messageBuffer.length,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on("error", (error: Error) => {
        if (responseTimer) {
          clearTimeoutFn(responseTimer);
        }
        socket.close();
        reject(new Error(`UDP Error: ${error.message}`));
      });
    }
  });
}

export class UdpClient implements INodeType {
  description: INodeTypeDescription = {
    displayName: "UDP Client",
    name: "udpClient",
    icon: "fa:broadcast-tower",
    group: ["output"],
    version: 1,
    subtitle: '={{$parameter["host"]}}:{{$parameter["port"]}}',
    description: "Send data via UDP protocol",
    defaults: {
      name: "UDP Client",
    },
    inputs: ["main"] as any,
    outputs: ["main"] as any,
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
        default: 9090,
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
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const helperOverrides = (
      this.helpers as unknown as
        | { udpClient?: Partial<UdpClientExecutionDependencies> }
        | undefined
    )?.udpClient;
    const executeDependencies = {
      sendUdpData,
      ...helperOverrides,
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const host = this.getNodeParameter("host", i) as string;
        const port = this.getNodeParameter("port", i) as number;
        const message = this.getNodeParameter("message", i) as string;
        const options = this.getNodeParameter("options", i) as IDataObject;

        const waitForResponse = options.waitForResponse as boolean;
        const responseTimeout = (options.responseTimeout as number) || 3000;
        const encoding = (options.encoding as string) || "utf8";

        const result = await executeDependencies.sendUdpData(
          host,
          port,
          message,
          waitForResponse,
          responseTimeout,
          encoding as BufferEncoding
        );

        returnData.push({
          json: result,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new NodeOperationError(this.getNode(), errorMessage, {
          itemIndex: i,
        });
      }
    }

    return [returnData];
  }
}
