import { articles, findArticleById } from '@/resources/articles'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import IconArrowNarrowRight from '~icons/tabler/arrow-narrow-right'
import IconBook from '~icons/tabler/book'
import IconClock from '~icons/tabler/clock'
import IconSparkles from '~icons/tabler/sparkles'

export default function ArticlePage() {
  const { id } = useParams()
  const currentArticle = useMemo(() => findArticleById(id), [id])
  const relatedArticles = useMemo(() => articles.filter((item) => item.id !== currentArticle.id).slice(0, 3), [currentArticle.id])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">文章</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">精读文章、词汇提示与重点摘要</p>
        </div>
        <Link
          className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200"
          to="/article-gallery"
        >
          前往文章库
          <IconArrowNarrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <article className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/88 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
              {currentArticle.level}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {currentArticle.category}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {currentArticle.updatedAt}
            </span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">{currentArticle.title}</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{currentArticle.subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {currentArticle.tags.map((tag) => (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300" key={tag}>
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-8 space-y-5 text-[15px] leading-8 text-slate-700 dark:text-slate-300">
            {currentArticle.paragraphs.map((paragraph, index) => (
              <p key={`${currentArticle.id}-paragraph-${index}`}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="min-h-0 overflow-y-auto space-y-4">
          <section className="rounded-2xl border border-slate-200/90 bg-white/88 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <IconBook className="h-4 w-4" />
              阅读信息
            </h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
                <span>难度</span>
                <strong>{currentArticle.level}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
                <span>分类</span>
                <strong>{currentArticle.category}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
                <span className="inline-flex items-center gap-1">
                  <IconClock className="h-3.5 w-3.5" />
                  预计阅读
                </span>
                <strong>{currentArticle.minutes} 分钟</strong>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white/88 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <IconSparkles className="h-4 w-4" />
              重点摘要
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {currentArticle.highlights.map((item) => (
                <li className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white/88 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">词汇提示</h3>
            <div className="mt-3 space-y-2 text-sm">
              {currentArticle.vocabulary.map((item) => (
                <div className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80" key={item.word}>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{item.word}</span>
                  <span className="text-right text-slate-500 dark:text-slate-400">{item.meaning}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white/88 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">相关文章</h3>
            <div className="mt-3 space-y-2">
              {relatedArticles.map((item) => (
                <Link
                  className="block rounded-lg border border-slate-200/80 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/80"
                  key={item.id}
                  to={`/article/${item.id}`}
                >
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.level} · {item.category}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
