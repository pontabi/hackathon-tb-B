<script setup>
import { provide, reactive, ref } from "vue"

// #region reactive state
const currentUser = reactive({})
const userList = ref([])
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
