<script setup>
import { provide, reactive, ref } from "vue"

// #region reactive state
const userName = ref("")
let chatList = ref([])
// #endregion

// #region global variable
provide("userName", userName)
provide("chatList", chatList)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
