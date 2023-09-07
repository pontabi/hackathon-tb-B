import "vuetify/styles"
import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const customTheme = {
  colors: {
    primary: "#3498db",
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "customTheme",
    themes: { customTheme }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})
