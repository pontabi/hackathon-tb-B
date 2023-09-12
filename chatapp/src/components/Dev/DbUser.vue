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
  <v-table class="" v-if="userList.length !== 0">
    <thead>
      <tr>
        <th>id</th>
        <th>name</th>
        <th>email</th>
        <th>password</th>
        <th>room</th>
        <th>avatar_url</th>
        <th>last_login</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in showUserList" :key="user.rowid">
        <th>{{ user.rowid }}</th>
        <td>{{ user.name }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.password }}</td>
        <td>{{ user.room }}</td>
        <td>{{ user.avatar_url }}</td>
        <td>{{ user.last_login }}</td>
      </tr>
    </tbody>
  </v-table>
  <p v-else>UserListの要素が空です。</p>
  <router-link to="/" class="link">
    <v-btn class="ml-3">TOPへ戻る</v-btn>
  </router-link>
</template>

<style scoped>
.link {
  text-decoration: none;
  color: #000;
}
</style>
