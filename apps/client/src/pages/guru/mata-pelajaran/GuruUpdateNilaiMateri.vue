<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { injectTrpc, useTrcpQuery } from '../../../api-vue';
import { reactive } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { formatError } from '../../../api';

const { idKelas, idMataPelajaran, idMateri } = defineProps({
  idKelas: String,
  idMataPelajaran: String,
  idMateri: String
})
const emit = defineEmits(['close']);

const trpc = injectTrpc();
const { data } = useTrcpQuery(trpc!.guru.mataPelajaran.getNilaiMateri.queryOptions({
  id: computed(() => idMateri!)
}))
const { mutateAsync, error, isPending } = useMutation(trpc!.guru.mataPelajaran.updateNilaiMateri.mutationOptions());

type NilaiListType = Extract<typeof data["value"], Array<any>>
type NilaiItemType = NilaiListType extends Array<infer U> ? U : never

const anggotaList = ref<Array<Omit<NilaiItemType, "nilai"> & { index: number }>>([])
const nilaiList = reactive<Array<number>>([])

watchEffect(() => {
  if (data.value) {
    anggotaList.value = data.value.map(({ nilai, ...rest }, index) => ({
      ...rest,
      index
    }))
    nilaiList.length = 0;
    nilaiList.push(...data.value.map(({ nilai }) => nilai))
  }
})

const filter = ref("");

const filteredList = computed(() => {
  const filterNama = filter.value.toLocaleLowerCase();
  return anggotaList.value.filter((anggota) => anggota.nama.toLocaleLowerCase().includes(filterNama))
})

const queryClient = useQueryClient();
function onSave() {
  if (!idMateri) return;

  mutateAsync({
    id: idMateri!,
    nilai: anggotaList.value.filter((item) => !item.is_locked).map(({ id_siswa, index }) => ({
      id_siswa,
      nilai: nilaiList[index]
    }))
  }).then(() => {
    queryClient.invalidateQueries({
      queryKey: trpc!.guru.mataPelajaran.getNilaiMateri.queryKey({
        id: idMateri!
      })
    })
    queryClient.invalidateQueries({
      queryKey: trpc!.guru.mataPelajaran.getTotalNilai.queryKey({
        id_kelas: idKelas!,
        id_mata_pelajaran: idMataPelajaran!
      })
    })
    emit('close');
  })
}
</script>
<template>
  <v-card>
    <v-toolbar color="surface">
      <v-btn icon="mdi-close" @click="$emit('close')"></v-btn>
      <v-toolbar-title>Ubah Nilai</v-toolbar-title>
    </v-toolbar>
    <div class="px-4 pt-2">
      <v-text-field label="Filter" v-model="filter" />
    </div>
    <v-list>
      <template v-for="item in filteredList" :key="item.id_siswa">
        <v-list-item>
          <v-list-item-title>{{ item.nama }}</v-list-item-title>
          <v-list-item-subtitle>NIS. {{ item.NIS }} NISN. {{ item.NISN }}</v-list-item-subtitle>
          <v-list-item-subtitle v-if="item.is_locked" class="items-center">
            <v-icon size="small" class="mr-2">mdi-lock</v-icon>
            <span>Nilai Dikunci</span>
          </v-list-item-subtitle>
          <v-number-input :disabled="item.is_locked" class="py-2" label="Nilai" :model-value="nilaiList[item.index]"
            @update:model-value="(value) => {
              nilaiList[item.index] = value;
            }" :min="0" :max="100" />
        </v-list-item>
        <v-divider />
      </template>
    </v-list>
    <v-card-text class="text-error text-center pa-0 my-2" v-if="error">
      {{ formatError(error) }}
    </v-card-text>
    <v-btn @click="onSave" :loading="isPending" class="mx-4 my-2">Simpan</v-btn>
  </v-card>
</template>
