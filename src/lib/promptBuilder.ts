import { Project, Shot } from '../types/project';

export function buildVisualPrompt(shot: Shot, project: Project | null) {
  // 1. Extract base elements from the Cinematographer's Brain output
  const {
    imagePrompt: llmImagePrompt,
    videoPrompt: llmVideoPrompt,
    visualAction,
    cameraMovement
  } = shot;

  // 2. Construct Image Prompt
  const aspectRatio = project?.aspectRatio || '16:9';

  // The LLM (Cinematographer's Brain) has already generated a complete, self-contained, Chinese image prompt.
  // We will append global parameters (like aspect ratio) later when actually calling the API.
  let coreImagePrompt = llmImagePrompt || visualAction || '';

  const finalImagePrompt = coreImagePrompt;

  // 3. Construct Video Prompt
  // The LLM has already generated a complete Chinese video prompt.
  const coreVideoPrompt = llmVideoPrompt || visualAction || '';
  
  const videoPromptParts = [
    cameraMovement && cameraMovement !== 'Static' ? `镜头运动: ${cameraMovement}` : '',
    coreVideoPrompt
  ];

  const finalVideoPrompt = videoPromptParts.filter(Boolean).join(', ');

  return {
    imagePrompt: finalImagePrompt,
    videoPrompt: finalVideoPrompt
  };
}
