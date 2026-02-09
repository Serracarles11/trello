"use client";

import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={0}>
      {children}
    </TooltipProvider>
  );
}
