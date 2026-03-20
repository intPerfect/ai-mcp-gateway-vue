<template>
  <a-config-provider>
    <RouterView />
  </a-config-provider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
#app {
  height: 100vh;
}

body {
  margin: 0;
  padding: 0;
}
</style>
