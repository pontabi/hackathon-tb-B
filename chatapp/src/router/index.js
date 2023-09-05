import { createRouter, createWebHistory } from "vue-router"
import Chat from "../components/Chat.vue"
import Login from "../components/Login.vue"
import Signup from "../components/Signup.vue"
import DbUser from "../components/DbUser.vue"
import DbChat from "../components/DbChat.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "login",
      component: Login
    },
    {
      path: "/signup",
      name: "signup",
      component: Signup
    },
    {
      path: "/chat/",
      name: "chat",
      component: Chat,
      beforeEnter: (to, from, next) => {
        if(from.name === "login"){
          next()
        } else {
          next({ name:"login" })
        }
      },
    },
    {
      path: "/db-user/",
      name: "dbuser",
      component: DbUser
    },
    {
      path: "/db-chat/",
      name: "dbchat",
      component:DbChat
    }
  ],
})

export default router
