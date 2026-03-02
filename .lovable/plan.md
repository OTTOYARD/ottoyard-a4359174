

## Plan: Front-Facing Initial View

The camera is at `[3.2, 1.8, 5.5]` which places it behind/to the side of the model. The model's front (hood) faces along one axis in the GLB, and the current camera angle shows the rear first.

Two changes needed:

1. **Rotate the model 180°** on the Y-axis in the `useEffect` that positions the `clonedScene`, so the hood faces the camera on load. Add `clonedScene.rotation.y = Math.PI;` after setting position.

2. **No change to OrbitControls** — auto-rotate will continue smoothly from the new front-facing starting orientation.

This is a one-line addition in `TeslaModel3GLB`'s positioning `useEffect` (around line 105).

