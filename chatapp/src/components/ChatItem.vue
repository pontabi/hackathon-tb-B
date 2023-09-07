<script setup>
import { inject } from 'vue'
import UserLabel from './UserLabel.vue';

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

  <div v-else-if="chat.type === 'chat' && chat.to_who === '' && currentUser.room === sender.room">
    <UserLabel :sender="sender"></UserLabel>
    <v-card class="px-4 py-2 ml-4" color="blue-lighten-5">
      {{ chat.content }}
    </v-card>
    <div class="text-right text-caption text-medium-emphasis">
      {{ fTime }}
    </div>
  </div>

  <div v-if="chat.type === 'memo' && currentUser.name === sender.name">
    <div class="pb-2 text-body-2">
      あなた<span class="text-caption">（{{ sender.name }}）のメモ</span>
    </div>
    <v-card class="px-4 py-2 ml-4" color="blue-lighten-5">
      {{ chat.content }}
    </v-card>
    <div class="text-right text-caption text-medium-emphasis">
      {{ fTime }}
    </div>
  </div>

  <div v-else-if="chat.type === 'enteredLog' && currentUser.room === chat.room">
    <div class="text-center">
      <v-chip size="x-small">
        {{ fTime }} - {{ sender.name }}さんが入室しました
      </v-chip>
    </div>
  </div>

  <div v-else-if="chat.type === 'leftLog' && currentUser.room === chat.room">
    <div class="text-center">
      <v-chip size="x-small">
        {{ fTime }} - {{ sender.name }}さんが退出しました
      </v-chip>
    </div>
  </div>
</template>

<style scoped>
</style>
