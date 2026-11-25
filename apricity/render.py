"""Render the annotated pen-and-wash page and mix the original narration."""
import argparse
import json
import math
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

from motion import painted_motion

ROOT = Path(__file__).resolve().parent
EDIT = json.loads((ROOT / "edit.json").read_text())
W, H, FPS = 720, 1280, 30
PAPER = (247, 237, 218)
AUDIO_FILTER = "loudnorm=I=-15:TP=-1.5:LRA=6,aresample=48000"
INK = (54, 44, 39)
SEPIA = (93, 67, 48)
RESAMPLE = Image.Resampling
RNG = np.random.default_rng(148)


def smooth(value):
    value = np.clip(value, 0, 1)
    return value * value * (3 - 2 * value)


def noise(size, cells):
    values = RNG.integers(0, 256, cells[::-1], dtype=np.uint8)
    return np.asarray(Image.fromarray(values).resize(size, RESAMPLE.BICUBIC)).astype("float32") / 255


def text_image(text, size, font, color=INK):
    lines = text.splitlines()
    image = Image.new("RGBA", (W, len(lines) * int(size * 1.45) + 10))
    d = ImageDraw.Draw(image)
    for i, line in enumerate(lines):
        direction = "rtl" if any("\u0600" < c < "\u06ff" for c in line) else "ltr"
        has_latin = any(c.isascii() and c.isalpha() for c in line)
        line_font = MIXED if direction == "rtl" and has_latin else font
        f = ImageFont.truetype(line_font, size)
        while d.textlength(line, font=f, direction=direction) > W - 84:
            f = ImageFont.truetype(line_font, f.size - 1)
        d.text((W // 2, int(size * (0.65 + 1.4 * i))), line, font=f,
               anchor="mm", direction=direction, fill=color)
    return image


paper_fibers = noise((W, H), (W, H)) - .5
paper_mottling = noise((W, H), (19, 28)) - .5
paper_grain = paper_fibers * 9 + paper_mottling * 14
page = Image.fromarray(np.uint8(np.clip(np.array(PAPER) + paper_grain[:, :, None], 0, 255)))
# Art fills the portrait composition and frays organically into page reserves.
AW, AH = W, 935
AX, AY = 0, 102
gy, gx = np.mgrid[0:AH, 0:AW].astype("float32")
distance_to_edge = np.minimum.reduce([gx * 1.13, (AW - gx) * 1.13, gy * .57, (AH - gy) * .49])
edge_noise = (noise((AW, AH), (18, 21)) - .5) * 23 + (noise((AW, AH), (130, 140)) - .5) * 15
edge = Image.fromarray(np.uint8(255 * smooth((distance_to_edge + edge_noise - 5) / 30)))
front_noise = (noise((AW, AH), (31, 44)) - .5) * .16 + (noise((AW, AH), (165, 175)) - .5) * .065

MIXED = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FA = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"
EN = "/usr/share/fonts/truetype/dejavu/DejaVuSerifCondensed-Italic.ttf"
subtitle_layers = [
    (start, end, text_image(text, 34 if len(max(text.splitlines(), key=len)) > 36 else 40,
                            FA if any("\u0600" < c < "\u06ff" for c in text) else EN))
    for start, end, text in EDIT["captions"]
]
heading = text_image("Apricity", 97, EN)
noun = text_image("noun  ·  اسم", 37, FA, SEPIA)

assets = {}
for name in {shot["art"] for shot in EDIT["shots"]}:
    art = Image.open(ROOT / "art" / f"{name}.webp").convert("RGB")
    gray = ImageOps.grayscale(art)
    local = np.asarray(gray.filter(ImageFilter.GaussianBlur(3)), dtype="float32")
    tone = np.asarray(gray, dtype="float32")
    stroke = np.clip((local - tone - 4) / 37, 0, 1)
    stroke = Image.fromarray(np.uint8(stroke * 198))
    line = Image.new("RGB", art.size, PAPER)
    line.paste((73, 52, 45), mask=stroke)
    cold = Image.blend(ImageEnhance.Color(art).enhance(.36), Image.new("RGB", art.size, (166, 181, 206)), .20)
    assets[name] = (art, cold, line)


def crop(image, shot, travel):
    def between(values):
        return values[0] + (values[1] - values[0]) * travel

    scale = max(AW / image.width, AH / image.height) * between(shot["zoom"])
    width, height = AW / scale, AH / scale
    cx = np.clip(image.width * between(shot["x"]), width / 2, image.width - width / 2)
    cy = (np.clip(image.height * between(shot["y"]), height / 2, image.height - height / 2)
          if height <= image.height else image.height / 2)
    box = (cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2)
    # At the final wide shot show the full vertical extent of the drawing.
    if width > image.width or height > image.height:
        box = (max(0, box[0]), max(0, box[1]), min(image.width, box[2]), min(image.height, box[3]))
    return image.resize((AW, AH), RESAMPLE.BILINEAR, box=box)


def painted(shot, time, end):
    elapsed = time - shot["t"]
    travel = float(smooth(elapsed / (end - shot["t"])))
    warm, cold, line = assets[shot["art"]]
    warm, cold = crop(warm, shot, travel), crop(cold, shot, travel)
    if 0 <= elapsed < 2.85 and (shot["wet"] or shot["t"] == 0):
        ox, oy = shot["bloom"]
        field = np.hypot((gx / AW - ox) * 1.18, gy / AH - oy) + front_noise
        radius = float(smooth((elapsed - shot["wet"]) / 1.96)) * 1.29 - .10
        amount = smooth((radius - field + .085) / .15)
        wet_rim = np.exp(-((field - radius + .043) / .037) ** 2) * .08
        layer = Image.composite(warm, cold, Image.fromarray(np.uint8(amount * 255)))
        layer = Image.composite(Image.new("RGB", layer.size, (119, 76, 40)), layer,
                                Image.fromarray(np.uint8(wet_rim * 255)))
        if shot["t"] == 0 and elapsed < .87:
            reveal = smooth((elapsed * 2.46 - gx / AW - gy / AH * .38 + front_noise) / .24)
            ink_first = crop(line, shot, travel)
            layer = Image.blend(ink_first, layer, float(smooth((elapsed - .24) / .62)))
            layer = Image.composite(layer, page.crop((AX, AY, AX + AW, AY + AH)),
                                    Image.fromarray(np.uint8(reveal * 255)))
        return layer
    return warm


def soft_paper(image, top, height, strength):
    y = np.arange(height)
    envelope = smooth(np.minimum(y, height - y) / min(height * .41, 83)) * strength
    mask = Image.fromarray(np.uint8(255 * envelope)[:, None]).resize((W, height))
    image.paste(page.crop((0, top, W, top + height)), (0, top), mask)


def letter(page_image, layer, y, progress=1):
    hi = max(0, min(W, int(W * progress)))
    area = layer.crop((0, 0, hi, layer.height))
    page_image.paste(area, (0, y), area)


def frame(time):
    shots = EDIT["shots"]
    idx = max(i for i, shot in enumerate(shots) if shot["t"] <= time)
    shot = shots[idx]
    end = shots[idx + 1]["t"] if idx + 1 < len(shots) else EDIT["duration"]
    elapsed = time - shot["t"]
    drawing = painted_motion(painted(shot, time, end), shot.get("motion"), shot.get("anchor"), elapsed)
    if idx and elapsed < .38 and shot["art"] != shots[idx - 1]["art"]:
        previous = shots[idx - 1]
        prev = painted_motion(painted(previous, shot["t"] - .001, shot["t"]),
                              previous.get("motion"), previous.get("anchor"),
                              shot["t"] - previous["t"] - .001)
        boundary = elapsed / .38 * 1.84 - .36
        wipe = smooth((boundary - gx / AW - .17 * gy / AH + front_noise) / .12)
        drawing = Image.composite(drawing, prev, Image.fromarray(np.uint8(wipe * 255)))
    board = page.copy()
    board.paste(drawing, (AX, AY), edge)

    for start, stop, _ in EDIT["headers"]:
        if start <= time < stop:
            soft_paper(board, 55, 290, .97)
            letter(board, heading, 128, float(smooth((time - start + .23) / .72)))
            d = ImageDraw.Draw(board)
            count = max(1, int(41 * smooth((time - start - .24) / .64)))
            pts = [(208 + i * 7.6, 257 + math.sin(i * .13) * 2.2 + math.sin(i * .66) * .65)
                   for i in range(count)]
            d.line(pts, fill=(166, 114, 56), width=2)
    if EDIT["noun"][0] <= time < EDIT["noun"][1]:
        letter(board, noun, 272, float(smooth((time - EDIT["noun"][0] + .13) / .58)))

    for start, stop, layer in subtitle_layers:
        if start <= time < stop:
            soft_paper(board, 1016, 202, .97)
            letter(board, layer, EDIT["subtitle_center_y"] - layer.height // 2)
            break
    return board


def mix(narration, destination):
    sr = 48000
    audio = subprocess.check_output(["ffmpeg", "-v", "error", "-i", narration, "-f", "f32le",
                                     "-ac", "1", "-ar", str(sr), "-"])
    voice = np.frombuffer(audio, dtype="<f4")
    stereo = np.column_stack((voice, voice)).copy() * .91
    profiles = {"pen": (6, 12), "wash": (37, 0), "air": (94, 0),
                "step": (71, 0), "cloth": (16, 14), "page": (11, 7)}
    for start, kind, duration, level in EDIT["sound"]:
        length = int(duration * sr)
        t = np.linspace(0, 1, length, endpoint=False)
        smooth_width, tremolo = profiles[kind]
        noise = RNG.normal(0, 1, length)
        kernel = np.hanning(smooth_width * 2 + 1)
        texture = np.convolve(noise, kernel / kernel.sum(), mode="same")
        if kind in {"pen", "cloth", "page"}:
            texture += .13 * (noise - np.roll(noise, 2))
        envelope = np.sin(np.pi * t) ** (0.62 if kind == "pen" else 1.5)
        if tremolo:
            envelope *= .67 + .33 * np.sin(t * math.tau * tremolo) ** 2
        if kind == "step":
            envelope *= np.exp(-t * 5)
            texture += .12 * np.sin(t * duration * math.tau * 129)
        signal = texture / max(np.max(np.abs(texture)), .01) * envelope * level
        offset = round(start * sr)
        n = min(length, len(voice) - offset)
        pan = .80 if kind in {"pen", "cloth"} else .91
        stereo[offset:offset+n] += signal[:n, None] * [pan, 1]
    peak = np.max(np.abs(stereo))
    stereo *= min(1.15, .90 / max(.01, peak))
    with wave.open(str(destination), "wb") as out:
        out.setparams((2, 2, sr, 0, "NONE", "not compressed"))
        out.writeframes(np.int16(stereo * 32767).tobytes())


def film(narration, output):
    audio = output.with_suffix(".wav")
    mix(narration, audio)
    command = ["ffmpeg", "-y", "-v", "warning", "-f", "rawvideo", "-pixel_format", "rgb24",
               "-video_size", f"{W}x{H}", "-framerate", str(FPS), "-i", "-", "-i", str(audio),
               "-vf", "scale=1080:1920:flags=lanczos,format=yuv420p",
               "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
               "-threads", "4", "-af", AUDIO_FILTER, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(output)]
    with subprocess.Popen(command, stdin=subprocess.PIPE) as proc:
        for i in range(math.ceil(FPS * EDIT["duration"])):
            proc.stdin.write(frame(i / FPS).tobytes())
            if i % 150 == 0:
                print(f"Rendered {i / FPS:.1f}s", file=sys.stderr)
        proc.stdin.close()
        if proc.wait():
            raise RuntimeError("FFmpeg export failed")
    audio.unlink()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("narration", nargs="?")
    ap.add_argument("output", type=Path)
    ap.add_argument("--still", type=float)
    args = ap.parse_args()
    if args.still is not None:
        frame(args.still).save(args.output)
    else:
        if not args.narration:
            ap.error("narration is required for video exports")
        film(args.narration, args.output)
