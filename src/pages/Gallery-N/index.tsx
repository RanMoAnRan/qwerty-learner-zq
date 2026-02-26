import DictionaryGroup from './CategoryDicts'
import DictRequest from './DictRequest'
import { LanguageTabSwitcher } from './LanguageTabSwitcher'
import { dictionaries } from '@/resources/dictionary'
import { currentDictInfoAtom } from '@/store'
import type { Dictionary, LanguageCategoryType } from '@/typings'
import groupBy, { groupByDictTags } from '@/utils/groupBy'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useAtomValue } from 'jotai'
import { createContext, useEffect, useMemo } from 'react'
import type { Updater } from 'use-immer'
import { useImmer } from 'use-immer'
import IconInfo from '~icons/ic/outline-info'

export type GalleryState = {
  currentLanguageTab: LanguageCategoryType
}

const initialGalleryState: GalleryState = {
  currentLanguageTab: 'en',
}

export const GalleryContext = createContext<{
  state: GalleryState
  setState: Updater<GalleryState>
} | null>(null)

export default function GalleryPage() {
  const [galleryState, setGalleryState] = useImmer<GalleryState>(initialGalleryState)
  const currentDictInfo = useAtomValue(currentDictInfoAtom)

  const { groupedByCategoryAndTag } = useMemo(() => {
    const currentLanguageCategoryDicts = dictionaries.filter((dict) => dict.languageCategory === galleryState.currentLanguageTab)
    const groupedByCategory = Object.entries(groupBy(currentLanguageCategoryDicts, (dict) => dict.category))
    const groupedByCategoryAndTag = groupedByCategory.map(
      ([category, dicts]) => [category, groupByDictTags(dicts)] as [string, Record<string, Dictionary[]>],
    )

    return {
      groupedByCategoryAndTag,
    }
  }, [galleryState.currentLanguageTab])

  useEffect(() => {
    if (currentDictInfo) {
      setGalleryState((state) => {
        state.currentLanguageTab = currentDictInfo.languageCategory
      })
    }
  }, [currentDictInfo, setGalleryState])

  return (
    <GalleryContext.Provider value={{ state: galleryState, setState: setGalleryState }}>
      <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">词库</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">选择你要练习的词典并进入章节学习</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageTabSwitcher />
            <DictRequest />
          </div>
        </div>
        <ScrollArea.Root className="min-h-0 flex-1 overflow-y-auto">
          <ScrollArea.Viewport className="h-full w-full">
            <div className="mr-4 flex flex-1 flex-col gap-12 pb-4">
              {groupedByCategoryAndTag.map(([category, groupByTag]) => (
                <DictionaryGroup key={category} groupedDictsByTag={groupByTag} />
              ))}
            </div>
            <div className="mx-1 mt-16 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  本项目的词典数据来自多个开源项目以及社区贡献者，仅供学习研究使用。若涉及版权问题，请通过网站邮箱联系处理。
                </p>
              </div>
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent" orientation="vertical"></ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </GalleryContext.Provider>
  )
}
