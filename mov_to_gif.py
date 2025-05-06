import os
import subprocess
import argparse

def mov_to_gif(input_mov, output_gif, fps=10, width=None, start=None, duration=None, loop=0):
    """
    Convert a .mov video to a GIF using a two-pass ffmpeg palette approach for best quality.

    Args:
        input_mov: Path to input .mov file
        output_gif: Path for output .gif file
        fps: Frames per second in the GIF
        width: Target width in pixels (height auto-scaled). If None, original width is used.
        start: Start time in seconds (float) to begin clip. If None, starts at 0.
        duration: Duration in seconds (float) of clip. If None, uses full length.
        loop: Number of times GIF should loop (0=infinite)
    """
    # Build palette file name
    palette = os.path.splitext(output_gif)[0] + '_palette.png'

    # Prepare filters
    scale_filter = f"scale={width}:-1:flags=lanczos" if width else "scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos"
    palettegen = f"fps={fps},{scale_filter},palettegen"
    paletteuse = f"fps={fps},{scale_filter}[x];[x][1:v]paletteuse"

    # First pass: generate palette
    cmd1 = ['ffmpeg', '-y']
    if start is not None:
        cmd1 += ['-ss', str(start)]
    if duration is not None:
        cmd1 += ['-t', str(duration)]
    cmd1 += ['-i', input_mov, '-vf', palettegen, palette]

    # Run first pass
    subprocess.run(cmd1, check=True)

    # Second pass: create GIF
    cmd2 = ['ffmpeg', '-y']
    if start is not None:
        cmd2 += ['-ss', str(start)]
    if duration is not None:
        cmd2 += ['-t', str(duration)]
    cmd2 += ['-i', input_mov, '-i', palette, '-filter_complex', paletteuse,
             '-loop', str(loop), output_gif]

    subprocess.run(cmd2, check=True)
    print(f"GIF created at {output_gif}")

    # Cleanup
    if os.path.exists(palette):
        os.remove(palette)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert MOV to GIF')
    parser.add_argument('input_mov', help='Input .mov file path')
    parser.add_argument('output_gif', help='Output .gif file path')
    parser.add_argument('--fps', type=int, default=10, help='Frames per second for the GIF')
    parser.add_argument('--width', type=int, help='Target width in pixels (height auto-scaled)')
    parser.add_argument('--start', type=float, help='Start time in seconds')
    parser.add_argument('--duration', type=float, help='Duration in seconds')
    parser.add_argument('--loop', type=int, default=0, help='Number of times to loop the GIF (0 for infinite)')

    args = parser.parse_args()
    mov_to_gif(
        args.input_mov,
        args.output_gif,
        fps=args.fps,
        width=args.width,
        start=args.start,
        duration=args.duration,
        loop=args.loop
    ) 