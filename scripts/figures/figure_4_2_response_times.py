"""Figure 4.2: cold-start and warm-path response times by operation category.

Reads the JSON written by scripts/measure-response-times.mjs:
    python scripts/figures/figure_4_2_response_times.py scripts/results/response-times-<run>.json [out.png]

Drawn as a dot-and-range chart on a log axis rather than grouped bars: the
assistant query is two orders of magnitude slower than everything else, which
would flatten every other bar to nothing on a linear scale, and bars must
start at zero so they cannot use a log axis.
"""

import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.ticker import FuncFormatter, NullFormatter

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "project" / "figures" / "figure_4_2_response_times.png"

BLUE, ORANGE = "#2a78d6", "#eb6834"
INK, INK_2, GRID = "#0b0b0b", "#52514e", "#e4e3df"

GROUPS = [("Interactive operations", lambda c: not c.startswith("Batch")),
          ("Batch computation", lambda c: c.startswith("Batch"))]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    data = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT
    rows = data["results"]

    # Order top-to-bottom: interactive group, then batch group.
    ordered, separators, headers = [], [], []
    for title, belongs in GROUPS:
        members = [r for r in rows if belongs(r["category"])]
        if not members:
            continue
        if ordered:
            separators.append(len(ordered) - 0.5)
        headers.append((len(ordered), title))
        ordered.extend(members)

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
    fig, ax = plt.subplots(figsize=(7.5, 0.42 * len(ordered) + 1.6), dpi=300)

    for y, r in enumerate(ordered):
        if r["warmP50"] is not None:
            ax.plot([r["warmP50"], r["warmP95"]], [y, y], color=BLUE, lw=2, solid_capstyle="round", zorder=2)
            ax.plot(r["warmP50"], y, "o", ms=8, color=BLUE, mec="white", mew=2, zorder=3)
            ax.plot(r["warmP95"], y, "|", ms=10, mew=2, color=BLUE, zorder=3)
        cold_unverified = r.get("coldIsolateRequest") not in (None, 1)
        ax.plot(r["coldMs"], y, "D", ms=7, zorder=4,
                color="white" if cold_unverified else ORANGE, mec=ORANGE, mew=2)

    ax.set_yticks(range(len(ordered)))
    ax.set_yticklabels([r["operation"] for r in ordered], color=INK)
    ax.invert_yaxis()
    for s in separators:
        ax.axhline(s, color=INK_2, lw=1)
    for start, title in headers:
        ax.annotate(title, xy=(1, start - 0.5), xycoords=("axes fraction", "data"),
                    ha="right", va="bottom", fontsize=8.5, color=INK_2, style="italic")

    ax.set_xscale("log")
    # Explicit ticks: the data spans about one decade, where matplotlib's
    # default log ticks fall back to overlapping scientific notation.
    ticks = [t for t in (100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000)
             if ax.get_xlim()[0] <= t <= ax.get_xlim()[1]]
    ax.set_xticks(ticks)
    ax.xaxis.set_minor_formatter(NullFormatter())
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v / 1000:g} s"))

    # The usability threshold Section 4.5.1 judges NFR2 against.
    ax.axvline(1000, color=INK_2, lw=1, ls=(0, (4, 3)), zorder=1)
    ax.annotate("1 s threshold\n(Nielsen, 1993)", xy=(1000, 1), xycoords=("data", "axes fraction"),
                xytext=(4, -2), textcoords="offset points", ha="left", va="top", fontsize=8.5, color=INK_2)
    ax.set_xlabel("Client-observed response time (log scale)", color=INK)
    ax.grid(True, axis="x", which="major", color=GRID, lw=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(INK_2)
    ax.tick_params(axis="x", colors=INK_2)
    ax.tick_params(axis="y", length=0)

    legend = [
        Line2D([], [], marker="D", ls="", ms=7, color=ORANGE, mec=ORANGE, mew=2, label="Cold start (first request after idle)"),
        Line2D([], [], marker="o", ls="-", lw=2, ms=8, color=BLUE, mec="white", mew=2, label="Warm p50, line to warm p95"),
    ]
    if any(r.get("coldIsolateRequest") not in (None, 1) for r in ordered):
        legend.append(Line2D([], [], marker="D", ls="", ms=7, color="white", mec=ORANGE, mew=2,
                             label="Cold sample not confirmed on a fresh isolate"))
    ax.legend(handles=legend, loc="upper center", bbox_to_anchor=(0.5, -0.16 if len(ordered) > 6 else -0.3),
              ncol=1, frameon=False, fontsize=9)

    fig.tight_layout()
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor="white", bbox_inches="tight")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
