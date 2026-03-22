# Eid Mubarak - Interactive Wish Card

An interactive Eid greeting card app built with React, Vite, and Framer Motion. Users can write wishes on postcards with procedurally generated tessellated patterns, then flick them into the world.

## Features

- Draggable wish cards with tilt/shine effects
- Procedurally generated Islamic geometric patterns (seeded PRNG)
- Flick-to-send gesture with spring physics
- Responsive layout with mobile support

## Patterns

The tessellated card patterns include:

- **Truchet** - Quarter-arc tile compositions
- **Diagonal** - Crossed diagonal line fields
- **Concentric** - Nested geometric shapes (circles, squares, diamonds)
- **Crosshatch** - Overlapping hatch line grids
- **8-Zohreh** - 8-pointed star rosette with interlace and inner octagon
- **8-Sili** - Star-and-bracelet interlocking pattern with kite petals and weave crossings

The 8-Zohreh and 8-Sili patterns are based on the classification and construction methods described in:

> Kaplan, C.S. (2000). **Computer Generated Islamic Star Patterns.** In: *Bridges 2000: Mathematical Connections in Art, Music, and Science.* Springer. [https://link.springer.com/chapter/10.1007/978-3-540-89796-5_91](https://link.springer.com/chapter/10.1007/978-3-540-89796-5_91)

## Setup

```bash
npm install
npm run dev
```

## Tech Stack

- React + Vite
- Framer Motion
- Tailwind CSS
- Canvas 2D for pattern rendering
