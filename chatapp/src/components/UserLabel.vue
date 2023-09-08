<template>
    <v-avatar color="secondary" size="32px" density="compact" >
      <v-img
        alt="Avatar"
        :src="sender.avatar_url"
      ></v-img>
    </v-avatar>
  <span class="pl-2">{{ sender.name }}</span>
</template>

<script setup>
const props = defineProps(["sender"])
console.log(props.sender);
</script>

<style scoped>

</style>
