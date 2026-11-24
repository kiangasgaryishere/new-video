"""Build the narration and synchronised paper foley mix from local inputs."""
import json
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt
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
# Sound bridges. Waves precede the ship cut and wash into the balloon shot.
rng = np.random.default_rng(1103)
for start, end, low, high, gain in [(4.85, 8.95, 110, 1450, .055),
                                    (8.19, 11.95, 230, 2100, .027),
                                    (13.51, 16.98, 1500, 3300, .038),
                                    (20.65, 23.10, 100, 1100, .033)]:
    count = round((end-start)*rate)
    t = np.arange(count)/rate
    env = np.clip(t/.45, 0, 1)*np.clip((end-start-t)/.47, 0, 1)
    env *= .58+.42*np.sin(t*2.8)**2
    stereo = sosfilt(butter(2, [low,high], fs=rate, btype='bandpass', output='sos'),
                     rng.normal(size=(count,2)), axis=0)
    bed[round(start*rate):round(start*rate)+count] += stereo*env[:,None]*gain
mix = narration[:,None] + bed
mix *= min(1, .90 / np.max(np.abs(mix)))
sf.write(output, mix, rate, subtype="PCM_24")
