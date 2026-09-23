'use client'

import { startTransition, type FormEvent } from 'react'

/**
 * Envía el formulario a la server action sin que React lo resetee.
 * Así, si el servidor devuelve un error, lo que la persona escribió se conserva.
 */
export function useSubmit(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => dispatch(fd))
  }
}
