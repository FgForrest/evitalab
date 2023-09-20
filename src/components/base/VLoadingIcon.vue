<script setup lang="ts">
/**
 * Loading spinner icon made by Fran Pérez https://codepen.io/mrrocks/pen/ExLovj
 */
</script>

<template>
    <svg class="spinner" width="1.5rem" height="1.5rem" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
        <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
    </svg>
</template>

<style lang="scss" scoped>
// This is just to center the spinner

html, body { height: 100%; }

body {
    display: flex;
    align-items: center;
    justify-content: center;
}

// Here is where the magic happens

$offset: 187;
$duration: 1.4s;

.spinner {
    animation: rotator $duration linear infinite;
}

@keyframes rotator {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(270deg); }
}

.path {
    stroke-dasharray: $offset;
    stroke-dashoffset: 0;
    transform-origin: center;
    animation:
        dash $duration ease-in-out infinite,
        colors ($duration*4) ease-in-out infinite;
}

@keyframes colors {
    0% { stroke: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); }
    25% { stroke: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); }
    50% { stroke: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); }
    75% { stroke: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); }
    100% { stroke: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); }
}

@keyframes dash {
    0% { stroke-dashoffset: $offset; }
    50% {
        stroke-dashoffset: $offset/4;
        transform:rotate(135deg);
    }
    100% {
        stroke-dashoffset: $offset;
        transform:rotate(450deg);
    }
}
</style>
