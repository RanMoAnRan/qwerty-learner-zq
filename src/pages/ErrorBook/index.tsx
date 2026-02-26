import DropdownExport from './DropdownExport'
import ErrorRow from './ErrorRow'
import type { ISortType } from './HeadWrongNumber'
import HeadWrongNumber from './HeadWrongNumber'
import Pagination, { ITEM_PER_PAGE } from './Pagination'
import RowDetail from './RowDetail'
import { currentRowDetailAtom } from './store'
import type { groupedWordRecords } from './type'
import { db, useDeleteWordRecord } from '@/utils/db'
import type { WordRecord } from '@/utils/db/record'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function ErrorBook() {
  const [groupedRecords, setGroupedRecords] = useState<groupedWordRecords[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = useMemo(() => Math.ceil(groupedRecords.length / ITEM_PER_PAGE), [groupedRecords.length])
  const [sortType, setSortType] = useState<ISortType>('asc')
  const currentRowDetail = useAtomValue(currentRowDetailAtom)
  const { deleteWordRecord } = useDeleteWordRecord()
  const [reload, setReload] = useState(false)

  const setPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return
      setCurrentPage(page)
    },
    [totalPages],
  )

  const setSort = useCallback(
    (sortType: ISortType) => {
      setSortType(sortType)
      setPage(1)
    },
    [setPage],
  )

  const sortedRecords = useMemo(() => {
    if (sortType === 'none') return groupedRecords
    return [...groupedRecords].sort((a, b) => {
      if (sortType === 'asc') {
        return a.wrongCount - b.wrongCount
      } else {
        return b.wrongCount - a.wrongCount
      }
    })
  }, [groupedRecords, sortType])

  const renderRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEM_PER_PAGE
    const end = start + ITEM_PER_PAGE
    return sortedRecords.slice(start, end)
  }, [currentPage, sortedRecords])

  useEffect(() => {
    db.wordRecords
      .where('wrongCount')
      .above(0)
      .toArray()
      .then((records) => {
        const groups: groupedWordRecords[] = []

        records.forEach((record) => {
          let group = groups.find((g) => g.word === record.word && g.dict === record.dict)
          if (!group) {
            group = { word: record.word, dict: record.dict, records: [], wrongCount: 0 }
            groups.push(group)
          }
          group.records.push(record as WordRecord)
        })

        groups.forEach((group) => {
          group.wrongCount = group.records.reduce((acc, cur) => {
            acc += cur.wrongCount
            return acc
          }, 0)
        })

        setGroupedRecords(groups)
      })
  }, [reload])

  const handleDelete = async (word: string, dict: string) => {
    await deleteWordRecord(word, dict)
    setReload((prev) => !prev)
  }

  return (
    <>
      <div className={`relative flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7 ease-in ${currentRowDetail && 'blur-sm'}`}>
        <div className="mb-5">
          <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">错题本</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">点击错误单词可查看详细信息和练习记录</p>
        </div>

        <div className="flex min-h-0 w-full flex-1 select-text overflow-hidden">
          <div className="flex h-full w-full flex-col">
            <div className="flex w-full justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-5 text-lg text-black shadow-sm dark:bg-gray-800 dark:text-white">
              <span className="basis-2/12">单词</span>
              <span className="basis-6/12">释义</span>
              <HeadWrongNumber className="basis-1/12" sortType={sortType} setSortType={setSort} />
              <span className="basis-1/12">词典</span>
              <DropdownExport renderRecords={sortedRecords} />
            </div>
            <ScrollArea.Root className="min-h-0 flex-1 overflow-y-auto pt-5">
              <ScrollArea.Viewport className="h-full">
                <div className="flex flex-col gap-3">
                  {renderRecords.map((record) => (
                    <ErrorRow
                      key={`${record.dict}-${record.word}`}
                      record={record}
                      onDelete={() => handleDelete(record.word, record.dict)}
                    />
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent" orientation="vertical"></ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </div>
        </div>
        <Pagination className="pt-4" page={currentPage} setPage={setPage} totalPages={totalPages} />
      </div>
      {currentRowDetail && <RowDetail currentRowDetail={currentRowDetail} allRecords={sortedRecords} />}
    </>
  )
}
