<script setup>
import { inject, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import { sha256 } from 'js-sha256'
import { useField, useForm } from 'vee-validate'
import BaseDialog from "./Base/BaseDialog.vue"

// #region global state
const currentUser = inject("currentUser")
const chatList = inject("chatList")
const userList = inject("userList")
// #endregion

// #region local variable
const router = useRouter()
const socket = io()
const dialog = ref(false)
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // signupFailedイベントを受け取ったら実行
  socket.on("signupFailedEvent", (user) => {
    // signup失敗dialogを表示
    dialog.value = true
  })

  // signupSuccessEventイベントを受け取ったら実行
  socket.on("signupSuccessEvent", (user) => {
    socket.emit("loginEvent", user.name, user.password, "ルームA")
    router.push({ name: "chat" })
  })
  // 入室イベントを受け取った時の処理
  socket.on("loginSuccessEvent", (enteredUser) => {
    console.log(enteredUser);
    currentUser.rowid = enteredUser.rowid
    currentUser.name = enteredUser.name
    currentUser.email = enteredUser.email
    currentUser.room = "ルームA"

    // getAllUserEvetを送信
    socket.emit("getAllUserEvent", currentUser.room)
    // getAllChatEvetを送信
    socket.emit("getAllChatEvent", currentUser.room)
    // 入室ログをdbに追加
    const created_at = new Date().toISOString()
    const newChat = {
      user_id: currentUser.rowid,
      content: "",
      type: 'enteredLog',
      created_at: created_at,
      room: currentUser.room
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

// #region form handler
const { handleSubmit, handleReset } = useForm({
  // 入力情報のバリデーション
  validationSchema: {
    name (value) {
      if (value?.length >= 2) return true

      return '2文字以上入力してください'
    },
    email (value) {
      if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(value)) return true

      return '正しいe-mailを入力してください'
    },
    password (value) {
      if (value?.length >= 6) return true

      return '6文字以上入力してください'
    },
  },
})

// input-fieldとのバインディング
const name = useField('name')
const email = useField('email')
const password = useField('password')

// submit成功時の処理
const submit = handleSubmit(values => {
  // パスワードをsha256でハッシュ化
  const password = sha256(values.password)

  const newUser = {
    name: values.name,
    email: values.email,
    password: password
  }

  // signupEventを送信
  socket.emit("signupEvent", newUser)
})
// #endregion
</script>

<template>
  <div class="fullpage bg-blue-lighten-5">
    <v-card class="signup-card pa-sm-10 px-4 py-10">
    <h1 class="text-center mb-5">ChatApp Signup</h1>
    <form @submit.prevent="submit">
      <v-text-field
        v-model="name.value.value"
        :counter="10"
        :error-messages="name.errorMessage.value"
        label="Name"
      ></v-text-field>

      <v-text-field
        v-model="email.value.value"
        :error-messages="email.errorMessage.value"
        label="E-mail"
      ></v-text-field>

      <v-text-field
        v-model="password.value.value"
        :error-messages="password.errorMessage.value"
        type="password"
        label="Password"
      ></v-text-field>

      <div class="d-flex justify-end">
        <v-btn
          class="me-4 test-right"
          type="submit"
        >
          submit
        </v-btn>

        <v-btn
          class="text-right"
          @click="handleReset"
        >
          clear
        </v-btn>
      </div>
    </form>
    <router-link to="/" class="login-link">
    login
  </router-link>
  <p class="text-caption text-center mb-2">- アカウント登録が既にお済みの方は -</p>
  <v-btn type="button" size="small" href="/" class="w-100">ログインページへ</v-btn>
  </v-card>
  <BaseDialog
    v-if="dialog"
    v-model="dialog"
    btnText="閉じる"
    content="User名かE-mailが既に使用されています。"
  />
  </div>
</template>

<style scoped>
.fullpage {
  height: 100vh;
  width: 100vw;
  position: relative;
}
.signup-card {
  width: 500px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 500px;
}

.login-link {
  text-decoration: none;
  float: right;
}
</style>
