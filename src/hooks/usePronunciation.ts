import { pronunciationConfigAtom } from '@/store'
import type { PronunciationType } from '@/typings'
import { addHowlListener } from '@/utils'
import { romajiToHiragana } from '@/utils/kana'
import noop from '@/utils/noop'
import type { Howl } from 'howler'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import useSound from 'use-sound'
import type { HookOptions } from 'use-sound/dist/types'

const pronunciationApi = import.meta.env.DEV ? '/api/youdao-dictvoice?audio=' : 'https://dict.youdao.com/dictvoice?audio='

function encodeAudioWord(word: string) {
  return encodeURIComponent(word)
}

export function generateWordSoundSrc(word: string, pronunciation: Exclude<PronunciationType, false>): string {
  switch (pronunciation) {
    case 'uk':
      return `${pronunciationApi}${encodeAudioWord(word)}&type=1`
    case 'us':
      return `${pronunciationApi}${encodeAudioWord(word)}&type=2`
    case 'romaji':
      return `${pronunciationApi}${encodeAudioWord(romajiToHiragana(word))}&le=jap`
    case 'zh':
      return `${pronunciationApi}${encodeAudioWord(word)}&le=zh`
    case 'ja':
      return `${pronunciationApi}${encodeAudioWord(word)}&le=jap`
    case 'de':
      return `${pronunciationApi}${encodeAudioWord(word)}&le=de`
    case 'hapin':
    case 'kk':
      return `${pronunciationApi}${encodeAudioWord(word)}&le=ru` // 有道不支持哈萨克语, 暂时用俄语发音兜底
    case 'id':
      return `${pronunciationApi}${encodeAudioWord(word)}&le=id`
    default:
      return ''
  }
}

export default function usePronunciationSound(word: string, isLoop?: boolean) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)
  const loop = useMemo(() => (typeof isLoop === 'boolean' ? isLoop : pronunciationConfig.isLoop), [isLoop, pronunciationConfig.isLoop])
  const [isPlaying, setIsPlaying] = useState(false)

  const [play, { stop, sound }] = useSound(generateWordSoundSrc(word, pronunciationConfig.type), {
    html5: true,
    format: ['mp3'],
    loop,
    volume: pronunciationConfig.volume,
    rate: pronunciationConfig.rate,
  } as HookOptions)

  useEffect(() => {
    if (!sound) return
    sound.loop(loop)
    return noop
  }, [loop, sound])

  useEffect(() => {
    if (!sound) return
    const unListens: Array<() => void> = []

    unListens.push(addHowlListener(sound, 'play', () => setIsPlaying(true)))
    unListens.push(addHowlListener(sound, 'end', () => setIsPlaying(false)))
    unListens.push(addHowlListener(sound, 'pause', () => setIsPlaying(false)))
    unListens.push(addHowlListener(sound, 'playerror', () => setIsPlaying(false)))

    return () => {
      setIsPlaying(false)
      unListens.forEach((unListen) => unListen())
      ;(sound as Howl).unload()
    }
  }, [sound])

  return { play, stop, isPlaying }
}

export function usePrefetchPronunciationSound(word: string | undefined) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)

  useEffect(() => {
    if (!word) return

    const soundUrl = generateWordSoundSrc(word, pronunciationConfig.type)
    if (soundUrl === '') return

    const head = document.head
    const isPrefetch = (Array.from(head.querySelectorAll('link[href]')) as HTMLLinkElement[]).some((el) => el.href === soundUrl)

    if (!isPrefetch) {
      const audio = new Audio()
      audio.src = soundUrl
      audio.preload = 'auto'

      audio.style.display = 'none'

      head.appendChild(audio)

      return () => {
        head.removeChild(audio)
      }
    }
  }, [pronunciationConfig.type, word])
}
