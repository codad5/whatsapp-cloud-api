import isURL from 'validator/lib/isURL';
import PubSub from 'pubsub-js';
import { ICreateBot } from './createBot.types';
import {
  ContactMessage, InteractiveMessage, LocationMessage,
  MediaBase, MediaMessage, TemplateMessage,
  TextMessage,
  MarkAsRead,
} from './messages.types';
import { getAxiosClient, sendRequestHelper } from './sendRequestHelper';
import { getExpressRoute } from './startExpressServer';

interface PaylodBase {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
}

const payloadBase: PaylodBase = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
};

export const createBot: ICreateBot = (fromPhoneNumberId, accessToken, opts) => {
  const axiosClient = getAxiosClient(fromPhoneNumberId, accessToken, opts?.version);
  const sendRequest = sendRequestHelper(axiosClient);

  const getMediaPayload = (urlOrObjectId: string, options?: MediaBase) => ({
    ...(isURL(urlOrObjectId) ? { link: urlOrObjectId } : { id: urlOrObjectId }),
    caption: options?.caption,
    filename: options?.filename,
  });

  return {
    getExpressRoute: (options) => getExpressRoute(options),
    on: (event, cb) => {
      const token = PubSub.subscribe(`bot-${fromPhoneNumberId}-${event}`, (_, data) => cb(data));
      return token;
    },
    unsubscribe: (token) => PubSub.unsubscribe(token),

    sendText: (to, text, options) => sendRequest<TextMessage>({
      ...payloadBase,
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: options?.preview_url,
      },
    }),
    sendMessage(to, text, options) {
      return this.sendText(to, text, options);
    },
    sendImage: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'image',
      image: getMediaPayload(urlOrObjectId, options),
    }),
    sendDocument: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'document',
      document: getMediaPayload(urlOrObjectId, options),
    }),
    sendAudio: (to, urlOrObjectId) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'audio',
      audio: getMediaPayload(urlOrObjectId),
    }),
    sendVideo: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'video',
      video: getMediaPayload(urlOrObjectId, options),
    }),
    sendSticker: (to, urlOrObjectId) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'sticker',
      sticker: getMediaPayload(urlOrObjectId),
    }),
    sendLocation: (to, latitude, longitude, options) => sendRequest<LocationMessage>({
      ...payloadBase,
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name: options?.name,
        address: options?.address,
      },
    }),
    sendTemplate: (to, name, languageCode, components) => sendRequest<TemplateMessage>({
      ...payloadBase,
      to,
      type: 'template',
      template: {
        name,
        language: {
          code: languageCode,
        },
        components,
      },
    }),
    sendContacts: (to, contacts) => sendRequest<ContactMessage>({
      ...payloadBase,
      to,
      type: 'contacts',
      contacts,
    }),
    sendReplyButtons: (to, bodyText, buttons, options) => sendRequest<InteractiveMessage>({
      ...payloadBase,
      to,
      type: 'interactive',
      interactive: {
        body: {
          text: bodyText,
        },
        ...(options?.footerText
          ? {
            footer: { text: options?.footerText },
          }
          : {}
        ),
        header: options?.header,
        type: 'button',
        action: {
          buttons: Object.entries(buttons).map(([key, value]) => ({
            type: 'reply',
            reply: {
              title: value,
              id: key,
            },
          })),
        },
      },
    }),
    sendList: (to, buttonName, bodyText, sections, options) => sendRequest<InteractiveMessage>({
      ...payloadBase,
      to,
      type: 'interactive',
      interactive: {
        body: {
          text: bodyText,
        },
        ...(options?.footerText
          ? {
            footer: { text: options?.footerText },
          }
          : {}
        ),
        header: options?.header,
        type: 'list',
        action: {
          button: buttonName,
          sections: Object.entries(sections).map(([key, value]) => ({
            title: key,
            rows: value,
          })),
        },
      },
    }),
    sendCTAUrl: (to, bodyText, display_text, url, options) => sendRequest<InteractiveMessage>({
      ...payloadBase,
      to,
      type: 'interactive',
      interactive: {
        body: {
          text: bodyText,
        },
        ...(options?.footerText
          ? {
            footer: { text: options?.footerText },
          }
          : {}
        ),
        header: options?.header,
        type: 'cta_url',
        action: {
          name: 'cta_url',
          parameters: {
            display_text,
            url,
          },
        },
      },
    }),
    markAsRead: (message_id, status, typing_indicator) => sendRequest<MarkAsRead>({
      ...payloadBase,
      status,
      message_id,
      typing_indicator,
    }),
  };
};
