import { articleCategoryList, articleLevelList, articles } from '@/resources/articles'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import IconSearch from '~icons/tabler/search'

export default function ArticleGalleryPage() {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedLevel, setSelectedLevel] = useState<string>('All')

  const list = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return articles.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.subtitle.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword))
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      const matchesLevel = selectedLevel === 'All' || item.level === selectedLevel
      return matchesKeyword && matchesCategory && matchesLevel
    })
  }, [searchText, selectedCategory, selectedLevel])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
      <div className="mb-6">
        <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">文章库</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">浏览主题文章，按难度与分类筛选，进入精读页面练习</p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
          <IconSearch className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="搜索标题、摘要、标签"
            value={searchText}
          />
        </label>
        <select
          className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200"
          onChange={(event) => setSelectedCategory(event.target.value)}
          value={selectedCategory}
        >
          <option value="All">全部分类</option>
          {articleCategoryList.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200"
          onChange={(event) => setSelectedLevel(event.target.value)}
          value={selectedLevel}
        >
          <option value="All">全部难度</option>
          {articleLevelList.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {list.map((item) => (
            <Link
              className="group rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-indigo-400/50"
              key={item.id}
              to={`/article/${item.id}`}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                  {item.level}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.category}
                </span>
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{item.minutes} min</span>
              </div>

              <h2 className="text-xl font-bold text-slate-800 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-200">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
