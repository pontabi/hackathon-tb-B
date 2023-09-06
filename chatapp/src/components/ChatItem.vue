<script setup>
import { inject } from 'vue'

const props = defineProps(['chat'])

const userList = inject('userList')

const sender = userList.value.find(el => el.rowid === props.chat.user_id)

const fTime = new Date(props.chat.created_at)
                  .toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

const currentUser = inject('currentUser')
</script>

<template>
  <div v-if="chat.type === 'chat' && chat.to_who === currentUser.name">
    <div class="">
      {{ sender.name }}さんからのDM
    </div>
    <v-card class="px-4 py-2 ml-4" color="red">
      {{ chat.content }}
    </v-card>
    <div class="text-right text-caption">
      {{ fTime }}
    </div>
  </div>

  <div v-else-if="chat.type === 'chat' && chat.to_who !== '' && sender.name === currentUser.name">
    <div class="">
      {{ chat.to_who }}さんへ送ったDM
    </div>
    <v-card class="px-4 py-2 ml-4" color="blue">
      {{ chat.content }}
    </v-card>
    <div class="text-right text-caption">
      {{ fTime }}
    </div>
  </div>

  <div v-else-if="chat.type === 'chat' && chat.to_who === ''">
    <div class="">
      {{ sender.name }}さん
    </div>
    <v-card class="px-4 py-2 ml-4" color="green">
      {{ chat.content }}
    </v-card>
    <div class="text-right text-caption">
      {{ fTime }}
    </div>
  </div>

  <div v-if="chat.type === 'memo' && currentUser.name === sender.name">
    <div class="">
      {{ sender.name }}さんのメモ
    </div>
    <v-card class="px-4 py-2 ml-4" color="green">
      {{ chat.content }}
    </v-card>
    <div class="text-right text-caption">
      {{ fTime }}
    </div>
  </div>

  <div v-else-if="chat.type === 'enteredLog'">
    <div class="text-center text-caption">
      {{ fTime }} - {{ sender.name }}さんが入室しました
    </div>
  </div>

  <div v-else-if="chat.type === 'leftLog'">
    <div class="text-center text-caption">
      {{ fTime }} - {{ sender.name }}さんが退出しました
    </div>
  </div>
</template>

<style scoped>
</style>
