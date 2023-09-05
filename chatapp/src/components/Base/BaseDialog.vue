<template>
    <v-card class="dialog-card">
      <v-card-text class="text-center content">
        <slot>{{ content }}</slot>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" block @click="onClick" >
          <slot name="closeBtn">{{ btnText }}</slot>
        </v-btn>
      </v-card-actions>
    </v-card>
    <div class="overlay"></div>
</template>

<script setup>
const props = defineProps(['content', 'btnText', "modelValue"])
const emit = defineEmits(['update:modelValue'])

const onClick = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dialog-card {
  margin: auto;
  width: 500px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 999;
}

.content {
  font-size: 16px;
}

.overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  margin: auto;
  background-color: rgba(50, 50, 50, 0.7);
}
</style>
