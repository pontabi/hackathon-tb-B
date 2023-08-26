<script setup>
import { inject, ref, reactive, onMounted, computed, watch } from "vue"
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
//   id: datetime(temporary)
//   user: "Mike",
//   content: "hello world",
//   type: "chat / memo / enteredLog / leftLog"
// }
const chatList = reactive([])

// addChat内で使う関数
const getFullText = (user, content, type) => {
  switch (type) {
    case "chat":
      return `${user}さん：${content}`
    case "memo":
      return `${user}さんのメモ：${content}`
    case "enteredLog":
      return `${user}さんが入室しました`
    case "leftLog":
      return `${user}さんが退出しました`
    default:
      return undefined
  }
}

const addChat = (user, content="", type) => {
  // type引数が chat / memo / enteredLog / leftLog　以外だったら早期リターン
  const hasInvalidType = !["chat", "memo", "enteredLog", "leftLog"].includes(type)
  if (hasInvalidType) return

  const id = new Date().valueOf();
  const fullText = getFullText(user, content, type)

  const data = {
    id: id,
    user: user,
    content: content,
    type: type,
    fullText: fullText
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

// 投稿削除イベントをサーバーに送信する
const onDelete = (chatId) => {
  const chatObj = chatList.find(el => el.id === chatId)
  // chatが存在しない場合、早期リターン
  if (!chatObj) {
    alert("The chat is not exist")
    return
  }
  // メモの時は、サーバーには送信せず、削除を反映
  if (chatObj.type === "memo") {
    const removeIdx = chatList.findIndex(el => el.id === chatObj.id)
    chatList.splice(removeIdx, 1)
    return
  }

  socket.emit("deleteEvent", chatObj)
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

// サーバから受信した投稿メッセージを削除する
const onReceiveDelete = (chatObj) => {
  const removeIdx = chatList.findIndex(el => el.id === chatObj.id)
  chatList.splice(removeIdx, 1)
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

  // 削除イベントを受け取ったら実行
  socket.on("deleteEvent", (chatObj) => {
    onReceiveDelete(chatObj)
  })
}

// 削除ボタンをつけるか否か
const isDeletable = (chat) => {
  const hasAuth = chat.user === userName.value;
  const isValidType = chat.type === "chat" || chat.type === "memo";
  return hasAuth && isValidType;
};

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
          <li class="item mt-4" v-for="chat in chatList" :key="chat.id">
            <p>{{ chat.fullText }}</p>
            <button v-if="isDeletable(chat)" @click="onDelete(chat.id)" class="button-normal">Delete</button>
          </li>
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
