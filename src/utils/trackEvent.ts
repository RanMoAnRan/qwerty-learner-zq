type EventProperties = Record<string, string>
type VercelTrack = (name: string, properties?: EventProperties) => void

let vercelTrack: VercelTrack | null | undefined
let vercelTrackLoader: Promise<VercelTrack | null> | null = null

const shouldLoadVercelAnalytics = import.meta.env.PROD && import.meta.env.VITE_ENABLE_VERCEL_ANALYTICS !== 'false'

async function getVercelTrack() {
  if (!shouldLoadVercelAnalytics) {
    return null
  }
  if (vercelTrack !== undefined) {
    return vercelTrack
  }
  if (!vercelTrackLoader) {
    vercelTrackLoader = import('@vercel/analytics')
      .then((mod) => {
        vercelTrack = mod.track as VercelTrack
        return vercelTrack
      })
      .catch(() => {
        vercelTrack = null
        return null
      })
  }
  return vercelTrackLoader
}

export const trackPromotionEvent = (event: string, properties: EventProperties) => {
  void getVercelTrack().then((track) => {
    if (track) {
      track(event, properties)
    }
  })

  // @ts-expect-error gtag is not defined in the window object
  if (typeof window !== 'undefined' && window?.gtag) {
    try {
      window.gtag('event', event, { ...properties })
      if (properties.action_detail) {
        window.gtag('event', properties.action_detail)
      }
    } catch (error) {
      console.error(error)
    }
  }
}
