import { TypingContext, TypingStateActionType } from '../../store'
import WordCard from './WordCard'
import Drawer from '@/components/Drawer'
import Tooltip from '@/components/Tooltip'
import { currentChapterAtom, currentDictInfoAtom, isReviewModeAtom } from '@/store'
import range from '@/utils/range'
import { Dialog, Listbox, Transition } from '@headlessui/react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useAtom, useAtomValue } from 'jotai'
import { Fragment, useContext, useState } from 'react'
import IconCheck from '~icons/tabler/check'
import IconChevronDown from '~icons/tabler/chevron-down'
import ListIcon from '~icons/tabler/list'
import IconX from '~icons/tabler/x'

export default function WordList() {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!

  const [isOpen, setIsOpen] = useState(false)
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const chapterCount = currentDictInfo.chapterCount

  function closeModal() {
    setIsOpen(false)
  }

  function openModal() {
    setIsOpen(true)
    dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
  }

  return (
    <>
      <Tooltip content="List" placement="top" className="z-20">
        <button
          type="button"
          onClick={openModal}
          className="fixed left-5 top-1/2 z-20 -translate-y-1/2 rounded-2xl border border-indigo-200/70 bg-white/90 px-3 py-3 text-lg shadow-[0_14px_36px_-20px_rgba(79,70,229,0.8)] backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-indigo-50 focus:outline-none dark:border-indigo-800 dark:bg-gray-900/85 dark:hover:bg-gray-800"
        >
          <ListIcon className="h-5 w-5 text-lg text-indigo-500 dark:text-indigo-300" />
        </button>
      </Tooltip>

      <Drawer open={isOpen} onClose={closeModal} classNames="bg-stone-50 dark:bg-gray-900">
        <Dialog.Title
          as="h3"
          className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-gradient-to-r from-white via-indigo-50 to-cyan-50 p-4 text-lg font-medium leading-6 dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:text-gray-50"
        >
          <div className="ml-5 flex min-w-0 items-center gap-3">
            <span className="truncate">{currentDictInfo.name}</span>
            {isReviewMode ? (
              <span className="rounded-md bg-indigo-100 px-2 py-1 text-sm text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                错题复习
              </span>
            ) : (
              <Listbox value={currentChapter} onChange={setCurrentChapter}>
                <div className="relative">
                  <Listbox.Button className="flex items-center gap-1 whitespace-nowrap rounded-full border border-indigo-200 bg-white/95 px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 focus:outline-none dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700">
                    <span>第{currentChapter + 1}章</span>
                    <IconChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="listbox-options z-40 mt-2 w-auto min-w-[8.5rem] whitespace-nowrap rounded-xl border border-indigo-100 p-1 shadow-xl dark:border-gray-700">
                      {range(0, chapterCount, 1).map((index) => (
                        <Listbox.Option key={index} value={index}>
                          {({ selected }) => (
                            <div className="group flex cursor-pointer items-center justify-between whitespace-nowrap rounded-lg">
                              {selected ? (
                                <span className="listbox-options-icon">
                                  <IconCheck className="focus:outline-none" />
                                </span>
                              ) : null}
                              <span className="whitespace-nowrap">第{index + 1}章</span>
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            )}
          </div>
          <IconX onClick={closeModal} className="shrink-0 cursor-pointer" />
        </Dialog.Title>
        <ScrollArea.Root className="flex-1 select-none overflow-y-auto ">
          <ScrollArea.Viewport className="h-full w-full px-3">
            <div className="flex h-full w-full flex-col gap-1">
              {state.chapterData.words?.map((word, index) => {
                return <WordCard word={word} key={`${word.name}_${index}`} isActive={state.chapterData.index === index} />
              })}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent " orientation="vertical"></ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </Drawer>
    </>
  )
}
