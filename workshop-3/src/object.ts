import { Level } from 'level'
import canonicalize from 'canonicalize'
import { blake2s } from '@noble/hashes/blake2'
import { bytesToHex } from '@noble/hashes/utils'
import type { NetworkObject } from './types'

const FIND_TIMEOUT_MS = 5000

interface PendingWaiter {
    resolve: (object: NetworkObject) => void
    reject: (error: Error) => void
}

class ObjectManager {
    db = new Level('./db', { valueEncoding: 'json'})
    pendingFinds: Map<string, PendingWaiter[]> = new Map()

    id(object: NetworkObject): string {
        const canonicalized = canonicalize(object)
        if (canonicalized === undefined) {
            throw new Error('Failed to canonicalize object')
        }
        return bytesToHex(blake2s(canonicalized))
    }

    async exists(id: string): Promise<boolean> {
        return await this.db.has(id)
    }

    async get(id: string): Promise<NetworkObject> {
        const object = await this.db.get(id)
        if (object === undefined) {
            throw new Error(`Object ${id} not found`)
        }
        return object as unknown as NetworkObject
    }

    async put(object: NetworkObject): Promise<string> {
        const objectId = this.id(object)
        await this.db.put(objectId, object as any)

        const waiters = this.pendingFinds.get(objectId)
        if (waiters) {
            for (const waiter of waiters) {
                waiter.resolve(object)
            }
            this.pendingFinds.delete(objectId)
        }

        return objectId
    }

    async findObject(objectId: string, sendGetObject: (id : string) => void): Promise<NetworkObject> {
        try {
            return await this.get(objectId)
        } catch {}

        sendGetObject(objectId)

        const waitPromise = new Promise<NetworkObject>((resolve) => {
            const existing = this.pendingFinds.get(objectId)
            if (existing) {
                existing.push({ resolve, reject: () => {} })
            } else {
                this.pendingFinds.set(objectId, [{ resolve, reject: () => {} }])
            }
            
        })

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                this.pendingFinds.delete(objectId)
                reject(new Error(`Timeout waiting for object ${objectId}`))
            }, FIND_TIMEOUT_MS)
        })

        return Promise.race([waitPromise, timeoutPromise])
    }
}

export const objectManager = new ObjectManager()
