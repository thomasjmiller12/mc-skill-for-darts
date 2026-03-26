#!/usr/bin/env python3
"""Generate convergence simulation data for Center / Triple 11 / Adaptive methods."""

import json
import math
import os
import numpy as np

# Dartboard dimensions
DOUBLE_OUTER = 170
DOUBLE_INNER = 162
TRIPLE_OUTER = 107
TRIPLE_INNER = 99
OUTER_BULL = 15.9
INNER_BULL = 6.35
WEDGE_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
WEDGE_ANGLE = 2 * math.pi / 20

# Triple 11 center
T11_IDX = WEDGE_ORDER.index(11)
T11_ANGLE = T11_IDX * WEDGE_ANGLE
T11_R = (TRIPLE_INNER + TRIPLE_OUTER) / 2
T11_X = T11_R * math.sin(T11_ANGLE)
T11_Y = T11_R * math.cos(T11_ANGLE)

def get_score(x, y):
    r = math.sqrt(x * x + y * y)
    if r > DOUBLE_OUTER:
        return 0
    if r <= INNER_BULL:
        return 50
    if r <= OUTER_BULL:
        return 25
    angle = math.atan2(x, y)
    if angle < 0:
        angle += 2 * math.pi
    wedge_idx = int((angle + WEDGE_ANGLE / 2) / WEDGE_ANGLE) % 20
    wedge_score = WEDGE_ORDER[wedge_idx]
    if r <= TRIPLE_INNER:
        return wedge_score
    elif r <= TRIPLE_OUTER:
        return wedge_score * 3
    elif r <= DOUBLE_INNER:
        return wedge_score
    else:
        return wedge_score * 2

def mcem_step(observed_scores, mu_x, mu_y, current_sigma, num_mc=5000):
    """Run one MCEM iteration."""
    samples_x = np.random.normal(mu_x, current_sigma, num_mc)
    samples_y = np.random.normal(mu_y, current_sigma, num_mc)
    sample_scores = np.array([get_score(x, y) for x, y in zip(samples_x, samples_y)])
    sq_dists = (samples_x - mu_x) ** 2 + (samples_y - mu_y) ** 2

    total_expected = 0.0
    for obs_score in observed_scores:
        mask = sample_scores == obs_score
        if mask.sum() > 0:
            total_expected += sq_dists[mask].mean()
        else:
            total_expected += 2 * current_sigma ** 2

    new_sigma_sq = total_expected / (2 * len(observed_scores))
    return math.sqrt(max(new_sigma_sq, 1.0))

def simulate_method(true_sigma, mu_x, mu_y, max_darts=60, dart_step=3, num_em_iters=10):
    """Simulate estimation using MCEM, returning sigma estimates after each batch of darts."""
    throws_x = np.random.normal(mu_x, true_sigma, max_darts)
    throws_y = np.random.normal(mu_y, true_sigma, max_darts)
    all_scores = [get_score(x, y) for x, y in zip(throws_x, throws_y)]

    estimates = []
    for n_darts in range(dart_step, max_darts + 1, dart_step):
        scores = all_scores[:n_darts]
        sigma_est = 50.0  # initial guess
        for _ in range(num_em_iters):
            sigma_est = mcem_step(scores, mu_x, mu_y, sigma_est)
        error_pct = abs(sigma_est - true_sigma) / true_sigma * 100
        estimates.append({"darts": n_darts, "error": round(error_pct, 2)})

    return estimates

def simulate_adaptive(true_sigma, max_darts=60, dart_step=3, num_em_iters=10):
    """Simulate adaptive method: start at center, switch to T11 if sigma in [14, 74]."""
    mu_x, mu_y = 0.0, 0.0
    all_throws = []
    estimates = []

    for n_darts in range(dart_step, max_darts + 1, dart_step):
        # Generate new batch of throws at current target
        for _ in range(dart_step):
            x = np.random.normal(mu_x, true_sigma)
            y = np.random.normal(mu_y, true_sigma)
            all_throws.append((get_score(x, y), mu_x, mu_y))

        # Run MCEM on all throws so far (simplified: use current target for all)
        scores = [t[0] for t in all_throws]
        sigma_est = 50.0
        for _ in range(num_em_iters):
            sigma_est = mcem_step(scores, mu_x, mu_y, sigma_est)

        # Adaptive switch
        if 14 <= sigma_est <= 74:
            mu_x, mu_y = T11_X, T11_Y
        else:
            mu_x, mu_y = 0.0, 0.0

        error_pct = abs(sigma_est - true_sigma) / true_sigma * 100
        estimates.append({"darts": n_darts, "error": round(error_pct, 2)})

    return estimates

def main():
    skill_levels = list(range(10, 141, 3))  # ~45 levels
    num_reps = 50  # Reduced from 100 for speed
    max_darts = 60
    dart_step = 3

    results = {}

    for sigma in skill_levels:
        print(f"Simulating sigma={sigma}...")

        center_errors = []
        t11_errors = []
        adaptive_errors = []

        for rep in range(num_reps):
            center_errors.append(simulate_method(sigma, 0, 0, max_darts, dart_step))
            t11_errors.append(simulate_method(sigma, T11_X, T11_Y, max_darts, dart_step))
            adaptive_errors.append(simulate_adaptive(sigma, max_darts, dart_step))

        # Average across repetitions
        num_points = len(center_errors[0])
        center_mean = []
        t11_mean = []
        adaptive_mean = []

        for i in range(num_points):
            darts = center_errors[0][i]["darts"]

            c_vals = [rep[i]["error"] for rep in center_errors]
            t_vals = [rep[i]["error"] for rep in t11_errors]
            a_vals = [rep[i]["error"] for rep in adaptive_errors]

            center_mean.append({
                "darts": darts,
                "mean": round(np.mean(c_vals), 2),
                "p25": round(np.percentile(c_vals, 25), 2),
                "p75": round(np.percentile(c_vals, 75), 2),
            })
            t11_mean.append({
                "darts": darts,
                "mean": round(np.mean(t_vals), 2),
                "p25": round(np.percentile(t_vals, 25), 2),
                "p75": round(np.percentile(t_vals, 75), 2),
            })
            adaptive_mean.append({
                "darts": darts,
                "mean": round(np.mean(a_vals), 2),
                "p25": round(np.percentile(a_vals, 25), 2),
                "p75": round(np.percentile(a_vals, 75), 2),
            })

        results[str(sigma)] = {
            "center": center_mean,
            "triple11": t11_mean,
            "adaptive": adaptive_mean,
        }

    output = {
        "skill_levels": skill_levels,
        "num_repetitions": num_reps,
        "max_darts": max_darts,
        "dart_step": dart_step,
        "results": results,
    }

    os.makedirs("public/data", exist_ok=True)
    with open("public/data/convergence-data.json", "w") as f:
        json.dump(output, f, separators=(",", ":"))

    print("Generated convergence data -> public/data/convergence-data.json")

if __name__ == "__main__":
    main()
