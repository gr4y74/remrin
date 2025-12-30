export {
    searchWeb,
    formatSearchContext,
    shouldTriggerSearch,
    extractSearchQuery
} from './tavily-search'

export type {
    SearchResult,
    TavilySearchResponse,
    SearchOptions,
    SearchDepth
} from './tavily-search'

export {
    augmentWithSearch,
    createSearchAwarePrompt,
    shouldEnableSearch
} from './search-middleware'

export type { SearchMiddlewareOptions } from './search-middleware'
