"""Generate a quiet pencil bed from the preview's drawing cues."""
import sys

import numpy as np
import soundfile
from scipy.signal import butter, sosfilt

rate = 48_000
mix = np.zeros(round(rate * 59.428571))
random = np.random.default_rng(741)
cues = [(0.04,.62), (1.34,.66), (2.12,.9), (3.48,.65), (4.06,.84),
        (4.85,.47), (5.2,.62), (6.61,1.56), (8.22,.75), (9.0,.9), (10.36,.95), (12.51,.98), (14.28,1.23),
        (18.05,1.0), (21.05,1.23), (21.91,1.15), (26.31,1.2),
        (30.02,.78), (32.57,1.2), (34.85,1.35), (35.71,.58),
        (37.75,1.2), (42.0,1.08), (50.15,1.25), (53.7,1.55),
        (55.4,1.2), (56.65,.52)]
for start, duration in cues:
    first = round(start * rate)
    count = round(duration * rate)
    t = np.arange(count) / rate
    texture = sosfilt(butter(2, [2200, 5700], "bandpass", fs=rate, output="sos"),
                      random.normal(size=count))
    envelope = np.clip(np.minimum(t, duration-t) / .065, 0, 1)
    envelope *= .52 + .48 * np.sin(2 * np.pi * 11 * t)**2
    mix[first:first+count] += .008 * envelope * texture
soundfile.write(sys.argv[1], mix, rate)
