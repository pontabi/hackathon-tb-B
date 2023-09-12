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
const activeUserList = inject("activeUserList")
const chatRooms = inject("chatRooms")
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
    socket.emit("loginEvent", user.name, user.password, chatRooms[0])
    router.push({ name: "chat" })
  })
  // 入室イベントを受け取った時の処理
  socket.on("loginSuccessEvent", (enteredUser) => {
    console.log(enteredUser);
    currentUser.rowid = enteredUser.rowid
    currentUser.name = enteredUser.name
    currentUser.email = enteredUser.email
    currentUser.room = chatRooms[0]

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

    // activeUserテーブルに自身を追加
    socket.emit("addActiveUser", enteredUser.name, socket.id)

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

  // activeUserを追加する処理
  socket.on("addActiveUser", (name) => {
    activeUserList.value.push(name)
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
    password: password,
    room:chatRooms[0]
  }

  // signupEventを送信
  socket.emit("signupEvent", newUser)
})
// #endregion
</script>

<template>
  <v-app class="fullpage bg-blue-lighten-5">
    <v-card class="signup-card pa-sm-10 px-4 py-10">
    <h1 class="text-center mb-5">ChatApp Signup</h1>
    <form @submit.prevent="submit">
      <v-text-field
        v-model="name.value.value"
        :counter="10"
        :error-messages="name.errorMessage.value"
        label="UserName"
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

      <v-btn
        class="w-100 mb-4"
        size="large"
        color="blue"
        type="submit"
      >
        登録する
      </v-btn>

        <!--
          冷静に考えると、入力内容全消しするボタンって悪魔的だよね
          なので消しました。
        <v-btn
          class="text-right"
          @click="handleReset"
        >
          clear
        </v-btn>-->
    </form>
  <p class="text-caption text-center mb-2">- アカウント登録が既にお済みの方は -</p>
  <router-link to="/" class="link">
    <v-btn type="button" size="small" href="/" class="w-100">ログインページ</v-btn>
  </router-link>
  </v-card>
  <BaseDialog
    v-if="dialog"
    v-model="dialog"
    btnText="閉じる"
    content="User名かE-mailが既に使用されています。"
  />
  </v-app>
</template>

<style scoped>
.link {
  color: #000;
}
.signup-card {
  width: 500px;
  margin: auto;
  position: absolute; /* 絶対位置指定 */
  top: 50%;
  left: 50%;
  transform: translateY(-60%) translateX(-50%);
}

@media screen and (max-width: 500px) {
  .signup-card {
    width: 95%;
  }
}

.login-link {
  text-decoration: none;
  float: right;
}
</style>
