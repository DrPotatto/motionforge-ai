import { renderFrame, totalDuration } from './renderer.js';

function pickMime() {
  const c = [
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
    { mimeType: 'video/mp4;codecs=h264', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
  ];
  if (typeof MediaRecorder === 'undefined') return null;
  for (const x of c) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x.mimeType)) return x;
  return null;
}

export async function exportVideo({ spec, fps = 30, scale = 1, onProgress, signal }) {
  const mime = pickMime();
  if (!mime) throw new Error('This browser does not support browser-based video recording. Try Chrome, Edge, or Firefox.');
  const W = Math.round(spec.width * scale), H = Math.round(spec.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const scaledSpec = { ...spec, width: W, height: H };
  const duration = totalDuration(spec);
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: mime.mimeType,
    videoBitsPerSecond: scale >= 1 ? 14000000 : 7000000,
  });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  const done = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime.mimeType }));
    recorder.onerror = e => reject((e && e.error) || new Error('Recording failed'));
  });
  recorder.start(200);
  const startTime = performance.now();
  let raf = 0, cancelled = false;
  const tick = () => {
    if (signal && signal.aborted) { cancelled = true; return; }
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed >= duration) { renderFrame(ctx, scaledSpec, duration); onProgress && onProgress(1); return; }
    renderFrame(ctx, scaledSpec, elapsed);
    onProgress && onProgress(elapsed / duration);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  await new Promise(resolve => {
    const check = () => { if (cancelled || (performance.now() - startTime) / 1000 >= duration + 0.05) resolve(); else setTimeout(check, 40); };
    check();
  });
  cancelAnimationFrame(raf);
  recorder.stop();
  stream.getTracks().forEach(t => t.stop());
  const blob = await done;
  if (signal && signal.aborted) throw new Error('Export cancelled');
  return { blob, mimeType: mime.mimeType, extension: mime.extension, duration };
}
