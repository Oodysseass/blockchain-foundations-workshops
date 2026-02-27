import { createServer } from 'net'
import Peer from './peer'

const PORT = 18018

const server = createServer((socket) => {
    new Peer(socket)
})

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
