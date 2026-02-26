import TypingPracticePanel from './TypingPracticePanel'
import { findArticleById, getArticleCategoryLabel, getArticleLevelLabel } from '@/resources/articles'
import { useArticles } from '@/resources/useArticles'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import IconArrowNarrowRight from '~icons/tabler/arrow-narrow-right'
import IconKeyboard from '~icons/tabler/keyboard'

export default function ArticlePage() {
  const LAST_ARTICLE_ID_KEY = 'qwerty-learner:last-article-id'
  const { id } = useParams()
  const { articles, error, isLoading } = useArticles()
  const [isTypingPracticeOpen, setIsTypingPracticeOpen] = useState(true)
  const currentArticle = useMemo(() => findArticleById(articles, id), [articles, id])

  useEffect(() => {
    if (!currentArticle?.id) {
      return
    }
    window.localStorage.setItem(LAST_ARTICLE_ID_KEY, currentArticle.id)
  }, [currentArticle?.id])

  if (error) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
        <div className="grid h-72 place-content-center rounded-2xl border border-red-200 bg-red-50/70 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          文章数据加载失败，请稍后重试
        </div>
      </div>
    )
  }

  if (isLoading || !currentArticle) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
        <div className="grid h-72 place-content-center rounded-2xl border border-slate-200/80 bg-white/70 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400">
          正在加载文章内容...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">文章</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">精读文章与段落打字练习</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
            onClick={() => setIsTypingPracticeOpen((prev) => !prev)}
            type="button"
          >
            <IconKeyboard className="h-4 w-4" />
            {isTypingPracticeOpen ? '收起练习' : '开始打字练习'}
          </button>
          <Link
            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200"
            to="/article-gallery"
          >
            前往文章库
            <IconArrowNarrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <article className="h-full overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/88 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
              {getArticleLevelLabel(currentArticle.level)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {getArticleCategoryLabel(currentArticle.category)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {currentArticle.updatedAt}
            </span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">{currentArticle.title}</h2>
          {currentArticle.titleZh && <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">{currentArticle.titleZh}</p>}

          <div className="mt-6 flex flex-wrap gap-2">
            {currentArticle.tags.map((tag) => (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300" key={tag}>
                #{tag}
              </span>
            ))}
          </div>

          {isTypingPracticeOpen ? (
            <TypingPracticePanel articleId={currentArticle.id} paragraphs={currentArticle.paragraphs} paragraphsZh={currentArticle.paragraphsZh} />
          ) : (
            <div className="mt-8 space-y-6 text-[18px] leading-9 text-slate-700 dark:text-slate-300">
              {currentArticle.paragraphs.map((paragraph, index) => (
                <div key={`${currentArticle.id}-paragraph-${index}`}>
                  <p>{paragraph}</p>
                  {currentArticle.paragraphsZh?.[index] && (
                    <p className="mt-2 text-base leading-8 text-slate-500 dark:text-slate-400">{currentArticle.paragraphsZh[index]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
