let audioCtx = null;

export const playSound = async (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    // Inicializar instacia única de contexto
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    // Reanudar el contexto si está suspendido por la política de autoplay del navegador
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const time = audioCtx.currentTime;
    
    if (type === 'send') {
      // Un sonido corto, agradable tipo "enviado"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, time);
      osc.frequency.exponentialRampToValueAtTime(1000, time + 0.1);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      
      osc.start(time);
      osc.stop(time + 0.15);
    } else if (type === 'receive') {
      // Un sonido de "notificación de recepción", doble y suave
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, time);
      osc.frequency.setValueAtTime(600, time + 0.15);
      
      // Primer pulso
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      // Segundo pulso
      gain.gain.setValueAtTime(0, time + 0.15);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      
      osc.start(time);
      osc.stop(time + 0.3);
    }
  } catch (e) {
    console.error('Error playing sound:', e);
  }
};
