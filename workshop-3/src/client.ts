import canonicalize from 'canonicalize'
import { blake2s } from '@noble/hashes/blake2'
import { bytesToHex } from '@noble/hashes/utils'
import { Socket } from 'net'
import type { NetworkObject } from './types'

const SERVER_PORT = 18018
const SERVER_HOST = '0.0.0.0'

function objectId(object: NetworkObject): string {
    return bytesToHex(blake2s(canonicalize(object)!))
}

function send(msg: object) {
    client.write(canonicalize(msg) + '\n')
}

// Local object store — the client keeps objects it knows about
const localObjects = new Map<string, NetworkObject>()

function storeLocal(object: NetworkObject) {
    const id = objectId(object)
    localObjects.set(id, object)
    return id
}

const client = new Socket()
client.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log('Connected to server')
})

// Hello handshake
send({ type: 'hello', agent: 'client-example' })

// ============================================================
// Test 1: Objects with no deps — no findObject needed
// The server just validates deps=[] and stores immediately.
// This works even with the simplest handleObject (no async resolution).
// ============================================================
const objA: NetworkObject = { name: 'alpha', deps: [] }
const idA = storeLocal(objA)
console.log(`\n--- Test 1: Objects with no deps ---`)
console.log(`Sending alpha (id: ${idA})`)
send({ type: 'object', object: objA })

const objB: NetworkObject = { name: 'bravo', deps: [] }
const idB = storeLocal(objB)
console.log(`Sending bravo (id: ${idB})`)
send({ type: 'object', object: objB })

// ============================================================
// Test 2: One dep — server uses findObject to request it from us
// We send the child BEFORE the server has the parent.
// Server will send us getobject, we respond, it resolves.
// ============================================================
const objParent: NetworkObject = { name: 'parent', deps: [] }
const idParent = storeLocal(objParent)
// Don't send parent yet! Only store locally so we can respond to getobject.

const objChild: NetworkObject = { name: 'child', deps: [idParent] }
const idChild = storeLocal(objChild)

setTimeout(() => {
    console.log(`\n--- Test 2: Single dep resolution ---`)
    console.log(`Sending child (id: ${idChild}), depends on parent (id: ${idParent})`)
    console.log(`Server doesn't have parent — should request it from us...`)
    send({ type: 'object', object: objChild })
}, 500)

// ============================================================
// Test 3: Multiple deps — server uses Promise.all to resolve concurrently
// We send an object that depends on two objects the server doesn't have.
// Server fires two getobject requests in parallel, we respond to both.
// ============================================================
const objDep1: NetworkObject = { name: 'dep-one', deps: [] }
const idDep1 = storeLocal(objDep1)

const objDep2: NetworkObject = { name: 'dep-two', deps: [] }
const idDep2 = storeLocal(objDep2)

const objMulti: NetworkObject = { name: 'multi-child', deps: [idDep1, idDep2] }
const idMulti = storeLocal(objMulti)

setTimeout(() => {
    console.log(`\n--- Test 3: Promise.all — multiple deps resolved concurrently ---`)
    console.log(`Sending multi-child (id: ${idMulti})`)
    console.log(`  depends on dep-one (id: ${idDep1})`)
    console.log(`  depends on dep-two (id: ${idDep2})`)
    console.log(`Server should send two getobject requests in parallel...`)
    send({ type: 'object', object: objMulti })
}, 1500)

// ============================================================
// Test 4: Timeout — unfulfillable dep, nobody has it
// ============================================================
const objGhost: NetworkObject = { name: 'ghost', deps: ['0000000000000000000000000000000000000000000000000000000000000000'] }

setTimeout(() => {
    console.log(`\n--- Test 4: Timeout case (unfulfillable dep) ---`)
    console.log(`Sending ghost object with unknown dep (should timeout after 5s)`)
    send({ type: 'object', object: objGhost })
}, 2500)

// ============================================================
// Message handler: respond to getobject requests from the server
// ============================================================
let buffer = ''
client.on('data', (data) => {
    buffer += data
    const messages = buffer.split('\n')
    while (messages.length > 1) {
        const raw = messages.shift()?.trim()
        if (!raw) continue

        console.log(`Received: ${raw}`)

        try {
            const msg = JSON.parse(raw)
            if (msg.type === 'getobject') {
                const object = localObjects.get(msg.objectid)
                if (object) {
                    console.log(`  -> Responding with object ${msg.objectid}`)
                    send({ type: 'object', object })
                } else {
                    console.log(`  -> Don't have object ${msg.objectid}`)
                }
            }
        } catch {
            // Not JSON or not a message we care about
        }
    }
    buffer = messages[0] ?? ''
})

client.on('error', (error) => {
    console.error(`Received error ${error}`)
})

client.on('close', () => {
    console.log(`Client disconnected`)
})
