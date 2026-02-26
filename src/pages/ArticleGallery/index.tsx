import {
  getArticleCategoryLabel,
  getArticleCategoryList,
  getArticleLevelLabel,
  getArticleLevelList,
  getArticleTagList,
} from '@/resources/articles'
import { useArticles } from '@/resources/useArticles'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import IconSearch from '~icons/tabler/search'

function getFirstSentence(text?: string): string {
  if (!text) {
    return ''
  }
  const trimmed = text.trim()
  const match = trimmed.match(/^(.+?[.!?。！？])(?:\s|$)/)
  return match ? match[1] : trimmed
}

export default function ArticleGalleryPage() {
  const { articles, error, isLoading } = useArticles()
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedLevel, setSelectedLevel] = useState<string>('All')
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const articleCategoryList = useMemo(() => getArticleCategoryList(articles), [articles])
  const articleLevelList = useMemo(() => getArticleLevelList(articles), [articles])
  const articleTagList = useMemo(() => getArticleTagList(articles), [articles])

  const list = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return articles.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.titleZh?.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.summaryZh?.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword))
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      const matchesLevel = selectedLevel === 'All' || item.level === selectedLevel
      const matchesTag = selectedTag === 'All' || item.tags.includes(selectedTag)
      return matchesKeyword && matchesCategory && matchesLevel && matchesTag
    })
  }, [articles, searchText, selectedCategory, selectedLevel, selectedTag])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
      <div className="mb-6">
        <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">文章库</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">浏览主题文章，按难度与分类筛选，进入精读页面练习</p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1.8fr_1fr_1fr_1fr]">
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
              {getArticleCategoryLabel(item)}
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
              {getArticleLevelLabel(item)}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200"
          onChange={(event) => setSelectedTag(event.target.value)}
          value={selectedTag}
        >
          <option value="All">全部标签</option>
          {articleTagList.map((item) => (
            <option key={item} value={item}>
              #{item}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <div className="grid h-72 place-content-center rounded-2xl border border-red-200 bg-red-50/70 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            文章数据加载失败，请稍后重试
          </div>
        ) : isLoading ? (
          <div className="grid h-72 place-content-center rounded-2xl border border-slate-200/80 bg-white/70 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400">
            正在加载文章库...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => (
              <Link
                className="group rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-indigo-400/50"
                key={item.id}
                to={`/article/${item.id}`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                    {getArticleLevelLabel(item.level)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {getArticleCategoryLabel(item.category)}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{item.minutes} 分钟</span>
                </div>

                <h2 className="text-xl font-bold text-slate-800 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-200">
                  {item.title}
                </h2>
                {item.titleZh && <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{item.titleZh}</p>}
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {getFirstSentence(item.paragraphs?.[0] || item.summary)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {getFirstSentence(item.paragraphsZh?.[0] || item.summaryZh)}
                </p>

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
        )}
      </div>
    </div>
  )
}
