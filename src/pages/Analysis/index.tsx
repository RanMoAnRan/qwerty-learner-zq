import HeatmapCharts from './components/HeatmapCharts'
import KeyboardWithBarCharts from './components/KeyboardWithBarCharts'
import LineCharts from './components/LineCharts'
import { useWordStats } from './hooks/useWordStats'
import { isOpenDarkModeAtom } from '@/store'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import dayjs from 'dayjs'
import { useAtom } from 'jotai'
import { useHotkeys } from 'react-hotkeys-hook'

const Analysis = () => {
  const [, setIsOpenDarkMode] = useAtom(isOpenDarkModeAtom)

  const changeDarkModeState = () => {
    setIsOpenDarkMode((old) => !old)
  }

  useHotkeys(
    'ctrl+d',
    () => {
      changeDarkModeState()
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  const { isEmpty, exerciseRecord, wordRecord, wpmRecord, accuracyRecord, wrongTimeRecord } = useWordStats(
    dayjs().subtract(1, 'year').unix(),
    dayjs().unix(),
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
      <div>
        <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">数据统计</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">最近一年练习趋势、准确率和错键分布</p>
      </div>
      <ScrollArea.Root className="mt-6 min-h-0 flex-1 overflow-y-auto">
        <ScrollArea.Viewport className="h-full w-auto pb-20 [&>div]:!block">
          {isEmpty ? (
            <div className="align-items-center m-4 grid h-72 w-auto place-content-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
              <div className="text-2xl text-slate-400 dark:text-slate-300">暂无练习数据</div>
            </div>
          ) : (
            <>
              <div className="mx-4 my-6 h-auto w-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                <HeatmapCharts title="过去一年练习次数热力图" data={exerciseRecord} />
              </div>
              <div className="mx-4 my-6 h-auto w-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                <HeatmapCharts title="过去一年练习词数热力图" data={wordRecord} />
              </div>
              <div className="mx-4 my-6 h-80 w-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                <LineCharts title="过去一年WPM趋势图" name="WPM" data={wpmRecord} />
              </div>
              <div className="mx-4 my-6 h-80 w-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                <LineCharts title="过去一年正确率趋势图" name="正确率(%)" data={accuracyRecord} suffix="%" />
              </div>
              <div className="mx-4 my-6 h-80 w-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                <KeyboardWithBarCharts title="按键错误次数排行" name="错误次数" data={wrongTimeRecord} />
              </div>
            </>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent" orientation="vertical"></ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  )
}

export default Analysis
