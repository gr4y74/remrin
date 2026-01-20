"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TouchCarouselProps {
    children: React.ReactNode[]
    className?: string
    itemClassName?: string
    showArrows?: boolean
    showDots?: boolean
}

export function TouchCarousel({
    children,
    className,
    itemClassName,
    showArrows = true,
    showDots = true,
}: TouchCarouselProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [canScrollLeft, setCanScrollLeft] = React.useState(false)
    const [canScrollRight, setCanScrollRight] = React.useState(true)

    const checkScroll = React.useCallback(() => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)

        // Update index based on scroll position
        const index = Math.round(scrollLeft / clientWidth)
        setCurrentIndex(index)
    }, [])

    React.useEffect(() => {
        const scrollNode = scrollRef.current
        if (scrollNode) {
            scrollNode.addEventListener("scroll", checkScroll)
            checkScroll()
            return () => scrollNode.removeEventListener("scroll", checkScroll)
        }
    }, [checkScroll])

    const scrollTo = (index: number) => {
        if (!scrollRef.current) return
        const { clientWidth } = scrollRef.current
        scrollRef.current.scrollTo({
            left: index * clientWidth,
            behavior: "smooth",
        })
    }

    const scrollPrev = () => scrollTo(currentIndex - 1)
    const scrollNext = () => scrollTo(currentIndex + 1)

    return (
        <div className={cn("group relative w-full", className)}>
            <div
                ref={scrollRef}
                className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {children.map((child, index) => (
                    <div
                        key={index}
                        className={cn("w-full shrink-0 snap-center snap-always", itemClassName)}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {showArrows && children.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-rp-surface/80 shadow-md backdrop-blur-sm sm:flex",
                            !canScrollLeft && "pointer-events-none opacity-0"
                        )}
                        onClick={scrollPrev}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-rp-surface/80 shadow-md backdrop-blur-sm sm:flex",
                            !canScrollRight && "pointer-events-none opacity-0"
                        )}
                        onClick={scrollNext}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </>
            )}

            {showDots && children.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                "h-2 w-2 rounded-full transition-all duration-300",
                                currentIndex === index
                                    ? "w-4 bg-rp-iris"
                                    : "bg-rp-muted/40 hover:bg-rp-muted/60"
                            )}
                            onClick={() => scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
