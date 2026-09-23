import { formatPrice } from '@/lib/format'

export function Price({ value, compareAt, className = '' }: { value: number; compareAt?: number | null; className?: string }) {
  return (
    <div className={`price ${className}`}>
      {formatPrice(value)}
      {compareAt && compareAt > value ? (
        <s>
          <span className="visually-hidden">Antes </span>
          {formatPrice(compareAt)}
        </s>
      ) : null}
    </div>
  )
}
