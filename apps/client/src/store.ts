
import { defineStore } from "pinia";
import { useLocalStorage } from '@vueuse/core'

export const usePeriodeStore = defineStore('periode', {
  state: () => ({
    selectedPeriode: useLocalStorage<string | undefined>('periode', undefined)
  }),
})

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    errors: [] as string[]
  })
})
