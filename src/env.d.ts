/// <reference types="astro/client" />

declare global {
  namespace App {
    /**
     * Variables compartidas entre middleware y paginas durante una request.
     */
    interface Locals {
      currentUser?: import('./types/planner').PlannerUser;
    }
  }
}

/**
 * Variables de entorno disponibles en tiempo de build/runtime.
 */
interface ImportMetaEnv {
  readonly DEMO_USERNAME?: string;
  readonly DEMO_PASSWORD?: string;
}

export {};
