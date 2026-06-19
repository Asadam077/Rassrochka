import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export function Logo({ size = 'md', href = '/' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <Link href={href} className="flex items-center gap-0">
      <span
        className={`${sizes[size]} font-bold tracking-tight text-[var(--foreground)]`}
        style={{ letterSpacing: '-0.02em' }}
      >
        dArch
      </span>
      <span
        className={`${sizes[size]} font-light tracking-tight text-[var(--muted-foreground)]`}
        style={{ letterSpacing: '-0.02em' }}
      >
        .capital
      </span>
    </Link>
  )
}
