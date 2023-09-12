<script setup>
import { inject, ref, reactive, onMounted, computed, watch } from "vue"
import io from "socket.io-client"

const socket = io()

const chatList = inject("chatList")
// #endregion

const showChatList = computed(() => {
  return chatList.value
});

// #region lifecycle
onMounted(() => {
  // getAllUserEventを受け取ったときの処理
    socket.on("getAllChatEvent", (allChats) => {
    chatList.value = allChats
    socket.off("getAllChatEvent")
  })
  // getAllUserEvetを送信
  socket.emit("getAllChatEvent")
})
// #endregion
</script>

<template>
  <nav class="navbar bg-body-tertiary">
    <div class="container-fluid">
      <a class="navbar-brand">DataBase - Chat</a>
    </div>
  </nav>
  <v-table v-if="chatList.length !== 0">
    <thead>
      <tr>
        <th>id</th>
        <th>user_id</th>
        <th>content</th>
        <th>type</th>
        <th>to_who</th>
        <th>created_at</th>
        <th>room</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="chat in showChatList" :key="chat.rowid">
        <th>{{ chat.rowid }}</th>
        <td>{{ chat.user_id }}</td>
        <td>{{ chat.content }}</td>
        <td>{{ chat.type }}</td>
        <td>{{ chat.to_who }}</td>
        <td>{{ chat.created_at }}</td>
        <td>{{ chat.room }}</td>
      </tr>
    </tbody>
  </v-table>
  <p v-else>ChatListの要素が空です。</p>
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
