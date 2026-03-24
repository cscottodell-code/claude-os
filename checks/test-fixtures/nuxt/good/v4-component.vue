<script setup lang="ts">
// Good Nuxt UI v4 patterns — all should PASS
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

const state = reactive({ email: '' })
</script>

<template>
  <UForm :schema="schema" :state="state">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" />
    </UFormField>

    <!-- Correct: USwitch not UToggle -->
    <USwitch v-model="enabled" />

    <!-- Correct: :items not :options -->
    <USelect :items="options" />

    <!-- v4 nullable modifier -->
    <USelect v-model.nullable="selected" :items="options" />

    <!-- Correct: undefined clears error, not empty string -->
    <UFormField :error="errorMessage || undefined">
      <UInput v-model="state.name" />
    </UFormField>
  </UForm>
</template>
