'use client'

import { Icon } from '../Icon'
import { startTour } from './Tour'

export function TourButton({ label = 'Hacelo con el recorrido guiado' }: { label?: string }) {
  return (
    <button type="button" className="btn btn-outline btn-sm" onClick={startTour}>
      <Icon name="florece" size={16} /> {label}
    </button>
  )
}
