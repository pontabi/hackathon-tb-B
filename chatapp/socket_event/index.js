import sqlite3 from "sqlite3"
import path from "node:path"

//////////////////////////
// データベースに接続
const db = new sqlite3.Database(path.join(process.cwd(), "/resources/test.db"), (err) => {
  if (err) return console.error(err.message)
  console.log('Connected to the SQLite db')
})

//////////////////////////
// クエリ
const CREATE_USER_SQL = `CREATE TABLE IF NOT EXISTS user(
                            name TEXT NOT NULL,
                            email TEXT UNIQUE
                         )`
const CREATE_CHAT_SQL = `CREATE TABLE IF NOT EXISTS chat(
                            user_id INTEGER,
                            content TEXT,
                            type TEXT CHECK(type = 'chat' or type = 'memo' or
                                            type = 'enteredLog' or type = 'leftLog' or
                                            type = 'DMReceive' or type = 'DMSend'
                                            ),
                            created_at TEXT
                         )`

const GET_ALL_CHAT_SQL = `SELECT *, ROWID FROM chat ORDER BY created_at`
const GET_ALL_USER_SQL = `SELECT *, ROWID FROM user`

//////////////////////////
// socketイベント処理
export default (io, socket) => {
  // 入室処理
  socket.on("enterEvent", (name, email) => {
    db.serialize(() => {
      db.run(CREATE_USER_SQL)
      db.run("INSERT INTO user(name, email) VALUES(?, ?)", name, email)
      db.get("SELECT *, ROWID FROM user WHERE email = ?", [email], (err, row) => {
        // ログインしたユーザー情報をenterEventへ返す
      io.sockets.emit("enterEvent", row)
      })
    })
  })

  // 全てのチャットを送信する
  socket.on("getAllChatEvent", () => {
    db.serialize(() => {
      db.run(CREATE_CHAT_SQL)
      db.all(GET_ALL_CHAT_SQL, [], (err, rows) => {
        if (err) throw err
        io.sockets.emit("getAllChatEvent", rows)
      })
    })
  })

  // 全てのユーザーを送信する
  socket.on("getAllUserEvent", () => {
    db.run(CREATE_USER_SQL)
    db.all(GET_ALL_USER_SQL, [], (err, rows) => {
      if (err) throw err
      io.sockets.emit("getAllUserEvent", rows)
    })
  })

  // 退室メッセージをクライアントに送信する
  // socket.on("exitEvent", (leftUserName, time) => {
  //   socket.broadcast.emit("exitEvent", leftUserName, time)
  // })

  // 新しいチャットをdbに追加し、クライアントへ送信する
  socket.on("postEvent", (newChat) => {
    db.run("INSERT INTO chat(user_id, content, type, created_at ) VALUES(?, ?, ?, ?)",
           [newChat.user_id, newChat.content, newChat.type, newChat.created_at],
           function(err) {
              if (err) return console.log(err.message)
              newChat.rowid = this.lastID
              io.sockets.emit("postEvent", newChat)
           })

  })

  // 削除する投稿オブジェクトを送信する
  socket.on("deleteEvent", (chatObj) => {
    io.sockets.emit("deleteEvent", chatObj)
  })

  // 開発用のuserテーブル削除イベント
  socket.on("dropUserTableEvent", () => {
    db.run(`DROP TABLE user`)
  })

  // 開発用のchatテーブル削除イベント
  socket.on("dropChatTableEvent", () => {
    db.run(`DROP TABLE chat`)
  })
}
