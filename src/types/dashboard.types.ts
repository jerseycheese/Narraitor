/**
 * Dashboard type definitions
 *
 * Defines the data structures and state types for the dashboard components
 */

/**
 * Represents the different states a user can be in on the dashboard
 */
export type DashboardState =
  | 'first-time'           // New user, no data
  | 'returning-no-session' // Has worlds/characters but no active sessions
  | 'active-session';      // Has at least one valid saved session

/**
 * Dashboard progress metrics
 */
export interface DashboardMetrics {
  worldsCreated: number;
  charactersCreated: number;
  sessionsPlayed: number;
  narrativeSegments: number;
}
