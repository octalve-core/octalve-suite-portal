import type { AppState, ProjectTemplate } from "./types";

/**
 * Production-safe empty seed state.
 *
 * Historical demo records have been removed from this file so the portal
 * cannot fall back to sample users, projects, requests, payments, reviews,
 * or notifications.
 */
export const templates: ProjectTemplate[] = [];

export const initialState: AppState = {
  users: [],
  templates: [],
  projects: [],
  requests: [],
  reviews: [],
  notifications: [],
};

export function cloneInitialState(): AppState {
  return JSON.parse(JSON.stringify(initialState)) as AppState;
}