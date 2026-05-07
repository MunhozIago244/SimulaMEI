'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!apiKey || typeof window === 'undefined' || posthog.__loaded) {
      return
    }

    posthog.init(apiKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      loaded(instance) {
        instance.register({
          app: 'simulamei',
        })
      },
    })
  }, [])

  return children
}
