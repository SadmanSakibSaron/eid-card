import React, { useEffect, useRef, useState } from "react"
import { motion } from "motion/react";

const DragElements = ({
  children,
  dragElastic = 0.5,
  dragConstraints,
  dragMomentum = true,
  dragTransition = { bounceStiffness: 200, bounceDamping: 300 },
  dragPropagation = true,
  selectedOnTop = true,
  className,
}) => {
  const constraintsRef = useRef(null)
  const [zIndices, setZIndices] = useState([])

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setZIndices(Array.from({ length: React.Children.count(children) }, (_, i) => i))
  }, [children])

  const bringToFront = (index) => {
    if (selectedOnTop) {
      setZIndices((prevIndices) => {
        const newIndices = [...prevIndices]
        const currentIndex = newIndices.indexOf(index)
        newIndices.splice(currentIndex, 1)
        newIndices.push(index)
        return newIndices
      })
    }
  }

  return (
    <div ref={constraintsRef} className={`relative w-full h-full ${className}`}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          drag
          dragElastic={dragElastic}
          dragConstraints={dragConstraints || constraintsRef}
          dragMomentum={dragMomentum}
          dragTransition={dragTransition}
          dragPropagation={dragPropagation}
          style={{
            zIndex: zIndices.indexOf(index),

            cursor: isDragging ? "grabbing" : "grab",
          }}
          onDragStart={() => {
            bringToFront(index)
            setIsDragging(true)
          }}
          onDragEnd={() => setIsDragging(false)}
          whileDrag={{ cursor: "grabbing" }}
          className={"absolute"}>
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export default DragElements
