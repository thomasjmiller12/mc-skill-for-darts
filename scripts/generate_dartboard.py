#!/usr/bin/env python3
"""Generate dartboard geometry JSON for SVG rendering and hit-testing."""

import json
import math
import os

# Standard dartboard dimensions (mm from center)
DOUBLE_OUTER = 170
DOUBLE_INNER = 162
TRIPLE_OUTER = 107
TRIPLE_INNER = 99
OUTER_BULL = 15.9
INNER_BULL = 6.35

WEDGE_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
WEDGE_ANGLE = 2 * math.pi / 20

def arc_points(start_angle, end_angle, radius, num_points=20):
    """Generate points along an arc."""
    points = []
    for i in range(num_points + 1):
        angle = start_angle + (end_angle - start_angle) * i / num_points
        x = radius * math.sin(angle)
        y = radius * math.cos(angle)
        points.append([round(x, 3), round(y, 3)])
    return points

def generate_ring_region(wedge_idx, inner_r, outer_r):
    """Generate polygon for a ring segment."""
    start_angle = wedge_idx * WEDGE_ANGLE - WEDGE_ANGLE / 2
    end_angle = start_angle + WEDGE_ANGLE

    outer_pts = arc_points(start_angle, end_angle, outer_r)
    inner_pts = arc_points(end_angle, start_angle, inner_r)

    return outer_pts + inner_pts

def main():
    regions = []

    # Wedge-based regions
    rings = [
        ("double", DOUBLE_INNER, DOUBLE_OUTER, 2),
        ("single_outer", TRIPLE_OUTER, DOUBLE_INNER, 1),
        ("triple", TRIPLE_INNER, TRIPLE_OUTER, 3),
        ("single_inner", OUTER_BULL, TRIPLE_INNER, 1),
    ]

    for ring_type, inner_r, outer_r, multiplier in rings:
        for i, wedge_score in enumerate(WEDGE_ORDER):
            polygon = generate_ring_region(i, inner_r, outer_r)
            regions.append({
                "type": ring_type,
                "wedge": wedge_score,
                "score": wedge_score * multiplier,
                "multiplier": multiplier,
                "polygon": polygon,
            })

    # Bulls
    regions.append({
        "type": "outer_bull",
        "wedge": None,
        "score": 25,
        "multiplier": 1,
        "polygon": arc_points(0, 2 * math.pi, OUTER_BULL, 40),
    })
    regions.append({
        "type": "inner_bull",
        "wedge": None,
        "score": 50,
        "multiplier": 1,
        "polygon": arc_points(0, 2 * math.pi, INNER_BULL, 40),
    })

    output = {
        "dimensions": {
            "double_outer": DOUBLE_OUTER,
            "double_inner": DOUBLE_INNER,
            "triple_outer": TRIPLE_OUTER,
            "triple_inner": TRIPLE_INNER,
            "outer_bull": OUTER_BULL,
            "inner_bull": INNER_BULL,
        },
        "wedge_order": WEDGE_ORDER,
        "regions": regions,
    }

    os.makedirs("public/data", exist_ok=True)
    with open("public/data/dartboard-geometry.json", "w") as f:
        json.dump(output, f, separators=(",", ":"))

    print(f"Generated {len(regions)} regions -> public/data/dartboard-geometry.json")

if __name__ == "__main__":
    main()
