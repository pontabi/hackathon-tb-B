export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (leftUserName) => {
    socket.broadcast.emit("exitEvent", leftUserName)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (nameValue, contentValue) => {
    io.sockets.emit("publishEvent", nameValue, contentValue)
  })

  // 削除する投稿オブジェクトを送信する
  socket.on("deleteEvent", (chatObj) => {
    io.sockets.emit("deleteEvent", chatObj)
  })
}
