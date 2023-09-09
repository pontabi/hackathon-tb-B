<template>
  <v-list>
    <v-list-subheader>ONLINE USERS</v-list-subheader>
    <v-list-item
      v-for="user in activeUserList"
      :key="user.name"
    >
      <v-badge dot color="success" offset-y="1">
        <v-avatar color="secondary" size="32px" density="compact" >
          <v-img
            alt="Avatar"
            :src="getUserByName(user.name).avatar_url"
          ></v-img>
        </v-avatar>
      </v-badge>
      <span class="pl-2">{{ user.name }}</span>
    </v-list-item>
  </v-list>

  <v-list>
    <v-list-subheader>OFFLINE USERS</v-list-subheader>
    <v-list-item
      v-for="user in inActiveUserList"
      :key="user.name"
    >
      <v-badge dot color="grey" offset-y="1">
        <v-avatar color="secondary" size="32px" density="compact" >
          <v-img
            alt="Avatar"
            :src="getUserByName(user.name).avatar_url"
          ></v-img>
        </v-avatar>
      </v-badge>
      <span class="pl-2">{{ user.name }}</span>
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



</script>

<style lang="scss" scoped>

</style>
