import React, { useEffect, useRef, useState, useCallback } from "react"
import { motion, useAnimationControls } from "motion/react";

function DragChild({
  child,
  index,
  zIndex,
  isDragging,
  setIsDragging,
  bringToFront,
  focusedIndex,
  onFocus,
  constraintsRef,
  dragElastic,
  dragMomentum,
  dragTransition,
  dragPropagation,
}) {
  const controls = useAnimationControls();
  const ref = useRef(null);
  const draggedRef = useRef(false);
  const beforeFocusRef = useRef(null);
  const isFocused = focusedIndex === index;
  const somethingFocused = focusedIndex !== null;

  const animateToCenter = useCallback(() => {
    const el = ref.current;
    const container = constraintsRef.current;
    if (!el || !container) return;

    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Save current position before focusing
    beforeFocusRef.current = {
      x: el.style.transform,
    };

    const offsetX = (containerRect.width / 2) - (elRect.left - containerRect.left) - (elRect.width / 2);
    const offsetY = (containerRect.height / 2) - (elRect.top - containerRect.top) - (elRect.height / 2);

    controls.start({
      x: offsetX,
      y: offsetY,
      rotate: 0,
      scale: 2,
      transition: { type: 'spring', stiffness: 500, damping: 80 },
    });
  }, [controls, constraintsRef]);

  const animateBack = useCallback(() => {
    controls.start({
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 500, damping: 80 },
    });
    beforeFocusRef.current = null;
  }, [controls]);

  // React to focus changes
  useEffect(() => {
    if (isFocused) {
      animateToCenter();
    } else if (beforeFocusRef.current !== null) {
      animateBack();
    }
  }, [isFocused, animateToCenter, animateBack]);

  const handlePointerDown = () => {
    draggedRef.current = false;
  };

  const handleDragStart = () => {
    draggedRef.current = true;
    bringToFront(index);
    setIsDragging(true);
    // If focused and user drags, unfocus
    if (isFocused) {
      onFocus(null);
      beforeFocusRef.current = null;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (draggedRef.current) return;
    if (isFocused) {
      onFocus(null);
    } else {
      bringToFront(index);
      onFocus(index);
    }
  };

  return (
    <motion.div
      ref={ref}
      drag={!isFocused}
      dragElastic={dragElastic}
      dragConstraints={constraintsRef}
      dragMomentum={dragMomentum}
      dragTransition={dragTransition}
      dragPropagation={dragPropagation}
      animate={controls}
      style={{
        zIndex: isFocused ? 9999 : zIndex,
        cursor: isDragging ? "grabbing" : "grab",
        ...child.props.style,
      }}
      onPointerDown={handlePointerDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileDrag={{ cursor: "grabbing", scale: 1.05 }}
      className="absolute"
    >
      <motion.div
        animate={{
          opacity: somethingFocused && !isFocused ? 0.2 : 1,
          filter: somethingFocused && !isFocused ? 'blur(6px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.3 }}
      >
        {child}
      </motion.div>
    </motion.div>
  );
}

const DragElements = ({
  children,
  dragElastic = 0.5,
  dragMomentum = true,
  dragTransition = { bounceStiffness: 200, bounceDamping: 300 },
  dragPropagation = true,
  selectedOnTop = true,
  onFocusChange,
  className,
}) => {
  const constraintsRef = useRef(null)
  const [zIndices, setZIndices] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(null)

  const handleFocusChange = useCallback((index) => {
    setFocusedIndex(index);
    onFocusChange?.(index !== null);
  }, [onFocusChange])

  useEffect(() => {
    setZIndices(Array.from({ length: React.Children.count(children) }, (_, i) => i))
  }, [children])

  const bringToFront = useCallback((index) => {
    if (selectedOnTop) {
      setZIndices((prev) => {
        const next = [...prev]
        const pos = next.indexOf(index)
        next.splice(pos, 1)
        next.push(index)
        return next
      })
    }
  }, [selectedOnTop])

  // Click backdrop to unfocus
  const handleBackdropClick = (e) => {
    if (e.target === constraintsRef.current && focusedIndex !== null) {
      handleFocusChange(null);
    }
  };

  return (
    <div
      ref={constraintsRef}
      className={`relative w-full h-full ${className}`}
      onClick={handleBackdropClick}
    >
      {React.Children.map(children, (child, index) => (
        <DragChild
          key={index}
          child={child}
          index={index}
          zIndex={zIndices.indexOf(index)}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          bringToFront={bringToFront}
          focusedIndex={focusedIndex}
          onFocus={handleFocusChange}
          constraintsRef={constraintsRef}
          dragElastic={dragElastic}
          dragMomentum={dragMomentum}
          dragTransition={dragTransition}
          dragPropagation={dragPropagation}
        />
      ))}
    </div>
  );
}

export default DragElements
