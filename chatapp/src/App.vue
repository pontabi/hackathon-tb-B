<script setup>
import { provide, reactive, ref } from "vue"

// #region reactive state
// ログインしているユーザー
const currentUser = reactive({})
// db上の全ユーザー
const userList = ref([])
// db上の全チャット
const chatList = ref([])
// db上の全アクティブユーザー
const activeUserList = ref([])
// チャットルーム一覧
const chatRooms = ([
  'ROOM A',
  'ROOM B',
  'ROOM C',
  'ROOM D',
  'ROOM E',
])
// #endregion
  
// #region global variable
provide("currentUser", currentUser)
provide("userList", userList)
provide("chatList", chatList)
provide("activeUserList", activeUserList)
provide("chatRooms", chatRooms)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
