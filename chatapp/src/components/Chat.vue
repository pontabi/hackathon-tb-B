<script setup>
import { inject, ref, reactive, onMounted, computed, watch } from "vue"
import io from "socket.io-client"
import { useRouter } from "vue-router";
import ChatItem from "./ChatItem.vue";
import ActiveUserSection from "./ActiveUserSection.vue";



// #region global state
const currentUser = inject("currentUser")
const chatList = inject("chatList")
const userList = inject("userList")
const activeUserList = inject("activeUserList")
const chatRooms = inject("chatRooms")
// #endregion

// #region local variable
const socket = io()
const router = useRouter()
// #endregion

// #region reactive variable
const chatContent = ref("")
const address = ref("")

// falseで昇順
const sortOrder = ref(false)
// プロフィールダイアログの表示フラグ
const showProfileDialog = ref(false)

// ソートボタンが押された時に動作　　sortOrderの値を逆にする
const sortOrderButton = () => {
  sortOrder.value = !sortOrder.value
}

// sortOrderがfalseなら昇順、trueなら降順
const sortedChatList = computed(() => {
  if (sortOrder.value) {
    return chatList.value.slice().reverse();
  } else {
    return chatList.value.slice();
  }
});

// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

const sendMessage = (type) => {
  // 空、空行、スペースのみの場合は送信しない
  if (!chatContent.value.trim()) return;
  const created_at = new Date().toISOString()
  const newChat = {
    user_id: currentUser.rowid,
    content: chatContent.value,
    type: type,
    to_who: address.value,
    created_at: created_at,
    room: currentUser.room
  }
  socket.emit("postEvent", newChat)
  // 入力欄を初期化
  chatContent.value = ""
  address.value = ""
}

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPost = (e) => {
  // レイアウト固定のため、現在は未稼働
  // Enter + Shiftで改行しつつ、続けて編集できるようにしたい
  // if ( e.key == "Enter" && e.shiftKey ) return
  sendMessage('chat')
}

// メモを画面上に表示する
const onMemo = (e) => {
  // レイアウト固定のため、現在は未稼働
  // Enter + Shiftで改行しつつ、続けて編集できるようにしたい
  // if ( e.key == "Enter" && e.shiftKey ) return
  sendMessage('memo')
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
    room: currentUser.room
  }
  socket.emit("postEvent", newChat)
  socket.emit("deleteActiveUser", currentUser.name)
  socket.emit("roomEvent", '', currentUser.rowid)
  socket.removeAllListeners()
  router.push({ name: "login" })
}


const onChange = (changeRoom) => {
  currentUser.room = changeRoom
  socket.emit("roomEvent", currentUser.room, currentUser.rowid)
}

// 休止フラグ
//const paused = ref(false)
// 一時休止にする 休止中はほかの人からの投稿が表示されないようにしたい。
//const onPause = () => {
//  paused.value = !paused.value
//}

// #endregion

// #region socket event handler

// サーバから受信した入室者を受け取りuserListへ追加
const onReceiveEnter = (newUser) => {
  userList.value.push(newUser)
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePost = (newChat) => {
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

  // activeUserListを更新する処理
  socket.on("refreshActiveUser", (users) => {
    // users = [{name: String}, {}...]
    activeUserList.value = users
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
  <v-app>
    <v-app-bar
      class="px-3"
      color="primary"
      flat
    >
      <v-toolbar-title>Vue.js Chat チャットルーム</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
          type="button"
          class="button-normal"
          icon="mdi-account"
          @click="showProfileDialog = true"
          ></v-btn>
      <!--TODO: いい感じのところに名前を表示する-->
      <p class="m-0 mr-2">{{ currentUser.name }}</p>
    </v-app-bar>

    <!-- プロフィールダイアログ -->
    <v-dialog v-model="showProfileDialog" width="auto" class="dialog-right-top">
      <v-card class="p-3">
        <v-card-title>Profile</v-card-title>
        <v-card-text>
          <div>
            <strong>UserName:</strong> {{ currentUser.name }}
          </div>
          <div>
            <strong>E-mail:</strong> {{ currentUser.email }}
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn @click="showProfileDialog = false">閉じる</v-btn><!-- ダイアログを閉じるボタン -->
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer>
      <v-list>
        <v-list-subheader>ROOMS</v-list-subheader>
        <v-list-item
          v-for="(room, index) in chatRooms"
          :key="room"
          :title="room"
          @click="onChange(room)"
        ></v-list-item>
        <!--
        <v-badge dot color="success" v-if="room === currentUser.room">
          <template v-slot:badge>
            <v-icon>mdi-check-circle</v-icon>
          </template>
        </v-badge>
      -->
      </v-list>
      <div class="text-center">
        <router-link to="/" class="link">
          <v-btn
            type="button"
            class="button-normal button-exit"
            @click="onExit"
          >退室する</v-btn>
        </router-link>
      </div>
    </v-navigation-drawer>

    <v-navigation-drawer location="right">
      <ActiveUserSection></ActiveUserSection>
      <div>
        <v-text-field
          variant="solo-filled"
          class="w-75 mx-auto"
          label="DM"
          placeholder="相手のユーザーネームを入力"
          width=""
          v-model="address"
        ></v-text-field>
      </div>
    </v-navigation-drawer>


    <v-main class="ma-4">
      <v-app-bar
      elevation="1"
      density="compact"
      flat
      >
      <v-toolbar-title class="text-body-1">{{ currentUser.room }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="mx-4" v-if="chatList.length !== 0">
        <v-btn
          v-if="sortOrder"
          type="button"
          class="button-normal"
          @click="sortOrderButton"
          icon="mdi-sort-calendar-descending"
          ></v-btn>
          <v-btn
          v-else
          type="button"
          class="button-normal"
          @click="sortOrderButton"
          icon="mdi-sort-calendar-ascending"
          ></v-btn>
      </div>
      </v-app-bar>
      <ul class="p-0">
        <li class="item mt-4" v-for="chat in sortedChatList" :key="chat.rowid">
          <!-- <p>{{ getFullText(chat) }}</p>
            <button v-if="isDeletable(chat)" @click="onDelete(chat.rowid)" class="button-normal">Delete</button> -->
          <ChatItem :chat="chat" />
        </li>
      </ul>

      <v-footer app elevation="4">
        <v-text-field
          variant="solo-filled"
          placeholder="メッセージを送信"
          class="overflow-hidden"
          density="compact"
          flat
          hide-details
          rounded="pill"
          v-model="chatContent"
          @keyup.enter="onPost"
        ></v-text-field>

        <div class="ml-2">
          <v-btn class="button-normal mr-3" @click="onPost" icon="mdi-send-variant" color="primary"></v-btn>
          <v-btn class="button-normal" @click="onMemo" icon="mdi-note" color="primary"></v-btn>
        </div>
      </v-footer>
    </v-main>
  </v-app>
</template>

<style scoped>
.link {
  text-decoration: none;
}

.item {
  display: block;
  white-space: pre-line;
}

</style>
