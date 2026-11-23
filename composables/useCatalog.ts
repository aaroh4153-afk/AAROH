import { useStore } from './useStore'
import type { Product } from '../data/products'

export type CatalogSort = 'featured' | 'newest' | 'price-asc' | 'price-desc'

/**
 * Shared catalogue state so the header search, the category rail and the
 * collection grid all filter the same set of pieces.
 */
export const useCatalog = () => {
  const { activeProducts } = useStore()

  const query = useState<string>('catalog-query', () => '')
  const isSearchOpen = useState<boolean>('catalog-search-open', () => false)
  const activeCategory = useState<string>('catalog-category', () => 'all')
  const activeCollection = useState<string>('catalog-collection', () => 'all')
  const sort = useState<CatalogSort>('catalog-sort', () => 'featured')

  const normalizedQuery = computed(() => query.value.trim().toLowerCase())

  const isFiltering = computed(
    () =>
      normalizedQuery.value.length > 0 ||
      activeCategory.value !== 'all' ||
      activeCollection.value !== 'all',
  )

  /** Show every active product, with newly published products first. */
  const storefrontProducts = computed(() => {
    return [...activeProducts.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  function refine(source: Product[]): Product[] {
    let result = source

    if (normalizedQuery.value) {
      result = result.filter((product) =>
        `${product.name} ${product.colour} ${product.category} ${product.collection}`
          .toLowerCase()
          .includes(normalizedQuery.value),
      )
    }

    if (activeCategory.value !== 'all') {
      result = result.filter((product) => product.category === activeCategory.value)
    }

    if (activeCollection.value !== 'all') {
      result = result.filter((product) => product.collection === activeCollection.value)
    }

    switch (sort.value) {
      case 'price-asc':
        return [...result].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...result].sort((a, b) => b.price - a.price)
      case 'newest':
        return [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      default:
        return [...result].sort((a, b) => Number(b.featured) - Number(a.featured))
    }
  }

  /** Search results across the full catalogue. */
  const filteredProducts = computed(() => refine(activeProducts.value))

  /** The home rail: the three-piece edit, filtered and sorted the same way. */
  const homeProducts = computed(() => refine(storefrontProducts.value))

  function setCategory(category: string) {
    activeCategory.value = category
  }

  function setCollection(collection: string) {
    activeCollection.value = collection
  }

  function setSort(next: CatalogSort) {
    sort.value = next
  }

  const toggleSearch = () => {
    isSearchOpen.value = !isSearchOpen.value
  }

  const closeSearch = () => {
    isSearchOpen.value = false
  }

  const clearQuery = () => {
    query.value = ''
  }

  const clearFilters = () => {
    query.value = ''
    activeCategory.value = 'all'
    activeCollection.value = 'all'
    sort.value = 'featured'
  }

  return {
    query,
    isSearchOpen,
    normalizedQuery,
    filteredProducts,
    homeProducts,
    storefrontProducts,
    isFiltering,
    activeCategory,
    activeCollection,
    sort,
    setCategory,
    setCollection,
    setSort,
    toggleSearch,
    closeSearch,
    clearQuery,
    clearFilters,
  }
}
