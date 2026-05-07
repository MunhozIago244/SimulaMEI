'use client'

import { useEffect, useState } from 'react'

interface SectionNavItem {
  id: string
  label: string
}

interface SectionNavProps {
  items: SectionNavItem[]
}

export function SectionNav({ items }: SectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-18% 0px -58% 0px', threshold: [0, 0.18, 0.36] }
    )

    items.forEach(item => {
      const section = document.getElementById(item.id)
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav className="floating-section-nav desktop-only" aria-label="Seções da página">
      {items.map((item, index) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={activeId === item.id ? 'true' : undefined}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
