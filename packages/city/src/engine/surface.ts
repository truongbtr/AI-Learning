// The single opaque city material: per-vertex `surf` (0 solid · 1 glass · 2 light · 3 water) picks
// roughness, metalness and glow, so a whole chunk is one draw call. uWindow / uLights come from the
// day-night cycle (warm windows and street lamps at night).

export interface SurfaceUniforms {
  uWindow: { value: number };
  uLights: { value: number };
}

type Shader = { vertexShader: string; fragmentShader: string; uniforms: Record<string, unknown> };

const VERTEX_DECL = "attribute float surf;\nvarying float vSurf;";
const FRAGMENT_DECL = "uniform float uWindow;\nuniform float uLights;\nvarying float vSurf;";

const ROUGHNESS =
  "if (vSurf > 0.5 && vSurf < 1.5) roughnessFactor = 0.2; else if (vSurf > 2.5) roughnessFactor = 0.12;";
const METALNESS = "if ((vSurf > 0.5 && vSurf < 1.5) || vSurf > 2.5) metalnessFactor = 0.15;";
const EMISSIVE = [
  "if (vSurf > 0.5 && vSurf < 1.5) totalEmissiveRadiance = mix(vColor.rgb * 0.22, vec3(1.0, 0.78, 0.4) * 0.42, uWindow);",
  "else if (vSurf > 1.5 && vSurf < 2.5) totalEmissiveRadiance = vColor.rgb * mix(0.35, 1.5, uLights);",
  "else if (vSurf > 2.5) totalEmissiveRadiance = vec3(0.018, 0.1, 0.14);",
  "else totalEmissiveRadiance = vec3(0.0);",
].join("\n");

export function surfaceShader(uniforms: SurfaceUniforms) {
  return (shader: Shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_DECL}`)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSurf = surf;");
    shader.fragmentShader = `${FRAGMENT_DECL}\n${shader.fragmentShader}`
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${ROUGHNESS}`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\n${METALNESS}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${EMISSIVE}`);
  };
}
