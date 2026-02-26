import { useEffect, useMemo, useRef, useState } from 'react'

type TypingPracticePanelProps = {
  articleId: string
  paragraphs: string[]
}

function toPracticeSegments(paragraphs: string[]) {
  return paragraphs.map((segment) => segment.trim()).filter(Boolean)
}

function isSameIgnoreCase(left: string, right: string) {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase()
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

export default function TypingPracticePanel({ articleId, paragraphs }: TypingPracticePanelProps) {
  const segments = useMemo(() => toPracticeSegments(paragraphs), [paragraphs])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const isFinished = currentIndex >= segments.length
  const targetText = isFinished ? '' : segments[currentIndex]
  const completedChars = useMemo(() => segments.slice(0, currentIndex).reduce((sum, segment) => sum + segment.length, 0), [segments, currentIndex])
  const typedChars = completedChars + inputValue.length
  const currentCorrectChars = countCorrectChars(targetText, inputValue)
  const correctChars = completedChars + currentCorrectChars
  const wrongCount = Math.max(0, typedChars - correctChars)
  const elapsedSeconds = startedAt ? Math.max(1, Math.round(((finishedAt ?? now) - startedAt) / 1000)) : 0
  const wpm = startedAt ? Math.max(1, Math.round((typedChars / 5 / elapsedSeconds) * 60)) : 0
  const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100
  const progress = segments.length > 0 ? Math.min(100, Math.round((currentIndex / segments.length) * 100)) : 0

  useEffect(() => {
    if (!startedAt || finishedAt) {
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt, finishedAt])

  useEffect(() => {
    setCurrentIndex(0)
    setInputValue('')
    setStartedAt(null)
    setFinishedAt(null)
    setNow(Date.now())
  }, [articleId])

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex, articleId])

  const goNext = () => {
    setInputValue('')
    setCurrentIndex((prev) => {
      const next = prev + 1
      if (next >= segments.length) {
        setFinishedAt(Date.now())
      }
      return next
    })
  }

  const handleInputChange = (nextValue: string) => {
    if (!startedAt) {
      setStartedAt(Date.now())
    }
    setInputValue(nextValue)
    if (isSegmentCompleted(targetText, nextValue)) {
      goNext()
    }
  }

  const onReset = () => {
    setCurrentIndex(0)
    setInputValue('')
    setStartedAt(null)
    setFinishedAt(null)
    setNow(Date.now())
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <section className="mb-6 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">打字练习模式</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            按段落输入，直接在原文区域输入。不区分大小写，正确显示绿色，错误显示红色。
          </p>
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
          进度: {Math.min(currentIndex + 1, segments.length)}/{segments.length}
        </div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">完成度: {progress}%</div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">WPM: {wpm}</div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">准确率: {accuracy}%</div>
        <div className="rounded-lg bg-white/90 px-3 py-2 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">错误数: {wrongCount}</div>
      </div>

      {!isFinished ? (
        <>
          <div
            className="relative rounded-xl border border-slate-200 bg-white p-4 text-[22px] leading-10 tracking-[0.06em] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={() => inputRef.current?.focus()}
          >
            {targetText.split('').map((char, index) => {
              if (index >= inputValue.length) {
                return (
                  <span key={`target-${index}`} className="text-slate-400 dark:text-slate-500">
                    {char}
                  </span>
                )
              }
              const typedChar = inputValue[index]
              const isCorrect = isSameIgnoreCase(char, typedChar)
              return (
                <span key={`target-${index}`} className={isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}>
                  {char}
                </span>
              )
            })}
            {inputValue.length > targetText.length && (
              <span className="text-red-600 dark:text-red-300">{inputValue.slice(targetText.length)}</span>
            )}
            <textarea
              className="absolute inset-0 h-full w-full resize-none border-none bg-transparent p-4 text-[22px] leading-10 tracking-[0.06em] text-transparent caret-indigo-500 outline-none"
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder=""
              ref={inputRef}
              spellCheck={false}
              value={inputValue}
            />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          练习完成，耗时 {elapsedSeconds}s，WPM {wpm}，准确率 {accuracy}%。
        </div>
      )}
    </section>
  )
}
