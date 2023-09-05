<script setup>
import { inject, ref, reactive, onMounted, computed, watch } from "vue"
import io from "socket.io-client"
import { useRouter } from "vue-router";
import ChatItem from "./ChatItem.vue";



// #region global state
const currentUser = inject("currentUser")
const chatList = inject("chatList")
const userList = inject("userList")
// #endregion

// #region local variable
const socket = io()
const router = useRouter()
// #endregion

// #region reactive variable
const chatContent = ref("")
// オブジェクト型の配列を持つ
// {"
//   id: Integer（auto increment by sqlite)
//   user: "Mike",
//   content: "hello world",
//   type: "chat / memo / enteredLog / leftLog / DMSend / DMReceive",
//   time: "2023/7/1 22時30分0秒"
// }

const address = ref("")

// falseで昇順
const sortOrder = ref(false);

// ソートボタンが押された時に動作　　sortOrderの値を逆にする
const sortOrderButton = () => {
  sortOrder.value = !sortOrder.value
}

// sortOrderがfalseなら昇順、trueなら降順
const sortedChatList = computed(() => {
  console.log(chatList.value)
  if (sortOrder.value) {
    return chatList.value.slice().reverse();
  } else {
    return chatList.value.slice();
  }
});

//時刻表示を成形するのに使う関数
const takeTime = ()=>{
  let date = new Date()
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}時${date.getMinutes()}分${date.getSeconds()}秒`
}

// addChat内で使う関数
const getFullText = (chat) => {
  try {
    const user = userList.value.find(el => el.rowid === chat.user_id)
    switch (chat.type) {
      case "chat":
        return `${user.name}さん：${chat.content}：${chat.created_at}`
      case "memo":
        if (currentUser.name !== user.name) return undefined
        return `${user.name}さんのメモ：${chat.content}：${chat.created_at}`
      case "enteredLog":
        return `${user.name}さんが入室しました：${chat.created_at}`
      case "leftLog":
        return `${user.name}さんが退出しました：${chat.created_at}`
      case "DMReceive":
        return `${user.name}さんからのDM：${chat.content}：${chat.created_at}`
      case "DMSend":
        return `自分で送ったDM：${chat.content}：${chat.created_at}`
      default:
        return undefined
    }
  } catch (err) {
    console.log(err);
  }
}

const addChat = (userId, content="", type, time) => {
  // type引数が chat / memo / enteredLog / leftLog / DMReceive / DMSend　以外だったら早期リターン
  const hasInvalidType = !["chat", "memo", "enteredLog", "leftLog", "DMReceive", "DMSend"].includes(type)
  if (hasInvalidType) return

  const newChat = {
    user_id: userId,
    content: content,
    type: type,
    time: time,
  }
  socket.on("addChat", newChat)
}

// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPost = () => {
  // 空、空行、スペースのみの場合は送信しない
  if (!chatContent.value.trim()) return;
  const created_at = new Date().toISOString()
  const newChat = {
    user_id: currentUser.rowid,
    content: chatContent.value,
    type: 'chat',
    created_at: created_at,
  }
  socket.emit("postEvent", newChat)

  // 入力欄を初期化
  chatContent.value = ""
  address.value = ""
}

// 投稿削除イベントをサーバーに送信する
const onDelete = (chatId) => {
  // メモの時は、サーバーには送信せず、削除を反映
  // future implement

  socket.emit("deleteEvent", chatId)
}

// 退室者をサーバに送信する
const onExit = () => {
  const created_at = new Date().toISOString()
  const newChat = {
    user_id: currentUser.rowid,
    content: chatContent.value,
    type: 'leftLog',
    created_at: created_at,
  }
  socket.emit("postEvent", newChat)
  socket.removeAllListeners()
}

// メモを画面上に表示する
const onMemo = () => {
  console.log(currentUser.name)
  // 空、空行、スペースのみの場合は送信しない
  if (!chatContent.value.trim()) return;
  const created_at = new Date().toISOString()
  const newChat = {
    user_id: currentUser.rowid,
    content: chatContent.value,
    type: 'memo',
    created_at: created_at,
  }
  socket.emit("memoEvent", newChat)
  // 入力欄を初期化
  chatContent.value = ""
  address.value = ""
}


// 休止フラグ
const paused = ref(false)
// 一時休止にする 休止中はほかの人からの投稿が表示されないようにしたい。
const onPause = () => {
  paused.value = !paused.value
}

// #endregion

// #region socket event handler

// サーバから受信した入室者を受け取りuserListへ追加
const onReceiveEnter = (newUser) => {
  userList.value.push(newUser)
}

// サーバから受信した退室者を受け取り画面上に退室メッセージを表示する
const onReceiveExit = (leftUserName, time) => {
  addChat(leftUserName, "", "leftLog", time)
}

// サーバから受信した投稿メッセージを画面上に表示する

const onReceivePost = (newChat) => {
  // if (!paused.value) {
  //   if(address==""){
  //     addChat(nameValue, contentValue, "chat", time)
  //   } else if(address==userName.value){
  //     addChat(nameValue, contentValue, "DMReceive", time)
  //   } else if(nameValue==userName.value){
  //     addChat(nameValue, contentValue, "DMSend", time)
  //   }
  // } else {
  //   console.log("受信を一時停止しています")
  // }
  chatList.value.push(newChat)
}

const onReceiveMemo = (newChat) => {
  chatList.value.push(newChat)
}

// サーバから受信した投稿メッセージを削除する
const onReceiveDelete = (chatId) => {
  const removeIdx = chatList.value.findIndex(el => el.rowid === chatId)
  chatList.value.splice(removeIdx, 1)
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {

  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (newUser) => {
    onReceiveEnter(newUser)
  })

  // 退室イベントを受け取ったら実行
  // socket.on("exitEvent", (leftUserName, time) => {
  //   onReceiveExit(leftUserName, time)
  // })

  // メモイベントを受け取ったら実行
  socket.on("memoEvent", (newChat) => {
    onReceiveMemo(newChat)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("postEvent", (newChat) => {
    onReceivePost(newChat)
  })

  // 削除イベントを受け取ったら実行
  socket.on("deleteEvent", (chatId) => {
    onReceiveDelete(chatId)
  })
}
// #endregion

// 削除ボタンをつけるか否か
const isDeletable = (chat) => {
  const hasAuth = chat.user_id === currentUser.rowid;
  const isValidType = chat.type === "chat" || chat.type === "memo";
  return hasAuth && isValidType;
};

</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ currentUser.name }}さん</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="chatContent" @keyup.enter="onPost"></textarea>
      <textarea variant="outlined" placeholder="相手のユーザーネームを入力" rows="1" class="area" v-model="address"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPost">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <button type="button" class="button-normal" @click="sortOrderButton">現在: {{ sortOrder ? "降順" : "昇順" }}</button>
        <ul>
          <li class="item mt-4" v-for="chat in sortedChatList" :key="chat.rowid">
            <!-- <p>{{ getFullText(chat) }}</p>
            <button v-if="isDeletable(chat)" @click="onDelete(chat.rowid)" class="button-normal">Delete</button> -->
            <ChatItem :chat="chat" />
          </li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit " @click="onExit">退室する</button>
    </router-link>
    <button type="button" class="button-normal util-ml-8px" @click="onPause">{{ paused ? '受信再開' : '一時休止' }}</button>
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
