import gravatar from "gravatar"

const getAvatar = (email, size=100) => {
  // gravatar.url()で使うオプション。s-画像のサイズ, d-デフォルトのURL
  const options = {
    s: size,
    d: "mm"
  }

  const URL = gravatar.url(email, options, true)
  console.log(URL);
  return URL
}

export default getAvatar
