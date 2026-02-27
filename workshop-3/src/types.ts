import z from 'zod'

export const NetworkObjectSchema = z.object({
    name: z.string(),
    deps: z.array(z.string())
})

export const HelloMessageSchema = z.object({
    type: z.literal('hello'),
    agent: z.string()
})

export const TextMessageSchema = z.object({
    type: z.literal('text'),
    text: z.string().max(20)
})

export const GetObjectMessageSchema = z.object({
    type: z.literal('getobject'),
    objectid: z.string()
})

export const ObjectMessageSchema = z.object({
    type: z.literal('object'),
    object: NetworkObjectSchema
})

export const MessageSchema = z.discriminatedUnion('type', [
    HelloMessageSchema, TextMessageSchema, GetObjectMessageSchema,
    ObjectMessageSchema
])

export type NetworkObject = z.infer<typeof NetworkObjectSchema>
export type Message = z.infer<typeof MessageSchema>
export type HelloMessage = z.infer<typeof HelloMessageSchema>
export type TextMessage = z.infer<typeof TextMessageSchema>
export type GetObjectMessage = z.infer<typeof GetObjectMessageSchema>
export type ObjectMessage = z.infer<typeof ObjectMessageSchema>
