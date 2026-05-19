import { useState, useEffect, useCallback, useRef } from 'react'

interface SearchResult {
  address: number
  type: 'string' | 'instruction' | 'symbol' | 'data'
  content: string
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mock search function (will be replaced with r2 search)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setCurrentIndex(-1)
      return
    }

    setIsSearching(true)

    // Mock results
    const mockResults: SearchResult[] = [
      { address: 0x1000, type: 'instruction', content: `mov eax, ${searchQuery}` },
      { address: 0x1020, type: 'string', content: `"${searchQuery}"` },
      { address: 0x1030, type: 'symbol', content: `sym.${searchQuery}` },
    ]

    // Simulate search delay
    await new Promise(r => setTimeout(r, 200))

    setResults(mockResults)
    setCurrentIndex(mockResults.length > 0 ? 0 : -1)
    setIsSearching(false)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, performSearch])

  // Next result
  const next = useCallback(() => {
    if (results.length === 0) return null
    const newIndex = (currentIndex + 1) % results.length
    setCurrentIndex(newIndex)
    return results[newIndex]
  }, [results, currentIndex])

  // Previous result
  const previous = useCallback(() => {
    if (results.length === 0) return null
    const newIndex = currentIndex <= 0 ? results.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    return results[newIndex]
  }, [results, currentIndex])

  // Current result
  const current = currentIndex >= 0 && currentIndex < results.length ? results[currentIndex] : null

  // Clear search
  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setCurrentIndex(-1)
  }, [])

  // Set current index manually
  const setIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < results.length) {
      setCurrentIndex(idx)
    }
  }, [results.length])

  return {
    query,
    setQuery,
    results,
    currentIndex,
    current,
    next,
    previous,
    clear,
    setCurrentIndex: setIndex,
    isSearching,
    hasResults: results.length > 0,
    resultCount: results.length,
  }
}