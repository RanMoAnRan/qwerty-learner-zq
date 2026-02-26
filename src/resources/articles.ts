export type ArticleLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type ArticleCategory = 'Business' | 'Technology' | 'Culture' | 'Daily Life'

export type Article = {
  id: string
  title: string
  subtitle: string
  summary: string
  level: ArticleLevel
  category: ArticleCategory
  minutes: number
  updatedAt: string
  tags: string[]
  highlights: string[]
  vocabulary: Array<{ word: string; meaning: string }>
  paragraphs: string[]
}

const categoryOrder: ArticleCategory[] = ['Business', 'Technology', 'Culture', 'Daily Life']
const levelOrder: ArticleLevel[] = ['Beginner', 'Intermediate', 'Advanced']

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

export function findArticleById(articles: Article[], id?: string): Article | null {
  if (articles.length === 0) {
    return null
  }
  if (!id) {
    return articles[0]
  }
  return articles.find((item) => item.id === id) || articles[0]
}
