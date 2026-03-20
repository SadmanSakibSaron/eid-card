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

  // Get scatter rotation from data attribute
  const baseRotate = parseFloat(child.props?.['data-rotate']) || 0;

  const animateToCenter = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const vpCx = window.innerWidth / 2;
    const vpCy = window.innerHeight / 2;

    beforeFocusRef.current = true;

    const offsetX = vpCx - elRect.left - elRect.width / 2;
    const offsetY = vpCy - elRect.top - elRect.height / 2;

    controls.start({
      x: offsetX,
      y: offsetY,
      rotate: 0,
      scale: 2,
      transition: { type: 'spring', stiffness: 500, damping: 80 },
    });
  }, [controls]);

  const animateBack = useCallback(() => {
    controls.start({
      x: 0,
      y: 0,
      rotate: baseRotate,
      scale: 1,
      transition: { type: 'spring', stiffness: 500, damping: 80 },
    });
    beforeFocusRef.current = null;
  }, [controls, baseRotate]);

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
      initial={{ rotate: baseRotate }}
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

  // Click backdrop to unfocus — anywhere outside a card
  const handleBackdropClick = (e) => {
    if (focusedIndex !== null && e.target === constraintsRef.current) {
      handleFocusChange(null);
    }
  };

  // Also unfocus on any click outside the container (e.g. background layers)
  useEffect(() => {
    if (focusedIndex === null) return;
    const handleGlobalClick = (e) => {
      if (constraintsRef.current && !constraintsRef.current.contains(e.target)) {
        handleFocusChange(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [focusedIndex, handleFocusChange]);

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
