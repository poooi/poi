export interface GameRequestPayload<Body> {
  method: string
  path: string
  body: Body
  time: number
}

export interface GameResponsePayload<Body, PostBody> {
  method: string
  path: string
  body: Body
  postBody: PostBody
  time: number
}
