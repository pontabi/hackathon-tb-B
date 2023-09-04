<script setup>
import { defineProps } from 'vue'
import { inject } from 'vue'

const props = defineProps(['chat'])

const userList = inject('userList')

const sender = userList.value.find(el => el.rowid === props.chat.user_id)

const fTime = new Date(props.chat.created_at)
                  .toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
</script>

<template>
  <div v-if="chat.type === 'chat'">
    <div class="">
      {{ sender.name }}さん
    </div>
    <v-card class="p-2 ml-4" width="400" color="green">
      {{ chat.content }}
    </v-card>
    <div class="text-right">
      {{ fTime }}
    </div>
  </div>

  <div v-if="chat.type === 'memo'">
    <div class="">
      {{ sender.name }}さんのメモ
    </div>
    <v-card class="p-2" width="400" color="green">
      {{ chat.content }}
    </v-card>
    <div class="text-right">
      {{ fTime }}
    </div>
  </div>

  <div v-if="chat.type === 'enteredLog'">
    <div class="">
      {{ sender.name }}さんが入室しました
    </div>
    <div class="">
      {{ fTime }}
    </div>
  </div>

  <div v-if="chat.type === 'leftLog'">
    <div class="">
      {{ sender.name }}さんが入室しました
    </div>
    <div class="text-right">
      {{ fTime }}
    </div>
  </div>
</template>

<style scoped>
</style>
