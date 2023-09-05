<script setup>
import { inject, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import { sha256 } from "js-sha256";
import { VAlert } from "vuetify/lib/components/index.mjs";

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
const inputPassword = ref("")
const loginFailed = ref(false)
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
  if (!inputUserName.value && !inputPassword.value) return

  // パスワードをsha256でハッシュ化
  const password = sha256(inputPassword.value)
  // 入室イベントを送信
  socket.emit("loginEvent", inputUserName.value, password)

}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取った時の処理
  socket.on("loginSuccessEvent", (enteredUser) => {
    console.log(enteredUser);
    currentUser.rowid = enteredUser.rowid
    currentUser.name = enteredUser.name
    currentUser.email = enteredUser.email

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

    // チャット画面へ遷移
    router.push({ name: "chat" })
  })

  socket.on("loginFailedEvent", () => {
    loginFailed.value = true
  })

  // getAllChatEventを受け取ったときの処理
  socket.on("getAllChatEvent", (allChats) => {
    chatList.value = allChats
  })

  // getAllUserEventを受け取ったときの処理
  socket.on("getAllUserEvent", (allUsers) => {
    userList.value = allUsers
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
    <v-app class="fullpage bg-blue-lighten-5">
      <div class="login-page bg-white">
        <div class="form text-center pa-10 elevation-10">
          <form class="login-form">
            <h1 class="mb-10">Vue.js Chat</h1>
            <div class="">
              <v-text-field
                v-model="inputUserName"
                label="username or email"
                @keydown.enter="onEnter"
                class=""
                type="text" />
              <v-text-field
                v-model="inputPassword"
                label="password"
                @keydown.enter="onEnter"
                class=""
                type="password" />
            </div>
            <v-btn type="button" @click="onEnter" class="w-100">入室する</v-btn>
            <v-alert
              v-if="loginFailed"
              variant="outlined"
              type="error"
              border="start"
              text="ログイン情報が正しくありません。"
              class="my-3"
            ></v-alert>
            <router-link to="/signup" class="signup-link">
              Signup
            </router-link>
          </form>
        </div>
      </div>
    </v-app>

  <v-btn href="/db-user/">開発用・Userテーブル参照</v-btn>
  <v-btn @click="onDropUserTable" color="red">開発用・Userテーブル削除</v-btn>
  <v-btn href="/db-chat/">開発用・Chatテーブル参照</v-btn>
  <v-btn @click="onDropChatTable" color="red">開発用・Chatテーブル削除</v-btn>
</template>

<style scoped>
.login-page {
  width: 500px;
  margin: 8% auto 0;
}

.signup-link {
  text-decoration: none;
  float: right;
}
</style>
