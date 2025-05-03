import { PLAN_IDS, PLAN_FEATURES, PLAN_NAMES } from './subscriptionConstants';

/**
 * Subscription plan helpers and utilities
 * These functions help determine feature access based on subscription levels
 */

// Define the available plan types
export type PlanType = '1' | '2' | '3' | '4';

// Plan details mapping
export const planFeatures: Record<string, FeatureAccess> = PLAN_FEATURES;

// Feature access by plan
export interface FeatureAccess {
  chatMessages: number;
  modelAccess: string[];
  apiCallsLimit: number;
  storageLimit: number; // in MB
  customApiKeys: boolean;
  advancedAnalytics: boolean;
  teamMembers: number;
  prioritySupport: boolean;
}

/**
 * Check if a user's plan has access to a specific feature
 * @param userPlanId The user's current plan ID
 * @param requiredPlanId The minimum plan ID required for the feature
 * @returns Boolean indicating if the user has access
 */
export function hasAccess(userPlanId: string | null, requiredPlanId: string): boolean {
  // If no user plan, they only have access to Free plan
  if (!userPlanId) return requiredPlanId === PLAN_IDS.FREE;

  // Convert plan IDs to numbers for comparison
  const userPlan = parseInt(userPlanId);
  const requiredPlan = parseInt(requiredPlanId);

  // Users have access to their plan and below
  return userPlan >= requiredPlan;
}

/**
 * Check if a specific model is available for a user's plan
 * @param userPlanId The user's current plan ID
 * @param modelId The model to check access for
 * @returns Boolean indicating if the user has access to the model
 */
export function hasModelAccess(userPlanId: string | null, modelId: string): boolean {
  // Model IDs can be mapped to required plan levels
  const modelToPlanMap: Record<string, string> = {
    'gpt-3.5-turbo': PLAN_IDS.FREE,
    'text-davinci-003': PLAN_IDS.FREE,
    'claude-instant-1': PLAN_IDS.STARTER,
    'gpt-4': PLAN_IDS.PRO,
    'claude-2': PLAN_IDS.PRO,
    'gpt-4-vision': PLAN_IDS.ENTERPRISE,
    'claude-3-opus': PLAN_IDS.ENTERPRISE,
  };

  const requiredPlan = modelToPlanMap[modelId] || PLAN_IDS.FREE;
  return hasAccess(userPlanId, requiredPlan);
}

/**
 * Get the plan name from the plan ID
 * @param planId The plan ID
 * @returns The plan name as a string
 */
export function getPlanName(planId: string): string {
  return PLAN_NAMES[planId as PlanType] || 'Unknown Plan';
}

/**
 * Get the next upgrade plan for a given plan
 * @param currentPlanId The current plan ID
 * @returns The next plan ID or null if already at highest plan
 */
export function getNextPlan(currentPlanId: string): string | null {
  const planIds = Object.values(PLAN_IDS);
  const currentIndex = planIds.indexOf(currentPlanId);
  
  if (currentIndex === -1 || currentIndex === planIds.length - 1) {
    return null; // No next plan if current plan not found or already at highest plan
  }
  
  return planIds[currentIndex + 1];
}

/**
 * Format storage sizes in a human-readable format
 * @param bytes Size in bytes
 * @returns Formatted string with appropriate unit
 */
export function formatStorageSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get the feature limit for a specific plan and feature
 * @param planId The plan ID
 * @param feature The feature to get the limit for
 * @returns The limit value
 */
export function getFeatureLimit(planId: string, featureName: keyof typeof PLAN_FEATURES[PlanType]): number | string | boolean {
  if (!planId || !PLAN_FEATURES[planId as PlanType]) {
    return PLAN_FEATURES[PLAN_IDS.FREE][featureName];
  }
  
  return PLAN_FEATURES[planId as PlanType][featureName];
}
