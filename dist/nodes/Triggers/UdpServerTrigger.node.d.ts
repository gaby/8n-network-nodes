/// <reference types="node" />
import {
  INodeType,
  INodeTypeDescription,
  ITriggerFunctions,
  ITriggerResponse,
} from "n8n-workflow";
import { Socket as UDPSocket } from "dgram";
export interface UdpServerTriggerDependencies {
  createSocket: () => UDPSocket;
}
export declare class UdpServerTrigger implements INodeType {
  description: INodeTypeDescription;
  trigger(this: ITriggerFunctions): Promise<ITriggerResponse>;
}
