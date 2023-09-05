<template>
  <form @submit.prevent="">
    <div class="container d-flex align-items-center">
      <v-card class="mx-auto my-5 p-5 signup-card" >
        <h1 class="text-h3 font-weight-medium my-5">ChatApp Signup</h1>
        <div class="mt-10">
          <v-text-field
            v-model="inputUserName"
            @keydown.enter="onEnter"
            @compositionstart="onIMEStart"
            @compositionend="onIMEEnd"
            class=""
            type="text"
            placeholder="username"
          />
          <v-text-field
            v-model="inputUserEmail"
            @keydown.enter="onEnter"
            @compositionstart="onIMEStart"
            @compositionend="onIMEEnd"
            class=""
            type="email"
            placeholder="email"
          />
          <v-text-field
            v-model="inputPassword"
            @keydown.enter="onEnter"
            @compositionstart="onIMEStart"
            @compositionend="onIMEEnd"
            class=""
            type="password"
            placeholder="password"
          />
        </div>
        <v-btn type="button" @click="onEnter" class="w-100" color="primary">入室する</v-btn>
        <router-link to="/signup" class="signup-link">Signup</router-link>
      </v-card>
    </div>
  </form>
</template>

<script setup>
import { inject, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"

// #region global state
const currentUser = inject("currentUser")
const chatList = inject("chatList")
const userList = inject("userList")
// #endregion

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region reactive variable
const inputUserName = ref("")
const inputUserEmail = ref("")
const isIMEActive = ref(false)
// #endregion

const onEnter = () => {
  // 日本語変換中のkeydown.enterイベントを回避
  if (isIMEActive.value) return
  console.log(inputUserName.value)
}
// 日本語変換中のkeydown.enterイベントを回避
const onIMEStart = () => {
  isIMEActive.value = true
}
const onIMEEnd = () => {
  isIMEActive.value = false
}
// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
</script>

<style scoped>
.signup-card {
  width: 500px;
}
.signup-link {
  text-decoration: none;
  display: block;
  text-align: right;
}
</style>
