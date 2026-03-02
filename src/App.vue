<template>
  <router-view />
  <DailyNotice />
</template>

<script>
import { defineComponent } from 'vue'
import DailyNotice from './components/DailyNotice.vue'

export default defineComponent({
  name: 'App',
  components: { DailyNotice }
})
</script>