<template>
  <svg class="qn-ball" :class="{ 'qn-ball-og': own }" viewBox="0 0 100 100" aria-hidden="true">
    <circle class="qn-ball-rim" cx="50" cy="50" r="47" />
    <g class="qn-ball-seam">
      <line x1="50" y1="33" x2="50" y2="4" />
      <line x1="66.17" y1="44.75" x2="94.7" y2="35.5" />
      <line x1="59.99" y1="63.75" x2="77.6" y2="88" />
      <line x1="40.01" y1="63.75" x2="22.4" y2="88" />
      <line x1="33.83" y1="44.75" x2="5.3" y2="35.5" />
    </g>
    <g class="qn-ball-ink">
      <polygon points="50,33 66.17,44.75 59.99,63.75 40.01,63.75 33.83,44.75" />
      <polygon points="62.9,32.2 62.95,6.8 86.96,23.7" />
      <polygon points="70.9,56.8 95.97,49.4 86,78.9" />
      <polygon points="50,72 65.07,93.16 34.9,93.16" />
      <polygon points="29.1,56.8 14,78.9 4.03,49.4" />
      <polygon points="37.1,32.2 13.04,23.7 37.05,6.8" />
    </g>
  </svg>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'QnSoccerBall',
  props: {
    own: { type: Boolean, default: false }
  }
})
</script>

<style scoped>
.qn-ball {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  vertical-align: -2px;
}
.qn-ball-rim {
  fill: #fff;
  stroke: #222;
  stroke-width: 3.5;
}
.qn-ball-ink {
  fill: #222;
}
.qn-ball-seam {
  stroke: #222;
  stroke-width: 2.4;
  fill: none;
  stroke-linecap: round;
}
.qn-ball-og .qn-ball-rim {
  stroke: #e53935;
}
.qn-ball-og .qn-ball-ink {
  fill: #d32f2f;
}
.qn-ball-og .qn-ball-seam {
  stroke: #e53935;
}
</style>
