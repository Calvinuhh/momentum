<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="border-t border-neutral-800 py-6 text-center text-sm text-neutral-500">
      Momentum — build small like a real product.
    </footer>
  </div>
</template>
