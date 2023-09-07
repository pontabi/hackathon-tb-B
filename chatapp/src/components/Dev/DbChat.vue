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
  <table class="table" v-if="chatList.length !== 0">
    <thead>
      <tr>
        <th scope="col">id</th>
        <th scope="col">user_id</th>
        <th scope="col">content</th>
        <th scope="col">type</th>
        <th scope="col">to_who</th>
        <th scope="col">created_at</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="chat in showChatList" :key="chat.rowid">
        <th scope="row">{{ chat.rowid }}</th>
        <td>{{ chat.user_id }}</td>
        <td>{{ chat.content }}</td>
        <td>{{ chat.type }}</td>
        <td>{{ chat.to_who }}</td>
        <td>{{ chat.created_at }}</td>
      </tr>
    </tbody>
  </table>
  <p v-else>ChatListの要素が空です。</p>
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
