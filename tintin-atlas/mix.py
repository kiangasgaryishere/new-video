"""Build the narration and synchronised paper foley mix from local inputs."""
import json
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from math import gcd

voice, kit, output = map(Path, sys.argv[1:])
rate = 48000
narration, sr = sf.read(voice)
assert sr == rate and narration.ndim == 1
bed = np.zeros((len(narration), 2))
for i, (at, name, gain) in enumerate(json.loads(Path(__file__).with_name("sound.json").read_text())):
    data, sr = sf.read(kit / (name + ".wav"), always_2d=True)
    mono = data.mean(axis=1)
    if sr != rate:
        div = gcd(sr, rate)
        mono = resample_poly(mono, rate // div, sr // div)
    length = min(len(mono), int(1.45 * rate), len(bed) - round(at * rate))
    fx = mono[:length].copy()
    fx *= gain / max(.0001, np.max(np.abs(fx)))
    fade = min(length, 1800)
    fx[-fade:] *= np.linspace(1, 0, fade)
    pan = .18 * np.sin(i * 2)
    bed[round(at * rate):round(at * rate)+length] += fx[:,None] * np.array([1-pan, 1+pan])
mix = narration[:,None] + bed
mix *= min(1, .90 / np.max(np.abs(mix)))
sf.write(output, mix, rate, subtype="PCM_24")
