'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

interface FaviconImageProps {
  src?: string
  alt?: string
  size?: number
  className?: string
}

export function FaviconImage({ src, alt = '', size = 16, className = '' }: FaviconImageProps) {
  const [error, setError] = useState(false)
  const sizeClass = `h-[${size}px] w-[${size}px]`
  
  if (!src || error) {
    return (
      <Globe className={`${sizeClass} text-gray-400 ${className}`} />
    )
  }
  
  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`${sizeClass} object-contain`}
        onError={() => {
          setError(true)
        }}
        loading="lazy"
      />
    </div>
  )
}