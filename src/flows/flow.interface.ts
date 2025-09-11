export interface FlowHandler {
  canHandle(flow: string): boolean;
  handle(from: string, text: string, state: any): Promise<string | void>;
}
