<script setup>
import { inject, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import { sha256 } from 'js-sha256'
import { useField, useForm } from 'vee-validate'

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region lifecycle
onMounted(() => {
  // signupイベントを受け取ったら実行
  socket.on("signupEvent", (newUser) => {

  })
})
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
  <v-card class="signup-card">
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
  </v-card>
</template>

<style scoped>
.signup-card {
  width: 500px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 500px;
  padding: 5rem;
}
</style>
