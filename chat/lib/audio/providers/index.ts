/**
 * Audio Providers Index
 * 
 * Re-exports all audio provider interfaces and implementations.
 */

// Interface and types
export * from './AudioProvider.interface';

// Providers
export { EdgeTTSProvider, createEdgeTTSProvider, getEdgeTTSProvider } from './EdgeTTSProvider';
export { KokoroProvider, createKokoroProvider, getKokoroProvider } from './KokoroProvider';
export { ElevenLabsProvider, createElevenLabsProvider, getElevenLabsProvider } from './ElevenLabsProvider';

// Factory
export { ProviderFactory, getProviderFactory, getProvider, getDefaultProvider } from './ProviderFactory';
export type { UserTier, ProviderConfig } from './ProviderFactory';

// Cost tracking
export { CostTracker, getCostTracker, createCostTracker } from '../CostTracker';
