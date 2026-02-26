import { atomWithStorage } from 'jotai/utils'

export type BusinessSession = {
  userId: string
  email: string
  displayName: string
  premiumExpiresAt?: string
}

export const businessSessionAtom = atomWithStorage<BusinessSession | null>('businessSession', null)
