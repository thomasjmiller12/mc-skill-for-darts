# Monte Carlo Skill Estimation for Darts

An interactive explainer for the paper *"Monte Carlo Skill Estimation for Darts"* by Thomas Miller & Christopher Archibald (BYU).

**[View the live explainer](https://mc-skill-for-darts.vercel.app)**

## What is this?

A dart player aims at a point on the board, but their throw scatters around the target according to a Gaussian distribution. The spread parameter (sigma) represents their **skill** -- lower sigma means more precise throws. The catch: we can only observe the *score*, not where the dart actually landed. This paper presents a Monte Carlo EM approach to estimate sigma from score data alone.

This site walks through the key ideas with interactive simulations:

- **Throw Simulator** -- Set a target and skill level, throw darts, and see how score information differs from location information
- **EM Convergence** -- Watch the MCEM algorithm iteratively discover the true sigma from scores alone
- **Optimal Target** -- Explore which aiming points preserve the most information for skill estimation
- **Adaptive Method** -- See how switching targets mid-estimation cuts the required darts in half

All computation runs client-side in the browser.

## Tech stack

Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, D3.js, KaTeX, HTML Canvas

## Development

```bash
npm install
npm run dev
```

## Pre-computation scripts (optional)

Python scripts in `scripts/` generate higher-quality pre-computed data for static visualizations:

```bash
pip install numpy
python scripts/generate_dartboard.py     # Fast -- dartboard geometry
python scripts/generate_entropy.py       # ~10 min -- entropy heatmaps
python scripts/generate_convergence.py   # ~30 min -- convergence curves
```

## Paper

The full paper is available at [`/paper.pdf`](https://mc-skill-for-darts.vercel.app/paper.pdf).
