/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from "n8n-workflow";
import { Socket as UdpSocket } from "dgram";
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
export declare function sendUdpData(
  host: string,
  port: number,
  message: string,
  waitForResponse: boolean,
  responseTimeout: number,
  encoding: BufferEncoding,
  dependencies?: UdpClientTransportDependencies
): Promise<IDataObject>;
export declare class UdpClient implements INodeType {
  description: INodeTypeDescription;
  execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
export {};
