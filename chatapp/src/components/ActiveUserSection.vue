<template>
  <v-list>
    <v-list-subheader>ONLINE USERS</v-list-subheader>
    <v-list-item
      v-for="user in activeUserList"
      :key="user.name"
    >
      <div class="d-flex">
        <v-badge dot color="success" offset-y="1">
          <v-avatar color="secondary" size="32px" density="compact" >
            <v-img
              alt="Avatar"
              :src="getUserByName(user.name).avatar_url"
            ></v-img>
          </v-avatar>
        </v-badge>
        <p class="pl-2 m-0 name">{{ user.name }}</p>
      </div>
    </v-list-item>
  </v-list>

  <v-list>
    <v-list-subheader>OFFLINE USERS</v-list-subheader>
    <v-list-item
      v-for="user in inActiveUserList"
      :key="user.name"
    >
    <div class="d-flex">

        <v-badge dot color="grey-darken-1" offset-y="1">
          <v-avatar color="secondary" size="32px" density="compact" >
            <v-img
              alt="Avatar"
              :src="getUserByName(user.name).avatar_url"
            ></v-img>
          </v-avatar>
        </v-badge>
        <div>
          <p class="pl-2 m-0 name">
            {{ user.name }}
          </p>

          <p class="pl-2 m-0 last-login">
            {{ fLastLogin(getUserByName(user.name).last_login) }}
          </p>
        </div>

      </div>
    </v-list-item>
  </v-list>
</template>

<script setup>
import { computed, inject } from 'vue';


// #region global state
const activeUserList = inject("activeUserList")
const userList = inject("userList")
// #endregion


// #region reactive variable
// 非アクティブユーザーリスト
const inActiveUserList = computed(() => {
  const inActiveUsers = []
  userList.value.forEach(user => {
    const isActive = activeUserList.value.some(activeUser => activeUser.name === user.name)
    if (isActive) return
    inActiveUsers.push({name: user.name})
  })
  return inActiveUsers
})
// #endregion


// userListからnameで探索
const getUserByName = (name) => {
  const user = userList.value.find(el => el.name === name)
  return user
}

// 最終ログインのフォーマット
const fLastLogin = (date) => {
  const formattedDate = new Date(date)
  const month = formattedDate.getMonth() + 1; // Add 1 because months are zero-indexed
  const day = formattedDate.getDate();
  const hour = formattedDate.getHours();
  const minute = formattedDate.getMinutes();

  // Format the date and time without a comma
  return `最終ログイン: ${month}/${day} ${hour}:${minute.toString().padStart(2, '0')}`;

}



</script>

<style scoped>
.name {
  transform: translate(0, 4px);
}
.last-login {

  font-size: .8rem;
  color: #999;
}
</style>
