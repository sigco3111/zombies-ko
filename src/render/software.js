// Is the page drawing without the graphics card? A software renderer (SwiftShader, Microsoft's
// Basic Render Driver / WARP, Mesa's llvmpipe) names itself in the WebGL renderer string. The game
// still loads there, slowly; the loading screen and the boot details say so, and the effects
// atlases are drawn at half size (fx/atlas.js).
export const SOFTWARE_RE = /swiftshader|basic render driver|microsoft basic render|llvmpipe|softpipe|software/i;
export const isSoftwareRenderer = (name) => !!name && SOFTWARE_RE.test(String(name));

export const SOFTWARE_TEXT = '브라우저가 그래픽 카드를 쓰지 않고 그리고 있습니다(하드웨어 가속이 꺼져 있거나 없습니다). 게임이 느리게 로딩되고 제대로 실행되지 않습니다. 브라우저 설정에서 하드웨어 가속을 켜고 새로고침하세요.';
export const SOFTWARE_HOWTO = [
  'Chrome 또는 Edge: 설정 > 시스템에서 "가능한 경우 그래픽 가속 사용"을 켠 뒤 다시 시작하세요.',
  'Firefox: 설정 > 일반 > 성능에서 "권장 성능 설정 사용"을 끄고 "가능한 경우 하드웨어 가속 사용"을 켠 뒤 다시 시작하세요.',
];

// The renderer string of a WebGL context ('' when it cannot be read).
export function rendererName(gl) {
  try {
    if (!gl || (gl.isContextLost && gl.isContextLost())) return '';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return String((dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
  } catch { return ''; }
}
