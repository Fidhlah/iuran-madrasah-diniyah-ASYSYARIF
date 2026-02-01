/**
 * Feature Flags
 * 
 * Centralized feature flag management.
 * All feature flags are controlled via environment variables.
 * 
 * Usage:
 *   import { FEATURES } from '@/lib/feature-flags'
 *   if (FEATURES.TABUNGAN) { ... }
 */

export const FEATURES = {
    /**
     * Tabungan (Savings) Feature
     * Set NEXT_PUBLIC_FEATURE_TABUNGAN=true in .env to enable
     */
    TABUNGAN: process.env.NEXT_PUBLIC_FEATURE_TABUNGAN === 'true',

    // Add more feature flags here as needed
    // EXAMPLE: process.env.NEXT_PUBLIC_FEATURE_EXAMPLE === 'true',
} as const

// Type for feature names
export type FeatureName = keyof typeof FEATURES

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: FeatureName): boolean {
    return FEATURES[feature]
}
