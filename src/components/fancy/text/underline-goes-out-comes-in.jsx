import { useEffect, useRef, useState, useMemo } from "react"
import { motion, useAnimationControls } from "motion/react"
import { cn } from "@/lib/utils"

const GoesOutComesInUnderline = ({
  children,
  as,
  direction = "left",
  className,
  underlineHeightRatio = 0.1,
  underlinePaddingRatio = 0.01,
  transition = { duration: 0.5, ease: "easeOut" },
  ...props
}) => {
  const controls = useAnimationControls()
  const [blocked, setBlocked] = useState(false)
  const textRef = useRef(null)
  const MotionComponent = useMemo(() => motion.create(as ?? "span"), [as])

  useEffect(() => {
    const updateUnderlineStyles = () => {
      if (textRef.current) {
        const fontSize = parseFloat(getComputedStyle(textRef.current).fontSize)
        textRef.current.style.setProperty("--underline-height", `${fontSize * underlineHeightRatio}px`)
        textRef.current.style.setProperty("--underline-padding", `${fontSize * underlinePaddingRatio}px`)
      }
    }
    updateUnderlineStyles()
    window.addEventListener("resize", updateUnderlineStyles)
    return () => window.removeEventListener("resize", updateUnderlineStyles)
  }, [underlineHeightRatio, underlinePaddingRatio])

  const animate = async () => {
    if (blocked) return
    setBlocked(true)
    await controls.start({
      width: 0,
      transition,
      transitionEnd: {
        left: direction === "left" ? "auto" : 0,
        right: direction === "left" ? 0 : "auto",
      },
    })
    await controls.start({
      width: "100%",
      transition,
      transitionEnd: {
        left: direction === "left" ? 0 : "",
        right: direction === "left" ? "" : 0,
      },
    })
    setBlocked(false)
  }

  return (
    <MotionComponent
      className={cn("relative inline-block cursor-pointer", className)}
      onHoverStart={animate}
      ref={textRef}
      {...props}
    >
      <span>{children}</span>
      <motion.span
        className={cn("absolute bg-current", {
          "left-0": direction === "left",
          "right-0": direction === "right",
        })}
        style={{
          height: "var(--underline-height)",
          bottom: "calc(-1 * var(--underline-padding))",
          width: "100%",
        }}
        animate={controls}
        aria-hidden="true"
      />
    </MotionComponent>
  )
}

export default GoesOutComesInUnderline
