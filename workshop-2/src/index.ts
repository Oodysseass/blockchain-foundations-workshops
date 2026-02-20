import { createServer } from 'net'
import { MessageSchema } from './types'

const PORT = 18018

const server = createServer(async (socket) => {
    const id = `${socket.remoteAddress}:${socket.remotePort}`
    console.log(`Client connected from ${id}`)

    socket.write(`Hello client!\n`)

    let buffer = ''
    socket.on('data', (data) => {
        buffer += data

        const messages = buffer.split('\n')
        while (messages.length > 1) {
            let msg = messages.shift()
            if (msg === undefined) {
                console.error(`Error defragmenting messages`)
                return
            }

            let message
            try {
                message = JSON.parse(msg)
            } catch (error) {
                console.error(`Error parsing message as JSON`, message)
                socket.write(`Received invalid message that could not parse as json` + msg)
                continue
            }

            try {
                message = MessageSchema.parse(message)
            } catch (_) {
                console.error(`Unknown protocol message`, message)
                socket.write(`Received invalid protocol message` + message)
                continue
            }

            console.log(`[${id}]: Received message`, message)
        }

        if (messages[0] === undefined) {
            console.error(`Error in parsing messages`)
            return
        }

        buffer = messages[0]
    })

    socket.on('error', (error) => {
        console.error(`[${id}]: Received error ${error}`)
    })

    socket.on('close', () => {
        console.log(`[${id}]: Client disconnected`)
    })
})

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
