import z from 'zod'

export const HelloMessageSchema = z.object({
    type: z.literal('hello'),
    agent: z.string()
})

export const TextMessageSchema = z.object({
    type: z.literal('text'),
    text: z.string().max(20)
})

export const MessageSchema = z.discriminatedUnion('type', [
    HelloMessageSchema, TextMessageSchema
])

export type Message = z.infer<typeof MessageSchema>
export type HelloMessage = z.infer<typeof HelloMessageSchema>
export type TextMessage = z.infer<typeof TextMessageSchema>
