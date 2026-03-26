#!/usr/bin/env python3
"""Generate entropy heatmap data for various sigma values."""

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

def get_score(x, y):
    """Determine score for a point at (x, y) mm from center."""
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

def expected_entropy(mu_x, mu_y, sigma, num_samples=10000, num_bins=20):
    """Compute expected entropy E(mu, sigma)."""
    # Generate samples
    samples_x = np.random.normal(mu_x, sigma, num_samples)
    samples_y = np.random.normal(mu_y, sigma, num_samples)

    # Compute scores and distances
    scores = np.array([get_score(x, y) for x, y in zip(samples_x, samples_y)])
    distances = np.sqrt((samples_x - mu_x) ** 2 + (samples_y - mu_y) ** 2)

    # Group by score
    unique_scores, score_counts = np.unique(scores, return_counts=True)

    total_entropy = 0.0
    for s, count in zip(unique_scores, score_counts):
        prob_s = count / num_samples
        mask = scores == s
        dists = distances[mask]

        if len(dists) < 2:
            continue

        # Histogram entropy
        max_dist = dists.max()
        if max_dist == 0:
            continue
        bin_width = max_dist / num_bins
        bins = np.floor(dists / bin_width).astype(int)
        bins = np.minimum(bins, num_bins - 1)
        bin_counts = np.bincount(bins, minlength=num_bins)
        probs = bin_counts[bin_counts > 0] / len(dists)
        entropy = -np.sum(probs * np.log2(probs))

        total_entropy += entropy * prob_s

    return total_entropy

def main():
    sigma_values = [10, 25, 40, 55, 70, 85, 100, 120, 140, 170]
    grid_size = 25
    extent = 170
    num_samples = 5000

    results = {}

    for sigma in sigma_values:
        print(f"Computing entropy heatmap for sigma={sigma}...")
        grid = []
        min_entropy = float("inf")
        min_point = [0, 0]

        step = (2 * extent) / (grid_size - 1)

        for i in range(grid_size):
            row = []
            y = extent - i * step
            for j in range(grid_size):
                x = -extent + j * step
                r = math.sqrt(x * x + y * y)

                if r > extent * 1.1:
                    row.append(0)
                    continue

                e = expected_entropy(x, y, sigma, num_samples)
                row.append(round(e, 4))

                if r <= extent and e < min_entropy and e > 0:
                    min_entropy = e
                    min_point = [round(x, 1), round(y, 1)]

            grid.append(row)

        results[str(sigma)] = {
            "grid": grid,
            "min_entropy": round(min_entropy, 4),
            "optimal_point": min_point,
        }

    output = {
        "sigma_values": sigma_values,
        "grid_size": grid_size,
        "extent": extent,
        "heatmaps": results,
    }

    os.makedirs("public/data", exist_ok=True)
    with open("public/data/entropy-heatmap.json", "w") as f:
        json.dump(output, f, separators=(",", ":"))

    print("Generated entropy heatmaps -> public/data/entropy-heatmap.json")

if __name__ == "__main__":
    main()
