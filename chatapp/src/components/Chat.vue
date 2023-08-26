<script setup>
import { inject, ref, reactive, onMounted, computed } from "vue"
import io from "socket.io-client"

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = io()
// #endregion

// #region reactive variable
const chatContent = ref("")
// オブジェクト型の配列を持つ
// {
//   user: "Mike",
//   content: "hello world",
//   type: "chat / memo / enteredLog / leftLog"
// }
const chatList = reactive([])

const displayedContents = computed(() => {
  const contents = []
  for (const chat of chatList) {
    switch (chat.type) {
      case "chat":
        contents.push(`${chat.user}さん：${chat.content}`)
        break;
      case "memo":
        contents.push(`${chat.user}さんのメモ：${chat.content}`)
        break;
      case "enteredLog":
        contents.push(`${chat.user}さんが入室しました`)
        break;
      case "leftLog":
        contents.push(`${chat.user}さんが退出しました`)
        break;
    }
  }
  return contents
})

const addChat = (user, content="", type) => {
  // type引数が chat / memo / enteredLog / leftLog　以外だったらリストに追加しない
  const hasInvalidType = !["chat", "memo", "enteredLog", "leftLog"].includes(type)
  if (hasInvalidType) return

  const data = {
    user: user,
    content: content,
    type: type,
  }
  chatList.push(data)
}

// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  // 空、空行、スペースのみの場合は送信しない
  if (!chatContent.value.trim()) return;
  socket.emit("publishEvent", userName.value, chatContent.value)
  // 入力欄を初期化
  chatContent.value = ""
}

// 退室者をサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", userName.value)
}

// メモを画面上に表示する
const onMemo = () => {
  // メモの追加
  addChat(userName.value, chatContent.value, "memo")
  // 入力欄を初期化
  chatContent.value = ""
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (enteredUserName) => {
  addChat(enteredUserName, "", "enteredLog")
}

// サーバから受信した退室者を受け取り画面上に退室メッセージを表示する
const onReceiveExit = (leftUserName) => {
  addChat(leftUserName, "", "leftLog")
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (nameValue, contentValue) => {
  addChat(nameValue, contentValue, "chat")
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (enteredUserName) => {
    onReceiveEnter(enteredUserName);
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (leftUserName) => {
    onReceiveExit(leftUserName)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (nameValue, contentValue) => {
    onReceivePublish(nameValue, contentValue)
  })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="chatContent"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(content, i) in displayedContents" :key="i">{{ content }}</li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>

<style scoped>
.link {
  text-decoration: none;
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
