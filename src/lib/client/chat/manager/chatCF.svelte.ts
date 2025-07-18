import { goto } from '$app/navigation';
import { createDebug } from '$lib/utils/debug';
import { Chat } from '@ai-sdk/svelte';
import {
  AbstractChat,
  DefaultChatTransport,
  type ChatInit,
  // type ChatState,
  // type ChatStatus,
  type CreateUIMessage,
  type UIMessage,
} from 'ai';

export type { CreateUIMessage, UIMessage };

const d = createDebug('chat_cf')


export class ChatCF<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends Chat<UI_MESSAGE> {

  public isNewChat: boolean = false;
  public inputText: string = $state<string>('');
  public title: string = 'New Chat';



  constructor(chatId?: string) {
    let init: ChatInit<UI_MESSAGE> = {
      transport: new DefaultChatTransport({
        api: "http://localhost:3000/api/chat",
        headers: { 'Custom-Header': 'value' },
      })
    }

    if (chatId) {
      init.id = chatId;
    }


    super({
      ...init,
    });

    this.isNewChat = !chatId;

  }

  handleSubmit(): void {
    d.log('handleSubmit', this.inputText);
    let message = {
      text: "what is the meaning of life?"//this.inputText
    };
    d.log('Creating message', message);

    if (this.isNewChat) {
      // go to new chat page
      this.isNewChat = false;
      goto(`/chat/${this.id}`)
    }
    this.sendMessage({ text: "this is a test message" })
    d.log("chatCF after sending message", $state.snapshot(this));
    d.log('Message sent');

  }

  destroy(): void {
    d.log('ChatSession destroyed')
  }
}
