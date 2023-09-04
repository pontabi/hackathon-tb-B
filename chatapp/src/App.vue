<script setup>
import { provide, reactive, ref } from "vue"

// #region reactive state
// ログインしているユーザー
const currentUser = reactive({})
// db上の全ユーザー
const userList = ref([])
// db上の全チャット
const chatList = ref([])
// #endregion

// #region global variable
provide("currentUser", currentUser)
provide("userList", userList)
provide("chatList", chatList)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
