import useKeySounds from '@/hooks/useKeySounds'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type TypingPracticePanelProps = {
  articleId: string
  paragraphs: string[]
  paragraphsZh?: string[]
}

function toPracticeSegments(paragraphs: string[]) {
  return paragraphs
    .map((segment) =>
      segment
        .replace(/[\p{P}\p{S}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

const comparableCharMap: Record<string, string> = {
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '—': '-',
  '–': '-',
  '‑': '-',
  ' ': ' ',
  '　': ' ',
}

function normalizeComparableChar(char: string) {
  return comparableCharMap[char] ?? char
}

function isSameIgnoreCase(left: string, right: string) {
  return normalizeComparableChar(left).toLocaleLowerCase() === normalizeComparableChar(right).toLocaleLowerCase()
}

function countCorrectChars(target: string, input: string) {
  const length = Math.min(target.length, input.length)
  let count = 0
  for (let index = 0; index < length; index += 1) {
    if (isSameIgnoreCase(target[index], input[index])) {
      count += 1
    }
  }
  return count
}

function isSegmentCompleted(target: string, input: string) {
  if (target.length !== input.length) {
    return false
  }
  for (let index = 0; index < target.length; index += 1) {
    if (!isSameIgnoreCase(target[index], input[index])) {
      return false
    }
  }
  return true
}

function isSegmentReached(target: string, input: string) {
  return input.length >= target.length
}

function applyAutoSpaces(target: string, input: string) {
  let next = ''
  for (const rawChar of input) {
    while (next.length < target.length && target[next.length] === ' ') {
      next += ' '
    }
    if (next.length >= target.length) {
      break
    }
    if (rawChar === ' ') {
      continue
    }
    next += rawChar
  }
  return next
}

export default function TypingPracticePanel({ articleId, paragraphs, paragraphsZh }: TypingPracticePanelProps) {
  const segments = useMemo(() => toPracticeSegments(paragraphs), [paragraphs])
  const [playKeySound, playWrongSound, playHintSound] = useKeySounds()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValues, setInputValues] = useState<string[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const activeInputRef = useRef<HTMLTextAreaElement | null>(null)
  const currentIndexRef = useRef(0)
  const caretPositionRef = useRef(0)

  const isFinished = currentIndex >= segments.length
  const typedChars = useMemo(() => inputValues.reduce((sum, value) => sum + value.length, 0), [inputValues])
  const correctChars = useMemo(
    () => segments.reduce((sum, segment, index) => sum + countCorrectChars(segment, inputValues[index] || ''), 0),
    [segments, inputValues],
  )
  const wrongCount = Math.max(0, typedChars - correctChars)
  const elapsedSeconds = startedAt ? Math.max(1, Math.round(((finishedAt ?? now) - startedAt) / 1000)) : 0
  const wpm = startedAt ? Math.max(1, Math.round((typedChars / 5 / elapsedSeconds) * 60)) : 0
  const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100
  const completedParagraphs = isFinished ? segments.length : currentIndex
  const progress = segments.length > 0 ? Math.min(100, Math.round((completedParagraphs / segments.length) * 100)) : 0
  const typingTextClassName =
    'font-mono whitespace-normal text-[26px] leading-[2.8rem] tracking-[0.12em] [font-variant-ligatures:none] [font-kerning:none] [overflow-wrap:normal] [word-break:normal]'
  const customCaretClassName =
    'pointer-events-none absolute left-[-1px] top-[0.08em] h-[1.05em] w-[2px] animate-[caret-blink_1s_steps(1,end)_infinite] rounded-sm bg-indigo-500'
  const renderCaret = () => (
    <span aria-hidden className="relative inline-block h-[1.05em] w-0 align-middle [letter-spacing:0]">
      <span className={customCaretClassName} />
    </span>
  )
  const focusActiveInput = useCallback(
    (position?: number) => {
      if (isFinished) {
        return
      }
      const input = activeInputRef.current
      if (!input) {
        return
      }
      const value = input.value || ''
      const fallbackPosition = value.length
      const requestedPosition = position ?? caretPositionRef.current ?? fallbackPosition
      const nextPosition = Math.max(0, Math.min(requestedPosition, value.length))
      input.focus()
      input.setSelectionRange(nextPosition, nextPosition)
      caretPositionRef.current = nextPosition
    },
    [isFinished],
  )

  useEffect(() => {
    if (!startedAt || finishedAt) {
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt, finishedAt])

  useEffect(() => {
    setCurrentIndex(0)
    currentIndexRef.current = 0
    caretPositionRef.current = 0
    setInputValues(segments.map(() => ''))
    setStartedAt(null)
    setFinishedAt(null)
    setNow(Date.now())
  }, [articleId, segments])

  useEffect(() => {
    if (isFinished || segments.length === 0) {
      return
    }
    focusActiveInput(caretPositionRef.current)
  }, [currentIndex, focusActiveInput, isFinished, segments.length])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    if (isFinished || segments.length === 0) {
      return
    }

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const input = activeInputRef.current
      if (!input) {
        return
      }
      const target = event.target as Node | null
      if (target && input.contains(target)) {
        return
      }
      window.requestAnimationFrame(() => {
        focusActiveInput(caretPositionRef.current)
      })
    }

    document.addEventListener('pointerdown', handleGlobalPointerDown, true)
    return () => document.removeEventListener('pointerdown', handleGlobalPointerDown, true)
  }, [currentIndex, focusActiveInput, isFinished, segments.length])

  useEffect(() => {
    if (isFinished || segments.length === 0) {
      return
    }
    const segment = segments[currentIndex]
    const value = inputValues[currentIndex] || ''
    if (!isSegmentReached(segment, value)) {
      return
    }

    const nextIndex = currentIndex + 1
    if (nextIndex >= segments.length) {
      setFinishedAt((prev) => prev ?? Date.now())
      currentIndexRef.current = segments.length
      setCurrentIndex(segments.length)
      return
    }

    currentIndexRef.current = nextIndex
    caretPositionRef.current = 0
    setCurrentIndex(nextIndex)
    window.requestAnimationFrame(() => {
      focusActiveInput(0)
    })
  }, [currentIndex, focusActiveInput, inputValues, isFinished, segments])

  const handleInputChange = (index: number, nextValue: string) => {
    if (index !== currentIndexRef.current || isFinished) {
      return
    }

    if (!startedAt) {
      setStartedAt(Date.now())
    }

    const normalizedValue = nextValue.replace(/\r?\n/g, '')
    const currentValue = inputValues[index] || ''
    const isDeleting = normalizedValue.length < currentValue.length
    const segment = segments[index]

    let nextNormalizedValue = normalizedValue
    if (!isDeleting) {
      nextNormalizedValue = applyAutoSpaces(segment, nextNormalizedValue)
    }

    const normalizedWithinSegment = nextNormalizedValue.slice(0, segment.length)
    const reachedCurrentSegment = isSegmentReached(segment, normalizedWithinSegment)
    const nextStoredValue = reachedCurrentSegment ? normalizedWithinSegment : nextNormalizedValue

    if (!isDeleting && nextStoredValue.length > currentValue.length) {
      let hasWrong = false
      let hasCorrect = false

      for (let cursor = currentValue.length; cursor < nextStoredValue.length; cursor += 1) {
        if (!segment[cursor]) {
          break
        }
        if (isSameIgnoreCase(segment[cursor], nextStoredValue[cursor])) {
          hasCorrect = true
        } else {
          hasWrong = true
        }
      }

      if (hasWrong) {
        playWrongSound()
      } else if (hasCorrect) {
        if (reachedCurrentSegment && isSegmentCompleted(segment, nextStoredValue)) {
          playHintSound()
        } else {
          playKeySound()
        }
      }
    }

    caretPositionRef.current = Math.min(normalizedWithinSegment.length, segment.length)

    setInputValues((prev) => {
      const next = [...prev]
      next[index] = nextStoredValue
      return next
    })

    if (!reachedCurrentSegment) {
      return
    }
  }

  const onReset = () => {
    currentIndexRef.current = 0
    caretPositionRef.current = 0
    setCurrentIndex(0)
    setInputValues(segments.map(() => ''))
    setStartedAt(null)
    setFinishedAt(null)
    setNow(Date.now())
    window.requestAnimationFrame(() => {
      focusActiveInput(0)
    })
  }

  return (
    <section className="mt-8 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">打字练习模式</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">每段一个输入框，完成当前段落后自动跳转到下一段。</p>
        </div>
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={onReset}
          type="button"
        >
          重新开始
        </button>
      </div>

      <div className="mb-4 grid gap-2 text-sm md:grid-cols-5">
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          进度: {Math.min(completedParagraphs + 1, segments.length)}/{segments.length}
        </div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">完成度: {progress}%</div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">WPM: {wpm}</div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">准确率: {accuracy}%</div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">错误数: {wrongCount}</div>
      </div>

      <div className="space-y-4">
        {segments.map((segment, index) => {
          const value = inputValues[index] || ''
          const isActive = index === currentIndex && !isFinished
          const isDone = isSegmentCompleted(segment, value)

          return (
            <div className="space-y-2" key={`${articleId}-practice-${index}`}>
              <div
                className={`relative rounded-xl border p-4 transition-all ${
                  isDone
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-sm shadow-emerald-100/60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:shadow-none'
                    : isActive
                    ? 'dark:bg-indigo-500/15 border-indigo-400 bg-indigo-50/70 shadow-md shadow-indigo-200/70 ring-2 ring-indigo-200/80 dark:border-indigo-400/70 dark:shadow-none dark:ring-indigo-500/40'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
                onClick={() => {
                  if (isActive) {
                    focusActiveInput(caretPositionRef.current)
                  }
                }}
              >
                {isActive && (
                  <span className="pointer-events-none absolute right-3 top-2 rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-indigo-400 dark:text-slate-900">
                    当前段落
                  </span>
                )}
                <div className="relative">
                  <p className={typingTextClassName}>
                    {(() => {
                      let cursor = 0
                      const tokens = segment.match(/\S+|\s+/g) ?? []
                      return tokens.map((token, tokenIndex) => {
                        const isSpaceToken = /^\s+$/.test(token)
                        const tokenStart = cursor
                        cursor += token.length

                        return (
                          <span className={isSpaceToken ? '' : 'inline-block whitespace-nowrap'} key={`${index}-token-${tokenIndex}`}>
                            {token.split('').map((char, offset) => {
                              const charIndex = tokenStart + offset
                              const shouldShowCaret = isActive && charIndex === value.length
                              if (charIndex >= value.length) {
                                return (
                                  <span className="relative" key={`${index}-char-${charIndex}`}>
                                    {shouldShowCaret && <span className={customCaretClassName} />}
                                    <span className="text-slate-400 dark:text-slate-500">{char}</span>
                                  </span>
                                )
                              }
                              const isCorrect = isSameIgnoreCase(char, value[charIndex])
                              return (
                                <span className="relative" key={`${index}-char-${charIndex}`}>
                                  {shouldShowCaret && <span className={customCaretClassName} />}
                                  <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}>
                                    {char}
                                  </span>
                                </span>
                              )
                            })}
                          </span>
                        )
                      })
                    })()}
                    {isActive && value.length >= segment.length && renderCaret()}
                  </p>

                  {isActive && (
                    <textarea
                      autoCapitalize="off"
                      autoComplete="off"
                      autoCorrect="off"
                      className={`absolute inset-0 h-full w-full resize-none appearance-none overflow-hidden border-none bg-transparent p-0 text-transparent caret-transparent shadow-none outline-none ring-0 [-webkit-appearance:none] [-webkit-tap-highlight-color:transparent] [box-shadow:none] focus:border-none focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${typingTextClassName}`}
                      onChange={(event) => handleInputChange(index, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                        }
                      }}
                      onSelect={(event) => {
                        const input = event.currentTarget
                        caretPositionRef.current = input.selectionStart ?? input.value.length
                      }}
                      ref={activeInputRef}
                      spellCheck={false}
                      value={value}
                      wrap="soft"
                    />
                  )}
                </div>
              </div>

              {paragraphsZh?.[index] && (
                <p className="px-1 text-base leading-8 text-slate-500 dark:text-slate-400">{paragraphsZh[index]}</p>
              )}
            </div>
          )
        })}
      </div>

      {isFinished && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          练习完成，耗时 {elapsedSeconds}s，WPM {wpm}，准确率 {accuracy}%。
        </div>
      )}
    </section>
  )
}
