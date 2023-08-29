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
// {"
//   id: datetime(temporary)
//   user: "Mike",
//   content: "hello world",
//   type: "chat / memo / enteredLog / leftLog / DMSend / DMReceive",
//   time: "2023/7/1 22時30分0秒"
// }

const address = ref("")
const chatList = reactive([])

// falseで昇順
const sortOrder = ref(false);

// ソートボタンが押された時に動作　　sortOrderの値を逆にする
const sortOrderButton = () => {
  sortOrder.value = !sortOrder.value
}

// sortOrderがfalseなら昇順、trueなら降順
const sortedChatList = computed(() => {
  if (sortOrder.value) {
    return chatList.slice().reverse();
  } else {
    return chatList.slice();
  }
});

//時刻表示を成形するのに使う関数
const takeTime = ()=>{
  let date = new Date()
  return `${date.getFullYear()}/${date.getMonth()}/${date.getDay()} ${date.getHours()}時${date.getMinutes()}分${date.getSeconds()}秒`
}

// addChat内で使う関数
const getFullText = (user, content, type, time) => {
  switch (type) {
    case "chat":
      return `${user}さん：${content}：${time}`
    case "memo":
      return `${user}さんのメモ：${content}：${time}`
    case "enteredLog":
      return `${user}さんが入室しました：${time}`
    case "leftLog":
      return `${user}さんが退出しました：${time}`
    case "DMReceive":
      return `${user}さんからのDM：${content}：${time}`
    case "DMSend":
      return `自分で送ったDM：${content}：${time}`
    default:
      return undefined
  }
}

const addChat = (user, content="", type, time) => {
  // type引数が chat / memo / enteredLog / leftLog　以外だったら早期リターン
  const hasInvalidType = !["chat", "memo", "enteredLog", "leftLog", "DMReceive", "DMSend"].includes(type)
  if (hasInvalidType) return

  const id = new Date().valueOf();
  const fullText = getFullText(user, content, type, time)

  const data = {
    id: id,
    user: user,
    content: content,
    type: type,
    time: time,
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
  socket.emit("publishEvent", userName.value, chatContent.value, takeTime(), address.value)

  // 入力欄を初期化
  chatContent.value = ""
  address.value = ""
}

// エンターキーで投稿する
document.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    onPublish()
  }
})

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
  socket.emit("exitEvent", userName.value, takeTime())
}

// メモを画面上に表示する
const onMemo = () => {
  // メモの追加
  addChat(userName.value, chatContent.value, "memo", takeTime())
  // 入力欄を初期化
  chatContent.value = ""
}


// 休止フラグ
let paused = false
// 一時休止にする 休止中はほかの人からの投稿が表示されないようにしたい。
const onPause = () => {
  paused = !paused
  console.log(paused)
}

// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (enteredUserName) => {
  addChat(enteredUserName, "", "enteredLog", takeTime())
}

// サーバから受信した退室者を受け取り画面上に退室メッセージを表示する
const onReceiveExit = (leftUserName, time) => {
  addChat(leftUserName, "", "leftLog", time)
}

// サーバから受信した投稿メッセージを画面上に表示する

const onReceivePublish = (nameValue, contentValue, time, address) => {
  console.log(nameValue)
  if (!paused) {
    if(address==""){
      addChat(nameValue, contentValue, "chat", time)
    } else if(address==userName.value){
      addChat(nameValue, contentValue, "DMReceive", time)
    } else if(nameValue==userName.value){
      addChat(nameValue, contentValue, "DMSend", time)
    } 
  } else {
    console.log("受信を一時停止しています")
  } 
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
  socket.on("exitEvent", (leftUserName, time) => {
    onReceiveExit(leftUserName, time)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (nameValue, contentValue, time, address) => {
    onReceivePublish(nameValue, contentValue, time, address)
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
      <textarea variant="outlined" placeholder="相手のユーザーネームを入力" rows="1" class="area" v-model="address"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <button type="button" class="button-normal" @click="sortOrderButton">現在: {{ sortOrder ? "降順" : "昇順" }}</button>
        <ul>
          <li class="item mt-4" v-for="chat in sortedChatList" :key="chat.id">
            <p>{{ chat.fullText }}</p>
            <button v-if="isDeletable(chat)" @click="onDelete(chat.id)" class="button-normal">Delete</button>
          </li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit " @click="onExit">退室する</button>
    </router-link>
    <button v-if="!paused" type="button" class="button-normal util-ml-8px" @click="onPause">一時停止</button>
    <button v-else type="button" class="button-normal util-ml-8px" @click="onPause">受信再開</button>
    <!--<button type="button" class="button-normal util-ml-8px" @click="onPause">{{ paused ? '受信再開' : '一時休止' }}</button>-->
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
