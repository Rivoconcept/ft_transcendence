import {type Message} from "."
import "./message.css"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn}: MessageBubbleProps) {
  return (
    <div>
      {/* <div className={isOwn ? "justify-end" : "justify-start"}> */}
        <div className={isOwn ? "bubble-me" : "bubble-them"}>
         <p>{message.text}</p>
          <small>{message.time}</small>
        </div>
      {/* </div> */}
    </div>
  )
}

interface

export default function({}): 