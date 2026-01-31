"use client"

import Image from "next/image"
import Link from "next/link"
import { FC, useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"

  return (
    <Link
      className="flex cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
      href="/"
      rel="noopener noreferrer"
    >
      <Image
        src={logoSrc}
        alt="Remrin"
        width={72}
        height={72}
        className="drop-shadow-[0_0_15px_rgba(235,188,186,0.4)]"
      />
    </Link>
  )
}
