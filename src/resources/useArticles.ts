import { fetchArticles } from './articles'
import useSWR from 'swr'

export function useArticles() {
  const { data, error, isLoading } = useSWR('articles-resource', fetchArticles)

  return {
    articles: data ?? [],
    error,
    isLoading,
  }
}
