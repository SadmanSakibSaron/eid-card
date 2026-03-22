import React, { useEffect, useRef, useState, useCallback } from "react"
import { motion, useAnimationControls, useReducedMotion } from "motion/react";

let initialSpreadDone = false;

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
  isMobile,
}) {
  const controls = useAnimationControls();
  const ref = useRef(null);
  const draggedRef = useRef(false);
  const beforeFocusRef = useRef(null);
  const isFocused = focusedIndex === index;
  const somethingFocused = focusedIndex !== null;
  const prefersReducedMotion = useReducedMotion();

  // Get scatter rotation from data attribute
  const baseRotate = parseFloat(child.props?.['data-rotate']) || 0;
  const enterFromTop = child.props?.['data-enter-from-top'] === 'true';

  const animateToCenter = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    beforeFocusRef.current = true;

    const offsetX = cx - elRect.left - elRect.width / 2;
    const offsetY = cy - elRect.top - elRect.height / 2;

    controls.start({
      x: prefersReducedMotion ? 0 : offsetX,
      y: prefersReducedMotion ? 0 : offsetY,
      rotate: 0,
      scale: isMobile ? 1.15 : 1.6,
      transition: { type: 'spring', duration: 0.4, bounce: 0.12 },
    });
  }, [controls, isMobile, prefersReducedMotion]);

  const animateBack = useCallback(() => {
    controls.start({
      x: 0,
      y: 0,
      rotate: baseRotate,
      scale: 1,
      transition: { type: 'spring', duration: 0.35, bounce: 0 },
    });
    beforeFocusRef.current = null;
  }, [controls, baseRotate]);

  // Entry animations
  useEffect(() => {
    if (enterFromTop) {
      // Newly thrown cards: drop from top
      controls.set({ y: -window.innerHeight, scale: 0.85, opacity: 0 });
      const timer = setTimeout(() => {
        controls.start({
          y: 0,
          scale: 1,
          opacity: 1,
          rotate: baseRotate,
          transition: { type: 'spring', stiffness: 120, damping: 18, mass: 0.8 },
        });
      }, 300);
      return () => clearTimeout(timer);
    } else if (initialSpreadDone) {
      // Cards added after initial load that aren't enterFromTop — just set rotation
      controls.set({ rotate: baseRotate });
    } else {
      // Initial load cards: spread from center (only on first page load)
      requestAnimationFrame(() => { initialSpreadDone = true; });
      const el = ref.current;
      const container = constraintsRef?.current;
      if (!el || !container) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Offset to move card from its natural position to the container center
      const dx = (containerRect.left + containerRect.width / 2) - (elRect.left + elRect.width / 2);
      const dy = (containerRect.top + containerRect.height / 2) - (elRect.top + elRect.height / 2);

      controls.set({ x: dx, y: dy, scale: 1, opacity: 1, rotate: 0 });
      controls.start({
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        rotate: baseRotate,
        transition: {
          type: 'spring',
          stiffness: 80,
          damping: 18,
          mass: 0.8,
          delay: 0.1 + index * 0.04,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      initial={false}
      style={{
        zIndex: isFocused ? 9999 : zIndex,
        cursor: isFocused ? 'zoom-out' : isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        ...child.props.style,
      }}
      onPointerDown={handlePointerDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileHover={!isFocused ? { scale: 1.02, transition: { duration: 0.12 } } : undefined}
      whileDrag={{ cursor: 'grabbing', scale: 1.05, transition: { duration: 0.12 } }}
      className="absolute"
    >
      <motion.div
        animate={{
          opacity: somethingFocused && !isFocused ? 0.2 : 1,
          filter: somethingFocused && !isFocused ? 'blur(6px)' : 'blur(0px)',
          scale: somethingFocused && !isFocused ? 0.97 : 1,
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
  isMobile,
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
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

export default DragElements
