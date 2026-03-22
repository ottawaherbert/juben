import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Scene, Shot, AudioTrack } from '../types/project';

let ffmpeg: FFmpeg | null = null;

export const initFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  // Load ffmpeg core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const synthesizeEpisode = async (
  scenes: Scene[],
  onProgress?: (progress: number) => void
): Promise<string> => {
  const ff = await initFFmpeg();
  
  if (onProgress) {
    ff.on('progress', ({ progress }) => {
      onProgress(progress);
    });
  }

  const inputFiles: string[] = [];
  
  // Process each scene
  for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
    const scene = scenes[sIdx];
    const shots = scene.shots || [];
    const audioTracks = scene.audioTracks || [];
    
    // Process each shot
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const duration = shot.duration || 5;
      const shotVideoName = `scene_${sIdx}_shot_${i}.mp4`;
      
      // Determine video filters
      const vFilters = ['scale=1280:720:force_original_aspect_ratio=decrease', 'pad=1280:720:(ow-iw)/2:(oh-ih)/2', 'setsar=1'];
      
      if (shot.transition === 'fade' || shot.transition === 'black') {
        vFilters.push(`fade=t=in:st=0:d=0.5`);
        vFilters.push(`fade=t=out:st=${duration - 0.5}:d=0.5`);
      }

      const vFilterStr = vFilters.join(',');

      // 1. Prepare visual track
      if (shot.videoUrl) {
        // Use existing video
        await ff.writeFile(`input_v_${sIdx}_${i}.mp4`, await fetchFile(shot.videoUrl));
        await ff.exec([
          '-i', `input_v_${sIdx}_${i}.mp4`,
          '-vf', vFilterStr,
          '-r', '30',
          '-c:v', 'libx264',
          '-t', duration.toString(),
          `norm_v_${sIdx}_${i}.mp4`
        ]);
      } else if (shot.imageUrl) {
        // Create video from image
        await ff.writeFile(`input_i_${sIdx}_${i}.jpg`, await fetchFile(shot.imageUrl));
        await ff.exec([
          '-loop', '1',
          '-i', `input_i_${sIdx}_${i}.jpg`,
          '-vf', vFilterStr,
          '-c:v', 'libx264',
          '-t', duration.toString(),
          '-pix_fmt', 'yuv420p',
          `norm_v_${sIdx}_${i}.mp4`
        ]);
      } else {
        // Create black video
        await ff.exec([
          '-f', 'lavfi',
          '-i', `color=c=black:s=1280x720:d=${duration}`,
          '-c:v', 'libx264',
          `norm_v_${sIdx}_${i}.mp4`
        ]);
      }

      // 2. Find audio tracks that overlap with this shot
      let shotStartTime = 0;
      for (let j = 0; j < i; j++) {
        shotStartTime += shots[j].duration || 0;
      }
      const shotEndTime = shotStartTime + duration;
      
      const overlappingTracks = audioTracks.filter(t => t.url && t.startTime >= shotStartTime && t.startTime < shotEndTime);

      // 3. Combine visual and audio
      if (overlappingTracks.length > 0) {
        const audioInputs: string[] = [];
        const audioFilters: string[] = [];
        let audioIndex = 1; // 0 is video
        
        for (const track of overlappingTracks) {
          const trackFileName = `input_a_${sIdx}_${i}_${audioIndex}.mp3`;
          await ff.writeFile(trackFileName, await fetchFile(track.url));
          audioInputs.push('-i', trackFileName);
          
          const localStart = Math.max(0, track.startTime - shotStartTime);
          const delayMs = Math.floor(localStart * 1000);
          audioFilters.push(`[${audioIndex}:a]adelay=${delayMs}|${delayMs}[a${audioIndex}]`);
          audioIndex++;
        }
        
        let mixFilter = '';
        let mapArgs: string[] = [];
        
        if (overlappingTracks.length === 1) {
          mixFilter = `${audioFilters.join(';')}`;
          mapArgs = ['-map', '0:v', '-map', '[a1]'];
        } else {
          const inputs = Array.from({ length: overlappingTracks.length }, (_, idx) => `[a${idx + 1}]`).join('');
          mixFilter = `${audioFilters.join(';')};${inputs}amix=inputs=${overlappingTracks.length}:duration=longest[aout]`;
          mapArgs = ['-map', '0:v', '-map', '[aout]'];
        }

        await ff.exec([
          '-i', `norm_v_${sIdx}_${i}.mp4`,
          ...audioInputs,
          '-filter_complex', mixFilter,
          ...mapArgs,
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          shotVideoName
        ]);
      } else {
        // Add silent audio track to ensure concatenation works
        await ff.exec([
          '-f', 'lavfi',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-i', `norm_v_${sIdx}_${i}.mp4`,
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          shotVideoName
        ]);
      }
      
      inputFiles.push(shotVideoName);
    }
  }

  // 4. Concatenate all shots
  const listContent = inputFiles.map(file => `file '${file}'`).join('\n');
  await ff.writeFile('concat_list.txt', listContent);
  
  await ff.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat_list.txt',
    '-c', 'copy',
    'output.mp4'
  ]);

  // 5. Read result
  const data = await ff.readFile('output.mp4');
  const blob = new Blob([data], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  // Cleanup
  ff.off('progress', () => {});
  
  return url;
};
