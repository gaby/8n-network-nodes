/// <reference types="node" />
import { INodeType, INodeTypeDescription, ITriggerFunctions, ITriggerResponse } from "n8n-workflow";
import { Server } from "net";
export interface TcpServerTriggerDependencies {
    createServer: () => Server;
}
export declare class TcpServerTrigger implements INodeType {
    description: INodeTypeDescription;
    trigger(this: ITriggerFunctions): Promise<ITriggerResponse>;
}
