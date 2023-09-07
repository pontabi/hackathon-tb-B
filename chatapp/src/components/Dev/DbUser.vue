<script setup>
import { inject, ref, reactive, onMounted, computed, watch } from "vue"
import io from "socket.io-client"

const socket = io()

const userList = inject("userList")
// #endregion

const showUserList = computed(() => {
  return userList.value
});

// #region lifecycle
onMounted(() => {
  // getAllUserEventを受け取ったときの処理
    socket.on("getAllUserEvent", (allUsers) => {
    userList.value = allUsers
    socket.off("getAllUserEvent")
  })
  // getAllUserEvetを送信
  socket.emit("getAllUserEvent")
})
// #endregion
</script>

<template>
  <nav class="navbar bg-body-tertiary">
    <div class="container-fluid">
      <a class="navbar-brand">DataBase - User</a>
    </div>
  </nav>
  <table class="table" v-if="userList.length !== 0">
    <thead>
      <tr>
        <th scope="col">id</th>
        <th scope="col">name</th>
        <th scope="col">email</th>
        <th scope="col">password</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in showUserList" :key="user.rowid">
        <th scope="row">{{ user.rowid }}</th>
        <td>{{ user.name }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.password }}</td>
      </tr>
    </tbody>
  </table>
  <p v-else>UserListの要素が空です。</p>
  <router-link to="/" class="link">
    <v-btn>TOPへ戻る</v-btn>
  </router-link>
</template>

<style scoped>
.link {
  text-decoration: none;
  color: #000;
}

.area {
  width: 500px;
  border: 1px solid #000;
  margin-top: 8px;
}

.item {
  display: block;
  white-space: pre-line;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}
</style>
