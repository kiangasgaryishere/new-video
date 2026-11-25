"""Local deformation and painted effects for each winter shot."""
import math

from PIL import Image, ImageDraw, ImageFilter

STEP_TIMES = (.72, 1.89)
BREATH_TIMES = (.38, 2.01)


def pulse(age, lifetime):
    if not 0 < age < lifetime:
        return 0
    return math.sin(math.pi * age / lifetime) ** 1.25


def deform(layer, mode, origin, t):
    """Map a small region of the actual painted subject back onto itself."""
    if mode not in {"footfall", "walking", "gust", "touch"}:
        return layer
    width, height = layer.size
    x0, y0 = origin
    if mode == "gust":
        dx = (math.sin(t * 8.5) + .5 * math.sin(t * 15)) * 20
        dy = math.sin(t * 8.5 + .7) * 25
        rx, ry = .205, .135
    elif mode == "footfall":
        dx = sum(pulse(t - s + .27, .47) for s in STEP_TIMES) * 16
        dy = sum(pulse(t - s + .31, .35) for s in STEP_TIMES) * -42
        rx, ry = .17, .19
    elif mode == "walking":
        dx, dy = 14 * math.sin(t * 6), -14 * abs(math.sin(t * 6))
        rx, ry = .17, .21
    else:
        dx = 6 * pulse(t - .18, 1.9)
        dy = 12 * pulse(t - .18, 1.9)
        rx, ry = .22, .13

    def source(x, y):
        w = math.exp(-((x / width - x0) / rx)**2 - ((y / height - y0) / ry)**2)
        w *= min(1, x / 45, (width - x) / 45, y / 45, (height - y) / 45)
        return x - w * dx, y - w * dy

    mesh = []
    for y in range(0, height, 35):
        for x in range(0, width, 35):
            r, b = min(x + 35, width), min(y + 35, height)
            quad = (*source(x, y), *source(x, b), *source(r, b), *source(r, y))
            mesh.append(((x, y, r, b), quad))
    return layer.transform(layer.size, Image.Transform.MESH, mesh, Image.Resampling.BILINEAR)


def painted_motion(layer, mode, origin, t):
    if mode is None:
        return layer
    layer = deform(layer, mode, origin, t)
    width, height = layer.size
    x0, y0 = width * origin[0], height * origin[1]
    fx = Image.new("RGBA", layer.size)
    draw = ImageDraw.Draw(fx)
    if mode == "snow":
        for i in range(44):
            depth = 1 + i % 4
            x = (i * 47 + t * depth * 16 + 10 * math.sin(t + i)) % width
            y = (i * 107 + t * (25 + depth * 11)) % height
            r = .65 + depth * .68
            draw.ellipse((x-r, y-r, x+r, y+r), fill=(255, 250, 239, 75 + depth * 26))
    if mode == "footfall":
        for hit in STEP_TIMES:
            age = t - hit
            if not 0 <= age < .58:
                continue
            for i in range(21):
                rad = i * 2.399
                speed = 63 + i * 10
                x = x0 + 8 * math.cos(rad) + age * speed * math.cos(rad)
                y = y0 + height * .115 - age * speed * abs(math.sin(rad)) + age * age * 220
                r = 1.1 + i % 4 * .77
                draw.ellipse((x-r, y-r, x+r, y+r), fill=(255, 249, 236, int(239 * (1-age/.58))))
    if mode == "breath":
        for hit in BREATH_TIMES:
            for i in range(10):
                age = t - hit - i * .037
                strength = pulse(age, 1.5)
                if not strength:
                    continue
                x = x0 + age * (65 + i * 7)
                y = y0 - age * 52 + 13 * math.cos(i * 3.48) * (1 + age)
                r = 7 + age * 31 + i % 3 * 5
                draw.ellipse((x-r, y-r*.58, x+r, y+r*.58), fill=(255, 247, 230, int(strength * 105)))
        fx = fx.filter(ImageFilter.GaussianBlur(15))
    if mode == "gust":
        for i in range(4):
            age = (t + .32 * i) % 2.05
            strength = pulse(age, 1.6)
            if not strength:
                continue
            pts = []
            for s in range(30):
                f = s / 29
                x = x0 + f * 150 + age * 91
                y = y0 + i * 28 - age * 26 + math.sin(f * 5 + age * 2 + i) * (11 + i * 2)
                pts.append((x, y))
            span = pts[int(9*age):max(int(9*age)+2, int(30*min(1, age/.44)))]
            draw.line(span, fill=(107, 78, 64, int(strength * 164)), width=2)
    if mode in {"sunrise", "walking", "touch", "window", "warmth"}:
        pace = {"sunrise": .52, "walking": .91, "touch": .82, "window": .53, "warmth": .73}[mode]
        age = t * pace - .10
        strength = pulse(age, 1.32)
        if strength:
            if mode == "walking" or mode == "window":
                x = x0 - 150 + age * 248
                draw.polygon([(x-160, 0), (x-32, 0), (x+232, height), (x+72, height)],
                             fill=(249, 193, 104, int(84 * strength)))
            else:
                rx = 55 + age * (211 if mode == "sunrise" else 129)
                ry = 36 + age * 102
                draw.ellipse((x0-rx,y0-ry,x0+rx,y0+ry), fill=(255,201,111,int(108*strength)))
            fx = fx.filter(ImageFilter.GaussianBlur(31))
    if mode == "window" and t > 3.5:
        # Small frost reflections travel down the glass after the wider wash.
        glints = ImageDraw.Draw(fx)
        for i in range(8):
            age = t - 3.5 - .17 * i
            p = pulse(age, 1.8)
            if not p:
                continue
            x = x0 + 32 * math.sin(i * 2.4) + 16 * age
            y = y0 + i * 22 - 55 + 20 * age
            r = 2.4 + i % 3
            color = (255, 231, 179, int(124 * p))
            glints.line([(x-r, y), (x+r, y)], fill=color, width=2)
            glints.line([(x, y-r), (x, y+r)], fill=color, width=2)
    layer.paste(fx, (0, 0), fx)
    return layer
