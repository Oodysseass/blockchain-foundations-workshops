import canonicalize from 'canonicalize'
import { Socket } from 'net'

const SERVER_PORT = 18018
const SERVER_HOST = '0.0.0.0'

const client = new Socket()
client.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log('Connected to server')
})

const helloMessage = {
    type: 'hello',
    agent: 'client-example'
}
client.write(canonicalize(helloMessage) + '\n')

const textMessage = {
    type: 'text',
    text: 'This is short'
}
client.write(canonicalize(textMessage) + '\n')

const invalidMessage1 = {
    type: 'unknown type'
}
client.write(canonicalize(invalidMessage1) + '\n')

const invalidMessage2 = {
    type: 'text',
    text: 'This is a text message that is way too long and the server will not accept it'
}
client.write(canonicalize(invalidMessage2) + '\n')

let buffer = ''
client.on('data', (data) => {
    buffer += data
    const messages = buffer.split('\n')
    while (messages.length > 1) {
        let message = messages.shift()
        console.log(`Received message: ${message}`)
    }
    if (messages[0] === undefined) {
        console.error(`Error in parsing messages`)
        return
    }
    buffer = messages[0]
})

client.on('error', (error) => {
    console.error(`Received error ${error}`)
})

client.on('close', () => {
    console.log(`Client disconnected`)
})
