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
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名とEmailが入力されているかチェック
  if (!inputUserName.value && !inputUserEmail.value) return

  // 入室イベントを送信
  socket.emit("loginEvent", inputUserName.value, inputUserEmail.value)

  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
    // 入室イベントを受け取った時の処理
  socket.on("loginEvent", (enteredUser) => {
    currentUser.rowid = enteredUser.rowid
    currentUser.name = enteredUser.name
    currentUser.email = enteredUser.email
    socket.off("loginEvent")

    // getAllUserEvetを送信
    socket.emit("getAllUserEvent")
    // getAllChatEvetを送信
    socket.emit("getAllChatEvent")
    // 入室ログをdbに追加
    const created_at = new Date().toISOString()
    const newChat = {
      user_id: currentUser.rowid,
      content: "",
      type: 'enteredLog',
      created_at: created_at,
    }
    socket.emit("postEvent", newChat)
  })

  // getAllChatEventを受け取ったときの処理
  socket.on("getAllChatEvent", (allChats) => {
    chatList.value = allChats
    socket.off("getAllChatEvent")
  })

  // getAllUserEventを受け取ったときの処理
  socket.on("getAllUserEvent", (allUsers) => {
    userList.value = allUsers
    socket.off("getAllUserEvent")
  })
}
// #endregion

// #region delete table handler for dev
// 開発用：テーブル削除ハンドラー
const onDropUserTable = () => {
  socket.emit("dropUserTableEvent")
}
const onDropChatTable = () => {
  socket.emit("dropChatTableEvent")
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
          <input
            v-model="inputUserName"
            @keydown.enter="onEnter"
            class="user-name-text form-control w-100"
            type="text"
            placeholder="name"
          />
          <input
            v-model="inputUserEmail"
            @keydown.enter="onEnter"
            class="user-name-text form-control w-100"
            type="text"
            placeholder="email"
          />
        </div>
        <button type="button" @click="onEnter" class="btn btn-primary w-100 mb-5">入室する</button>
      </div>
    </div>
  </form>
  <v-btn @click="onDropUserTable" color="red">開発用・Userテーブル削除</v-btn>
  <v-btn @click="onDropChatTable" color="red">開発用・Chatテーブル削除</v-btn>
</template>

<style scoped>
.user-name-text {
  width: 200px;
  border: 1px solid #888;
  margin-bottom: 16px;
}
</style>
