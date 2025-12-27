import { LottieLoader } from "@/components/ui/lottie-loader"

export default function Loading() {
  return (
    <div className="bg-rp-base flex size-full flex-col items-center justify-center">
      <LottieLoader size={64} className="text-rp-rose" />
    </div>
  )
}
