import sqlite3 from "sqlite3"
import path from "node:path"
import { log } from "node:console"
import getAvatar from "../helpers/getAvatar"

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
                            password TEXT NOT NULL,
                            room TEXT,
                            avatar_url TEXT NOT NULL,
                            last_login TEXT
                         )`

const CREATE_CHAT_SQL = `CREATE TABLE IF NOT EXISTS chat(
                            user_id INTEGER,
                            content TEXT,
                            type TEXT CHECK(type = 'chat' or type = 'memo' or
                                            type = 'enteredLog' or type = 'leftLog' or
                                            type = 'DMReceive' or type = 'DMSend'
                                            ),
                            to_who TEXT,
                            created_at TEXT,
                            room TEXT
                         )`

const CREATE_ACTIVE_USER_SQL = `CREATE TABLE IF NOT EXISTS active_user(
                          name TEXT,
                          socket_id TEXT UNIQUE NOT NULL
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
            const avatar_url = getAvatar(newUser.email, 100)
            const last_login = new Date().toISOString()
            db.run("INSERT INTO user(name, email, password, room, avatar_url, last_login) VALUES(?, ?, ?, ?, ?, ?)",
                    [newUser.name, newUser.email, newUser.password, newUser.room, avatar_url, last_login],
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
  socket.on("loginEvent", (uniqueValue, password, roomValue) => {
    db.serialize(() => {
      db.run(CREATE_USER_SQL)
        .get("SELECT *, ROWID FROM user WHERE (email = ? OR name = ?) AND password = ?",
         [uniqueValue, uniqueValue, password],
         (err, row) => {
            // user名とpasswordが合っていた場合, emailとpasswordが合っていた場合
            if (row) {
              // ログインしたユーザーのroomとlast_loginを更新
              const last_login = new Date().toISOString()
              db.run("UPDATE user SET room = ?, last_login = ? WHERE ROWID = ?", [roomValue, last_login, row.rowid])

              // ログインしたユーザー情報をloginSuccessEventへ返す
              socket.emit("loginSuccessEvent", row)

              // 全クライアントのuserListを更新
              db.all(GET_ALL_USER_SQL, [], (err, rows) => {
                if (err) throw err
                socket.broadcast.emit("getAllUserEvent", rows)
              })
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

  // activeUserテーブルにユーザーを追加
  socket.on("addActiveUser", (name, socket_id) => {
    // activeUserテーブルにusernameとsocket.idを追加
    db.serialize(() => {
      db.run(CREATE_ACTIVE_USER_SQL)
      db.run("INSERT INTO active_user(name, socket_id) VALUES(?, ?)",
              [name, socket_id])
      // 重複なしでアクティブユーザー取得
      db.all("SELECT DISTINCT name FROM active_user",[], (err, rows) => {
        io.sockets.emit("refreshActiveUser", rows)
      })
    })
  })

  // activeUserテーブルからユーザーを削除
  socket.on("deleteActiveUser", (name) => {
    db.serialize(() => {
      db.run("DELETE FROM active_user WHERE name = ?",
                [name])
      db.all("SELECT name FROM active_user",[], (err, rows) => {
        io.sockets.emit("refreshActiveUser", rows)
      })
    })
  })

  // 接続が切れた時、そのクライアントをactiveUserから削除し、userテーブルのroomをnullにする
  socket.on("disconnect", (reason) => {
    db.serialize(() => {

      db.run("UPDATE user SET room = '' WHERE user.name = (SELECT active_user.name FROM active_user WHERE active_user.socket_id = ?)", [socket.id], (err) => {
        if (err) console.error("Error deleting active user:", err)
      })

      db.run("DELETE FROM active_user WHERE socket_id = ?", [socket.id], (err) => {
        if (err) console.error("Error updating user room:", err)
      })

      db.all("SELECT DISTINCT name FROM active_user", [], (err, rows) => {
          if (err) console.error("Error retrieving active users:", err)
          io.sockets.emit("refreshActiveUser", rows);
      });
    });
  });


  // 新しいチャットをdbに追加し、クライアントへ送信する
  socket.on("postEvent", (newChat) => {
    db.serialize(() => {
      db.run(CREATE_CHAT_SQL)
      db.run("INSERT INTO chat(user_id, content, type, to_who, created_at, room) VALUES(?, ?, ?, ?, ?, ?)",
            [newChat.user_id, newChat.content, newChat.type, newChat.to_who, newChat.created_at, newChat.room],
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

  // ルームを変更した時の処理
  socket.on("roomEvent", (changedRoom, userId) => {
    db.run("UPDATE user SET room = ? WHERE ROWID = ?",
    [changedRoom, userId],
    function(err) {
      if (err) return console.log(err.message)
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

  // 開発用のactiveUserテーブル削除イベント
  socket.on("dropActiveUserTableEvent", () => {
    db.run(`DROP TABLE active_user`)
  })
}
