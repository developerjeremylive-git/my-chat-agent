'use client'

import { useEffect, useState } from 'react'

interface CharacterCounterProps {
  input: string
}

export function CharacterCounter({ input }: CharacterCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(input.length)
  }, [input])

  return (
    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
      {count.toLocaleString()} chars
    </span>
  )
}