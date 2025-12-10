import { io } from 'socket.io-client';

export class APIClient {
    private socket = io('http://localhost:8080');

    async sendText(to: string, content: string) {
        return new Promise((resolve, reject) => {
            this.socket.emit('sendText', { to, content }, (response: any) => {
                if (response.success) resolve(response.data);
                else reject(new Error(response.error));
            });
        });
    }

    async getAllChats() {
        return new Promise((resolve, reject) => {
            this.socket.emit('getAllChats', {}, (response: any) => {
                if (response.success) resolve(response.data);
                else reject(new Error(response.error));
            });
        });
    }

    onMessage(callback: (msg: any) => void) {
        this.socket.on('message', callback);
    }

    onAny(callback: (event: string, ...args: any[]) => void) {
        this.socket.onAny(callback);
    }
}

export const apiClient = new APIClient();
