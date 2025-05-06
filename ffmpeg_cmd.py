# ffmpeg -i input.mov -pix_fmt rgb8 -r 10 output.gif && gifsicle -O3 output.gif -o output.gif


# ffmpeg -i pdb_smooth.mov -filter_complex "[0:v] fps=30,scale=iw:-1:flags=lanczos,split [a][b];[a] palettegen=stats_mode=full [p];[b][p] paletteuse=dither=sierra2_4a:diff_mode=rectangle" -vsync 0 f-output.gif


##### BEST WAY

###### for 8 sec of mov file
# ffmpeg -i pdb_smooth.mov -filter_complex "[0:v]trim=end=1,setpts=PTS-STARTPTS,settb=AVTB,fps=30[begin]; \
# [0:v]trim=start=1,setpts=PTS-STARTPTS,settb=AVTB,fps=30[main]; \
# [0:v]trim=start=7,setpts=PTS-STARTPTS,settb=AVTB,fps=30[end]; \
# [end][begin]xfade=transition=fade:duration=1:offset=0[xfaded]; \
# [main][xfaded]concat=n=2:v=1:a=0[outv]; \
# [outv]scale=iw:-1:flags=lanczos,split[a][b]; \
# [a]palettegen=stats_mode=full[p]; \
# [b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
# -vsync 0 -loop 0 f-output.gif


###### for 5 sec of mov file with cubic-out easing
# ffmpeg -i pdb_content_arch.mov -filter_complex "[0:v]trim=end=1,setpts=PTS-STARTPTS,settb=AVTB,fps=30[begin]; \
# [0:v]trim=start=1,setpts=PTS-STARTPTS,settb=AVTB,fps=30[main]; \
# [0:v]trim=start=4,setpts=PTS-STARTPTS,settb=AVTB,fps=30[end]; \
# [end][begin]xfade=transition=custom:duration=2:offset=0:expr='st(0,(1-P)^3);A*(1-ld(0))+B*ld(0)'[xfaded]; \
# [main][xfaded]concat=n=2:v=1:a=0[outv]; \
# [outv]scale=iw:-1:flags=lanczos,split[a][b]; \
# [a]palettegen=stats_mode=full[p]; \
# [b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
# -vsync 0 -loop 0 pdb_content_arch.gif



# from moviepy.editor import VideoFileClip

# videoClip = VideoFileClip("your-video.mov")
# videoClip.write_gif("output.gif")
