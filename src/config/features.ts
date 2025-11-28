/**
 * Feature Flags
 * 
 * PREMIUM_MODE_ENABLED:
 * - Set to false to hide Premium Mode globally
 * - Set to true to re-enable Premium Mode when ready
 * - Manual control only - owner decides when to bring it back
 * - When OpenAI reduces gpt-4o-realtime API costs, flip this to true
 */
export const FEATURES = {
  PREMIUM_MODE_ENABLED: false, // Owner controls this - no automation
} as const;
