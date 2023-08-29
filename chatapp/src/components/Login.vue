<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if (!inputUserName.value) return;

  // 入室メッセージを送信
  socket.emit("enterEvent", inputUserName.value)

  // 全体で使用するnameに入力されたユーザー名を格納
  userName.value = inputUserName.value

  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <form>
    <div class="container d-flex align-items-center">
      <div class="mx-auto my-5 px-4 border rounded-3">
        <h1 class="text-h3 font-weight-medium my-5">Vue.js Chat サンプル</h1>
        <div class="mt-10">
          <p>ユーザー名</p>
          <input type="text" class="user-name-text form-control w-100" v-model="inputUserName" @keydown.enter="onEnter" />
        </div>
        <button type="button" @click="onEnter" class="btn btn-primary w-100 mb-5">入室する</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.user-name-text {
  width: 200px;
  border: 1px solid #888;
  margin-bottom: 16px;
}
</style>
