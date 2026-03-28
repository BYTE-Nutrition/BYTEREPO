import { useContext } from 'react'
import { ByteContext } from './byte-context'

export function useByte() {
  const ctx = useContext(ByteContext)
  if (!ctx) throw new Error('useByte must be used within ByteProvider')
  return ctx
}
