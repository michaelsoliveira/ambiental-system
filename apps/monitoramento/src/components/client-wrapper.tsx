'use client';

import { useAutoRefreshToken } from "@/hooks/use-auto-refresh-token";

export function ClientWrapper() {
  useAutoRefreshToken();
  
  return null;
}
