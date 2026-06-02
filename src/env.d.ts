/// <reference types="astro/client" />

declare global {
  namespace App {
    interface Locals {
      currentUser?: import('./types/planner').PlannerUser;
    }
  }
}

export {};
