export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (leftUserName, time) => {
    socket.broadcast.emit("exitEvent", leftUserName, time)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (nameValue, contentValue, time) => {
    io.sockets.emit("publishEvent", nameValue, contentValue, time)
  })

  // 削除する投稿オブジェクトを送信する
  socket.on("deleteEvent", (chatObj) => {
    io.sockets.emit("deleteEvent", chatObj)
  })
}
