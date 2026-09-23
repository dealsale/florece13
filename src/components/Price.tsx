import { formatPrice } from '@/lib/format'

export function Price({ value, compareAt, className = '', style }: { value: number; compareAt?: number | null; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`price ${className}`} style={style}>
      {formatPrice(value)}
      {compareAt && compareAt > value ? (
        <s>
          <span className="vh">Antes </span>
          {formatPrice(compareAt)}
        </s>
      ) : null}
    </div>
  )
}
