/**
 * Stub — WhatsApp/Evolution no ambiental-system passa pelo módulo omnichannel
 * (`/organizations/:slug/omnichannel/canais`), não pelo endpoint legado /whatsapp do iNexaHub.
 */

export type WhatsappInstance = {
  id: string
  name: string
  status: string
  phone?: string | null
  description?: string | null
  is_main?: boolean
  is_notification?: boolean
}

export const whatsappApi = {
  listInstances: async (): Promise<WhatsappInstance[]> => [],
}
