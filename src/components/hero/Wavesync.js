// Ponte de sincronização entre NeuralBg (2D) e Latisse (3D)
// Objecto partilhado — mutável em runtime, sem React state
export const waveSync = {
  isActive:       false,   // true quando as ondas estão a propagar
  revealProgress: 0,       // 0→1 com easeInOut — controla visibilidade da Latisse
}