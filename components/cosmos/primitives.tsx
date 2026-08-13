'use client'

import { cn } from '@/lib/utils'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

/* ————————————————————————————————————————————————
   Reveal on scroll
———————————————————————————————————————————————— */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: React.ElementType
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      className={cn('reveal', className)}
      data-visible={visible}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/* ————————————————————————————————————————————————
   3D tilt card with cursor-tracked specular glow
———————————————————————————————————————————————— */
export function TiltCard({
  children,
  className,
  intensity = 7,
  glow = 'oklch(0.8 0.16 305 / 0.28)',
  onClick,
  as = 'div',
  ariaLabel,
}: {
  children: React.ReactNode
  className?: string
  intensity?: number
  glow?: string
  onClick?: () => void
  as?: 'div' | 'button'
  ariaLabel?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [spot, setSpot] = useState({ x: 50, y: 50, on: false })

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      setStyle({
        transform: `perspective(1100px) rotateX(${(0.5 - py) * intensity}deg) rotateY(${
          (px - 0.5) * intensity
        }deg) translateZ(0) scale(1.012)`,
        boxShadow: `0 26px 70px -34px ${glow}, 0 0 0 1px oklch(1 0 0 / 0.08)`,
      })
      setSpot({ x: px * 100, y: py * 100, on: true })
    },
    [glow, intensity],
  )

  const reset = useCallback(() => {
    setStyle({})
    setSpot((s) => ({ ...s, on: false }))
  }, [])

  const Comp = as as React.ElementType

  return (
    <Comp
      ref={ref}
      type={as === 'button' ? 'button' : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn(
        'tilt-root relative isolate overflow-hidden text-left',
        onClick && 'cursor-pointer',
        className,
      )}
      style={style}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500"
        style={{
          opacity: spot.on ? 1 : 0,
          background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, ${glow}, transparent 62%)`,
        }}
      />
      {children}
    </Comp>
  )
}

/* ————————————————————————————————————————————————
   Cosmic button — gradient core, sheen, ripple ring
———————————————————————————————————————————————— */
export function CosmicButton({
  children,
  onClick,
  variant = 'solid',
  className,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'solid' | 'ghost' | 'outline'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition-all duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none',
        variant === 'solid' && 'text-primary-foreground shadow-[0_10px_40px_-12px_oklch(0.62_0.24_300/0.9)]',
        variant === 'outline' && 'border-border text-foreground hover:border-primary/50 border bg-transparent',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground',
        className,
      )}
      style={
        variant === 'solid'
          ? { backgroundImage: 'linear-gradient(135deg, oklch(0.88 0.14 310), oklch(0.6 0.25 298))' }
          : undefined
      }
    >
      {variant === 'solid' && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-[120%] opacity-0 transition-none group-hover:opacity-100"
          style={{
            background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)',
            animation: 'sheen 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        />
      )}
      {variant === 'outline' && (
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'linear-gradient(135deg, oklch(0.8 0.16 305 / 0.16), transparent 70%)' }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

/* ————————————————————————————————————————————————
   Section header
———————————————————————————————————————————————— */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string
  title: React.ReactNode
  description?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={cn('flex flex-col gap-3', align === 'center' && 'items-center text-center')}>
      <div
        className={cn(
          'text-primary/90 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.28em] uppercase',
          align === 'center' && 'justify-center',
        )}
      >
        <span
          aria-hidden
          className="size-1.5 shrink-0 rotate-45"
          style={{ background: 'var(--star)', boxShadow: '0 0 10px 1px var(--star)' }}
        />
        {eyebrow}
      </div>
      <h2 className="font-display max-w-3xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.06] font-semibold tracking-tight text-pretty">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground max-w-2xl text-[15px] leading-relaxed text-pretty">{description}</p>
      )}
    </div>
  )
}

/* ————————————————————————————————————————————————
   Count-up number, triggered on view
———————————————————————————————————————————————— */
export function useCountUp(target: number, duration = 1500, decimals = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement | null>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const run = () => {
      if (started.current) return
      started.current = true
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Number((target * eased).toFixed(decimals)))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration, decimals])

  return { value, ref }
}
