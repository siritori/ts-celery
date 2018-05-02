export interface CeleryResponse<T> {
    task_id: string;
    status: 'STARTED' | 'SUCCESS' | 'FAILURE' | 'PROGRESS';
    result: T;
    children: any[];
    traceback: string | null;
}
export declare class Session {
    private url;
    private routingKey;
    private connection;
    constructor(url: string, routingKey?: string);
    connect(): Promise<void>;
    destroy(): void;
    private createResultQueue<T>(taskID, handleMessage);
    private generateProps(command, taskID, replyTo?);
    private generatePayload(args, kwargs);
    execute(command: string, args?: Object[], kwargs?: {
        [key: string]: any;
    }): void;
    call<T>(command: string, args?: Object[], kwargs?: {
        [key: string]: any;
    }, handleOther?: (msg: CeleryResponse<T>) => void): Promise<T>;
}
