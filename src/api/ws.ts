import WebSocket, {WebSocketServer} from 'ws';
import {assertValidAccessToken} from "../service/auth.js";

type SubscriptionMap = Map<string, Set<WebSocket>>;

class PubSubServer {
    private subscriptions: SubscriptionMap = new Map();

    constructor(private port: number) {
        this.startServer();
    }

    public publishUpdate(id: string, update: any): void {
        const subscribers = this.subscriptions.get(id);
        if (subscribers && subscribers.size) {
            const message = JSON.stringify(update);
            subscribers.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
            console.log(`Update published to ${id}`);
        }
    }

    private startServer(): void {
        const wss = new WebSocketServer({port: this.port});

        wss.on('connection', (ws: WebSocket) => {
            ws.on('message', (data: WebSocket.Data) => this.handleMessage(ws, data));
            ws.on('close', () => this.removeClient(ws));
            ws.on('error', () => this.removeClient(ws));
        });

        console.log(`WebSocket server started on port ${this.port}`);
    }

    private handleMessage(ws: WebSocket, data: WebSocket.Data): void {
        try {
            const message = JSON.parse(data.toString());
            const {action, id} = message;

            if (action === 'subscribe' && typeof id === 'string') {
                this.addSubscription(id, ws);
            } else if (action === 'unsubscribe' && typeof id === 'string') {
                this.removeSubscription(id, ws);
            }
        } catch (error) {
            console.error('Invalid message received:', data);
        }
    }

    private addSubscription(id: string, ws: WebSocket): void {
        if (!this.subscriptions.has(id)) {
            this.subscriptions.set(id, new Set<WebSocket>());
        }

        this.subscriptions.get(id)!.add(ws);
        console.log(`Client subscribed to ${id}`);
    }

    private removeSubscription(id: string, ws: WebSocket): void {
        const subscribers = this.subscriptions.get(id);
        if (subscribers) {
            subscribers.delete(ws);
            console.log(`Client unsubscribed from ${id}`);

            if (subscribers.size === 0) {
                this.subscriptions.delete(id);
            }
        }
    }

    private removeClient(ws: WebSocket): void {
        this.subscriptions.forEach((subscribers, id) => {
            if (subscribers.has(ws)) {
                subscribers.delete(ws);
                console.log(`Client removed from ${id}`);
                if (subscribers.size === 0) {
                    this.subscriptions.delete(id);
                }
            }
        });
    }
}

assertValidAccessToken()

// Example usage:
const server = new PubSubServer(8080);

// Simulate an update being published to all subscribers of a particular ID
setInterval(() => {
    server.publishUpdate('topic-1', {message: 'Hello, subscribers of topic-1!'});
}, 5000);
