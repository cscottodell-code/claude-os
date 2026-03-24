<script setup lang="ts">
// Bad Nuxt UI patterns — should trigger errors/warnings
</script>

<template>
  <!-- ERROR: UToggle renamed to USwitch -->
  <UToggle v-model="enabled" />

  <!-- ERROR: v-model.nullify renamed to v-model.nullable -->
  <USelect v-model.nullify="selected" :items="options" />

  <!-- WARNING: :options renamed to :items -->
  <USelect :options="myOptions" />

  <!-- WARNING: empty string is truthy for :error -->
  <UFormField :error="errorMessage || ''">
    <UInput v-model="state.name" />
  </UFormField>
</template>
