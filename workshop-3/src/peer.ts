import type { Socket } from 'net'
import canonicalize from 'canonicalize'
import { MessageSchema } from './types'
import type { Message, HelloMessage, TextMessage } from './types'

export default class Peer {
    socket: Socket
    id: string = ''
    buffer: string = ''
    handlers: Record<Message['type'], (message: Message) => Promise<void>> = {
        hello: async (m) => await this.handleHello(m as HelloMessage),
        text: async (m) => await this.handleText(m as TextMessage),
    }

    constructor(socket: Socket) {
        this.socket = socket
        this.id = `${socket.remoteAddress}:${socket.remotePort}`
        console.log(`Client connected from ${this.id}`)
        this.initializeSocket()
        this.sendMessage({ type: 'hello', agent: 'workshop-3-server' })
    }

    initializeSocket() {
        this.socket.on('data', (data) => {
            this.handleStream(data.toString())
        })

        this.socket.on('error', (error) => {
            console.error(`[${this.id}]: Received error ${error}`)
        })

        this.socket.on('close', () => {
            console.log(`[${this.id}]: Client disconnected`)
        })
    }

    handleStream(data: string) {
        this.buffer += data

        const messages = this.buffer.split('\n')
        while (messages.length > 1) {
            const msg = messages.shift()?.trim() ?? ''
            if (!msg) continue

            this.handleMessage(msg)
        }

        this.buffer = messages[0] ?? ''
    }

    async handleMessage(msg: string) {
        let message: Message

        try {
            message = JSON.parse(msg) as Message
        } catch (_) {
            console.error(`[${this.id}]: Could not parse message`, msg)
            this.sendError(`Could not parse message as JSON`)
            return
        }

        try {
            message = MessageSchema.parse(message)
        } catch (_) {
            console.error(`[${this.id}]: Unknown protocol message`, msg)
            this.sendError(`Unknown protocol message`)
            return
        }

        console.log(`[${this.id}]: Received message`, message)

        await this.handlers[message.type](message)
    }

    sendMessage(msg: object) {
        const message = canonicalize(msg) + '\n'
        this.socket.write(message)
    }

    sendError(description: string) {
        this.sendMessage({ type: 'error', description })
    }

    async handleHello(message: HelloMessage) {
        console.log(`[${this.id}]: Hello from ${message.agent}`)
    }

    async handleText(message: TextMessage) {
        console.log(`[${this.id}]: Text: ${message.text}`)
    }
}
