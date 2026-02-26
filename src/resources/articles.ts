export type ArticleLevel = '入门' | '进阶' | '高级'

export type ArticleCategory = '商业' | '技术' | '文化' | '日常生活'

export type Article = {
  id: string
  title: string
  titleZh?: string
  summary: string
  summaryZh?: string
  level: ArticleLevel
  category: ArticleCategory
  minutes: number
  updatedAt: string
  tags: string[]
  highlights: string[]
  highlightsZh?: string[]
  vocabulary: Array<{ word: string; meaning: string }>
  paragraphs: string[]
  paragraphsZh?: string[]
}

const categoryOrder: ArticleCategory[] = ['商业', '技术', '文化', '日常生活']
const levelOrder: ArticleLevel[] = ['入门', '进阶', '高级']

export async function fetchArticles(): Promise<Article[]> {
  const URL_PREFIX = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''
  const response = await fetch(`${URL_PREFIX}/articles/articles.json`)
  if (!response.ok) {
    throw new Error(`加载文章库失败: ${response.status}`)
  }
  const data = (await response.json()) as Article[]
  return data
}

export function getArticleCategoryList(articles: Article[]): ArticleCategory[] {
  return categoryOrder.filter((category) => articles.some((article) => article.category === category))
}

export function getArticleLevelList(articles: Article[]): ArticleLevel[] {
  return levelOrder.filter((level) => articles.some((article) => article.level === level))
}

export function getArticleTagList(articles: Article[]): string[] {
  const tagSet = new Set<string>()
  articles.forEach((article) => {
    article.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
}

export function findArticleById(articles: Article[], id?: string): Article | null {
  if (articles.length === 0) {
    return null
  }
  if (!id) {
    return articles[0]
  }
  return articles.find((item) => item.id === id) || articles[0]
}

export function getArticleCategoryLabel(category: ArticleCategory): string {
  return category
}

export function getArticleLevelLabel(level: ArticleLevel): string {
  return level
}
