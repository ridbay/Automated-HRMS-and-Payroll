"""Figure 4.3: cost against request volume, usage-based versus provisioned.

The usage-based line is computed from the Table 4.4 rate card and the
Table 4.5 modelling assumptions, so the figure and the table cannot drift
apart. Run:  python scripts/figures/figure_4_3_cost_curve.py
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.ticker import FuncFormatter

OUT = Path(__file__).resolve().parents[2] / "project" / "figures" / "figure_4_3_cost_curve.png"

# ---- Table 4.4 rate card (Workers Paid plan, verified 7 Oct 2026) ----
SUBSCRIPTION = 5.00
REQ_INCLUDED, REQ_RATE = 10e6, 0.30 / 1e6
CPU_INCLUDED, CPU_RATE = 30e6, 0.02 / 1e6
D1_READ_INCLUDED, D1_READ_RATE = 25e9, 0.001 / 1e6
D1_WRITE_INCLUDED, D1_WRITE_RATE = 50e6, 1.00 / 1e6
D1_STORAGE_INCLUDED_GB, D1_STORAGE_RATE = 5, 0.75
R2_STORAGE_INCLUDED_GB, R2_STORAGE_RATE = 10, 0.015

# ---- Table 4.5 assumptions ----
REQUESTS_PER_EMPLOYEE_MONTH = 40 * 22
CPU_MS_PER_REQUEST = 5
ROWS_READ_PER_REQUEST = 30
ROWS_WRITTEN_PER_REQUEST = 0.15 * 2
R2_GB_PER_EMPLOYEE = 4 * 0.5 / 1000
# Implied by Table 4.5's $2.25 D1 storage charge at 50,000 employees (8 GB).
# State this assumption in Section 4.5.2 alongside the others.
D1_GB_PER_EMPLOYEE = 8 / 50_000
D1_DATABASE_LIMIT_GB = 10

# ---- Provisioned baseline (DigitalOcean list prices, 7 Oct 2026) ----
# 2 GB Basic Droplet $12.00 + single-node managed PostgreSQL $15.15 + Spaces $5.00
PROVISIONED_BASE = 12.00 + 15.15 + 5.00
# Illustrative: a second application Droplet once volume outgrows one instance.
PROVISIONED_STEP_AT = 20e6
PROVISIONED_STEP = 12.00


def usage_cost(requests):
    employees = requests / REQUESTS_PER_EMPLOYEE_MONTH
    over = lambda used, included: np.maximum(0, used - included)
    return (
        SUBSCRIPTION
        + over(requests, REQ_INCLUDED) * REQ_RATE
        + over(requests * CPU_MS_PER_REQUEST, CPU_INCLUDED) * CPU_RATE
        + over(requests * ROWS_READ_PER_REQUEST, D1_READ_INCLUDED) * D1_READ_RATE
        + over(requests * ROWS_WRITTEN_PER_REQUEST, D1_WRITE_INCLUDED) * D1_WRITE_RATE
        + over(employees * D1_GB_PER_EMPLOYEE, D1_STORAGE_INCLUDED_GB) * D1_STORAGE_RATE
        + over(employees * R2_GB_PER_EMPLOYEE, R2_STORAGE_INCLUDED_GB) * R2_STORAGE_RATE
    )


def provisioned_cost(requests):
    return PROVISIONED_BASE + np.where(requests >= PROVISIONED_STEP_AT, PROVISIONED_STEP, 0)


SCENARIOS = [("Small", 0.44e6), ("Medium", 4.4e6), ("Large", 44e6)]

# Palette: categorical slots 1 and 2 of the reference instance; the
# provisioned line is also dashed so the figure survives greyscale printing.
BLUE, ORANGE = "#2a78d6", "#eb6834"
INK, INK_2, GRID = "#0b0b0b", "#52514e", "#e4e3df"


def main():
    for name, r in SCENARIOS:  # sanity-check against Table 4.5
        print(f"{name:<6} {r / 1e6:>6.2f}M requests  ${usage_cost(np.array(r)):.2f}")

    x = np.logspace(5, 8, 600)
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
    fig, ax = plt.subplots(figsize=(7.5, 4.6), dpi=300)

    ax.plot(x, usage_cost(x), color=BLUE, lw=2, label="Usage-based (this system, Cloudflare Workers Paid)")
    ax.step(x, provisioned_cost(x), where="post", color=ORANGE, lw=2, ls=(0, (6, 3)),
            label="Provisioned baseline (VM + managed database + object storage)")

    for name, r in SCENARIOS:
        c = float(usage_cost(np.array(r)))
        ax.plot(r, c, "o", ms=8, color=BLUE, mec="white", mew=2, zorder=5)
        # The large point sits on the steep part of the curve; label it to the right.
        offset, ha = ((12, -4), "left") if name == "Large" else ((0, 12), "center")
        ax.annotate(f"{name}\n${c:.2f}", (r, c), xytext=offset, textcoords="offset points",
                    ha=ha, va="bottom" if ha == "center" else "top", fontsize=9, color=INK)

    ceiling = D1_DATABASE_LIMIT_GB / D1_GB_PER_EMPLOYEE * REQUESTS_PER_EMPLOYEE_MONTH
    ax.axvline(ceiling, color=INK_2, lw=1, ls=":")
    ax.text(ceiling / 1.06, 56, "Single D1 database\nreaches 10 GB limit\n(pool model)",
            fontsize=8.5, color=INK_2, ha="right", va="top")

    ax.set_xscale("log")
    ax.set_xlim(1e5, 1e8)
    ax.set_ylim(0, 66)
    ax.xaxis.set_major_formatter(FuncFormatter(
        lambda v, _: f"{v / 1e6:g}M" if v >= 1e6 else f"{v / 1e3:g}k"))
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"${v:g}"))
    ax.set_xlabel("Monthly API requests (log scale)", color=INK)
    ax.set_ylabel("Monthly platform cost (USD)", color=INK)
    ax.grid(True, which="major", color=GRID, lw=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(INK_2)
    ax.tick_params(colors=INK_2)
    ax.legend(loc="upper left", frameon=False, fontsize=9)

    fig.tight_layout()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT, facecolor="white")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
