/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, IDataObject } from "n8n-workflow";
import { Socket } from "net";
type TimeoutFn = (handler: (...args: any[]) => void, timeout: number, ...arguments_: any[]) => NodeJS.Timeout;
type ClearTimeoutFn = (timeout: NodeJS.Timeout) => void;
export interface TcpClientTransportDependencies {
    createSocket?: () => Socket;
    setTimeoutFn?: TimeoutFn;
    clearTimeoutFn?: ClearTimeoutFn;
}
export interface TcpClientExecutionDependencies {
    sendTcpData: typeof sendTcpData;
}
export declare function sendTcpData(host: string, port: number, message: string, waitForResponse: boolean, connectionTimeout: number, responseTimeout: number, encoding: BufferEncoding, keepConnectionOpen: boolean, dependencies?: TcpClientTransportDependencies): Promise<IDataObject>;
export declare class TcpClient implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
export {};
