/**
 * @file tests/setup/integration.ts
 * @desc Per-file setup for the integration project: a full fake server env pointing at the
 *       in-memory MongoDB, with SKIP_ENV_VALIDATION cleared so services use the real database.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { stubOsuAppEnv } from "@haruhimemoe/next-kit/testing";
import { inject, vi } from "vitest";

// TEMP(next-kit link): next-kit is linked via file:../next-kit and carries its own vitest, so its
// ProvidedContext augmentation lands on another module instance. Repeating it keeps
// inject("mongoUri") typed. Drop once next-kit is a registry dependency again.
declare module "vitest" {
  interface ProvidedContext {
    mongoUri: string;
  }
}

stubOsuAppEnv({ MONGODB_URI: inject("mongoUri") });
// CI sets SKIP_ENV_VALIDATION for the whole job (for `next build`); integration tests use a real
// in-memory database, so services must not take their "no database" path.
vi.stubEnv("SKIP_ENV_VALIDATION", "");
