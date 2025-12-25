"use client"

import Image from "next/image"
import Link from "next/link"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer items-center justify-center hover:opacity-80 transition-opacity"
      href="/"
      rel="noopener noreferrer"
    >
      <Image
        src="/logo.svg"
        alt="Remrin"
        width={72}
        height={72}
        className="drop-shadow-[0_0_15px_rgba(235,188,186,0.4)]"
      />
    </Link>
  )
}
