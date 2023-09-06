import sqlite3 from "sqlite3"
import path from "node:path"
import { log } from "node:console"

//////////////////////////
// データベースに接続
const db = new sqlite3.Database(path.join(process.cwd(), "/resources/test.db"), (err) => {
  if (err) return console.error(err.message)
  console.log('Connected to the SQLite db')
})

//////////////////////////
// クエリ
const CREATE_USER_SQL = `CREATE TABLE IF NOT EXISTS user(
                            name TEXT UNIQUE,
                            email TEXT UNIQUE,
                            password TEXT NOT NULL
                         )`

const CREATE_CHAT_SQL = `CREATE TABLE IF NOT EXISTS chat(
                            user_id INTEGER,
                            content TEXT,
                            type TEXT CHECK(type = 'chat' or type = 'memo' or
                                            type = 'enteredLog' or type = 'leftLog' or
                                            type = 'DMReceive' or type = 'DMSend'
                                            ),
                            to_who TEXT,
                            created_at TEXT
                         )`

const GET_ALL_CHAT_SQL = `SELECT *, ROWID FROM chat ORDER BY created_at`
const GET_ALL_USER_SQL = `SELECT *, ROWID FROM user`

//////////////////////////
// socketイベント処理
export default (io, socket) => {
  // signup処理
  socket.on("signupEvent", (newUser) => {
    db.serialize(() => {
      db.run(CREATE_USER_SQL)
        .get(`SELECT * FROM user WHERE name = ? OR email = ?`, [newUser.name, newUser.email], (err, row) => {
          // 既にユーザが登録されていた場合
          if (row) {
            socket.emit("signupFailedEvent", row)
          // 新規ユーザーだった場合
          } else {
            db.run("INSERT INTO user(name, email, password) VALUES(?, ?, ?)",
                    [newUser.name, newUser.email, newUser.password],
                    function(err) {
                        if (err) return console.log(err.message)
                        newUser.rowid = this.lastID
                        socket.emit("signupSuccessEvent", newUser)
                    })
          }
        })
    })
  })
  // login処理
  socket.on("loginEvent", (uniqueValue, password) => {
    db.serialize(() => {
      db.run(CREATE_USER_SQL)
        .get("SELECT *, ROWID FROM user WHERE (email = ? OR name = ?) AND password = ?",
         [uniqueValue, uniqueValue, password],
         (err, row) => {
            // user名とpasswordが合っていた場合, emailとpasswordが合っていた場合
            if (row) {
              // ログインしたユーザー情報をloginEventへ返す
              socket.emit("loginSuccessEvent", row)
              // ログインしたユーザー情報を他のクライアントにも送信
              socket.broadcast.emit("enterEvent", row)
            } else {
              socket.emit("loginFailedEvent")
            }
          })
    })
  })

  // 全てのチャットを送信する
  socket.on("getAllChatEvent", () => {
    db.serialize(() => {
      db.run(CREATE_CHAT_SQL)
      db.all(GET_ALL_CHAT_SQL, [], (err, rows) => {
        if (err) throw err
        socket.emit("getAllChatEvent", rows)
      })
    })
  })

  // 全てのユーザーを送信する
  socket.on("getAllUserEvent", () => {
    db.serialize(() => {
      db.run(CREATE_USER_SQL)
      db.all(GET_ALL_USER_SQL, [], (err, rows) => {
        if (err) throw err
        socket.emit("getAllUserEvent", rows)
      })
    })
  })

  // 退室メッセージをクライアントに送信する
  // socket.on("exitEvent", (newChat) => {})

  // 新しいチャットをdbに追加し、クライアントへ送信する
  socket.on("postEvent", (newChat) => {
    db.serialize(() => {
      db.run(CREATE_CHAT_SQL)
      db.run("INSERT INTO chat(user_id, content, type, to_who, created_at ) VALUES(?, ?, ?, ?, ?)",
            [newChat.user_id, newChat.content, newChat.type, newChat.to_who, newChat.created_at],
            function(err) {
                if (err) return console.log(err.message)
                newChat.rowid = this.lastID
                io.sockets.emit("postEvent", newChat)
            })
    })
  })


  socket.on("memoEvent", (newChat) => {
    db.run("INSERT INTO chat(user_id, content, type, created_at ) VALUES(?, ?, ?, ?)",
           [newChat.user_id, newChat.content, newChat.type, newChat.created_at],
           function(err) {
              if (err) return console.log(err.message)
              newChat.rowid = this.lastID
              io.sockets.emit("memoEvent", newChat)
           })
  })

  // 削除する投稿オブジェクトを送信する
  socket.on("deleteEvent", (chatId) => {
    db.run("DELETE FROM chat WHERE rowid = (?)", [chatId], (err) => {
      if(err) {
        console.log(err);
      }else {
        console.log(`Successfuly deleted row${chatId}`);
      }
    })
    io.sockets.emit("deleteEvent", chatId)
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
