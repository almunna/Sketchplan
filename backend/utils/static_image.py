import matplotlib.pyplot as plt
import matplotlib.patches as patches

# === Setup Figure and Axes ===
fig, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(0, 200)
ax.set_ylim(0, 120)
ax.set_aspect('equal')
ax.axis('off')

# === Title Block ===
title_text = (
    "SKETCH PLAN SHOWING A PLOT OF LAND AT KACHUMEH KOMBO SOUTH DISTRICT\n"
    "WEST COAST REGION FORMERLY OWNED BY: PROPERTIES GAMBIA REAL ESTATE\n"
    "NOW A PORTION TRANSFERRED TO: JUDITH JONES\n"
    "PLOT NO:(12) MEASURED ABOUT 20mx23mx20mx23m"
)
ax.text(100, 115, title_text, fontsize=10, weight='bold', ha='center', va='top')

# === Draw Plot 12 ===
plot12_coords = [(90, 30), (130, 30), (135, 70), (85, 70)]
plot12 = patches.Polygon(plot12_coords, closed=True, edgecolor='blue', facecolor='white', linewidth=2)
ax.add_patch(plot12)
ax.text(110, 50, "12", fontsize=24, weight='bold', color='blue', ha='center', va='center')

# === Draw smaller plots (3 rows × 4 columns) ===
start_x, start_y = 40, 50
w, h = 8, 8
numbers = [
    [5, 9, 11, 13],
    [6, 8, 10, 14],
    [9, 18, 19, 17]
]
for row_idx, row in enumerate(numbers):
    for col_idx, num in enumerate(row):
        x = start_x + col_idx * (w + 2)
        y = start_y - row_idx * (h + 2)
        rect = patches.Rectangle((x, y), w, h, linewidth=1, edgecolor='black', facecolor='white')
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h / 2, str(num), fontsize=8, ha='center', va='center')

# === Existing Estate Block ===
estate = patches.Rectangle((10, 65), 25, 25, linewidth=1, edgecolor='black', facecolor='lightgray')
ax.add_patch(estate)
ax.text(22.5, 77.5, "EXISTING\nESTATE", fontsize=10, ha='center', va='center', weight='bold')

# === Kachumeh Mosque ===
mosque = patches.Rectangle((140, 45), 15, 10, linewidth=1, edgecolor='black', facecolor='lightgray')
ax.add_patch(mosque)
ax.text(147.5, 50, "KACHUMEH\nMOSQUE", fontsize=8, ha='center', va='center')

# === Kachumeh SDA Primary School ===
school = patches.Rectangle((155, 5), 30, 10, linewidth=1, edgecolor='black', facecolor='lightgray')
ax.add_patch(school)
ax.text(170, 10, "KACHUMEH SDA\nPRIMARY SCHOOL", fontsize=8, ha='center', va='center')

# === Visual Road/Grid Lines ===
road_lines = [
    ((0, 90), (200, 90)),
    ((0, 10), (200, 10)),
    ((0, 0), (0, 120)),
    ((200, 0), (200, 120)),
    ((140, 0), (140, 120)),
    ((50, 0), (50, 120)),
]
for (x0, y0), (x1, y1) in road_lines:
    ax.plot([x0, x1], [y0, y1], color='black', linewidth=0.5)

# === North Arrow with Circle ===
arrow_circle = patches.Circle((180, 105), 8, edgecolor='black', facecolor='white', linewidth=2)
ax.add_patch(arrow_circle)
ax.annotate('', xy=(180, 110), xytext=(180, 102),
            arrowprops=dict(facecolor='black', width=3, headwidth=10))
ax.text(180, 100, 'NORTH', ha='center', va='center', fontsize=8, weight='bold')

# === Coordinates Block ===
coord_text = (
    "CO-ORDINATES\n"
    "A = 309014   B = 309034\n"
    "    1463359       1463362\n"
    "C = 309038   D = 309018\n"
    "    1463384       1463381\n\n"
    "Drawn By..\n"
    "C Janneh\n"
    "Tel: 3963771"
)
ax.text(10, 0, coord_text, fontsize=8, ha='left', va='bottom', bbox=dict(facecolor='white', edgecolor='black'))

# === Save the figure ===
plt.tight_layout()
plt.savefig("sketch_plan_final.png", dpi=300)
plt.show()
