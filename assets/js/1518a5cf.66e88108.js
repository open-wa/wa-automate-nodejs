"use strict";(self.webpackChunkdocs_v_3=self.webpackChunkdocs_v_3||[]).push([[8342],{3905:(e,t,a)=>{a.d(t,{Zo:()=>d,kt:()=>h});var r=a(7294);function l(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function o(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,r)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?o(Object(a),!0).forEach((function(t){l(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):o(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function n(e,t){if(null==e)return{};var a,r,l=function(e,t){if(null==e)return{};var a,r,l={},o=Object.keys(e);for(r=0;r<o.length;r++)a=o[r],t.indexOf(a)>=0||(l[a]=e[a]);return l}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)a=o[r],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(l[a]=e[a])}return l}var p=r.createContext({}),s=function(e){var t=r.useContext(p),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},d=function(e){var t=s(e.components);return r.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},c=r.forwardRef((function(e,t){var a=e.components,l=e.mdxType,o=e.originalType,p=e.parentName,d=n(e,["components","mdxType","originalType","parentName"]),c=s(a),h=l,k=c["".concat(p,".").concat(h)]||c[h]||u[h]||o;return a?r.createElement(k,i(i({ref:t},d),{},{components:a})):r.createElement(k,i({ref:t},d))}));function h(e,t){var a=arguments,l=t&&t.mdxType;if("string"==typeof e||l){var o=a.length,i=new Array(o);i[0]=c;var n={};for(var p in t)hasOwnProperty.call(t,p)&&(n[p]=t[p]);n.originalType=e,n.mdxType="string"==typeof e?e:l,i[1]=n;for(var s=2;s<o;s++)i[s]=a[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,a)}c.displayName="MDXCreateElement"},8010:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>n,toc:()=>s});var r=a(7462),l=(a(7294),a(3905));const o={id:"api_model",title:"Module: api/model",sidebar_label:"api/model",sidebar_position:0,custom_edit_url:null},i=void 0,n={unversionedId:"api/modules/api_model",id:"api/modules/api_model",title:"Module: api/model",description:"Enumerations",source:"@site/docs/api/modules/api_model.md",sourceDirName:"api/modules",slug:"/api/modules/api_model",permalink:"/docs/api/modules/api_model",draft:!1,editUrl:null,tags:[],version:"current",sidebarPosition:0,frontMatter:{id:"api_model",title:"Module: api/model",sidebar_label:"api/model",sidebar_position:0,custom_edit_url:null},sidebar:"tutorialSidebar",previous:{title:"api/Client",permalink:"/docs/api/modules/api_Client"},next:{title:"api/model/aliases",permalink:"/docs/api/modules/api_model_aliases"}},p={},s=[{value:"Enumerations",id:"enumerations",level:2},{value:"Type Aliases",id:"type-aliases",level:2},{value:"References",id:"references",level:2},{value:"AccountNumber",id:"accountnumber",level:3},{value:"AddParticipantError",id:"addparticipanterror",level:3},{value:"AddParticipantErrorStatusCode",id:"addparticipanterrorstatuscode",level:3},{value:"AdvancedConfig",id:"advancedconfig",level:3},{value:"AdvancedFile",id:"advancedfile",level:3},{value:"Base64",id:"base64",level:3},{value:"BaseChat",id:"basechat",level:3},{value:"BizCategory",id:"bizcategory",level:3},{value:"BizProfileOptions",id:"bizprofileoptions",level:3},{value:"BusinessHours",id:"businesshours",level:3},{value:"BusinessProfile",id:"businessprofile",level:3},{value:"CLOUD_PROVIDERS",id:"cloud_providers",level:3},{value:"Call",id:"call",level:3},{value:"CallState",id:"callstate",level:3},{value:"CartItem",id:"cartitem",level:3},{value:"Chat",id:"chat",level:3},{value:"ChatId",id:"chatid",level:3},{value:"ChatMuteDuration",id:"chatmuteduration",level:3},{value:"ChatServer",id:"chatserver",level:3},{value:"ChatState",id:"chatstate",level:3},{value:"ChatTypes",id:"chattypes",level:3},{value:"ConfigObject",id:"configobject",level:3},{value:"Contact",id:"contact",level:3},{value:"ContactId",id:"contactid",level:3},{value:"Content",id:"content",level:3},{value:"CountryCode",id:"countrycode",level:3},{value:"CustomError",id:"customerror",level:3},{value:"CustomProduct",id:"customproduct",level:3},{value:"DIRECTORY_STRATEGY",id:"directory_strategy",level:3},{value:"DataURL",id:"dataurl",level:3},{value:"DevTools",id:"devtools",level:3},{value:"ERROR_NAME",id:"error_name",level:3},{value:"EphemeralDuration",id:"ephemeralduration",level:3},{value:"EventPayload",id:"eventpayload",level:3},{value:"FilePath",id:"filepath",level:3},{value:"GetURL",id:"geturl",level:3},{value:"GroupChat",id:"groupchat",level:3},{value:"GroupChatCreationParticipantAddResponse",id:"groupchatcreationparticipantaddresponse",level:3},{value:"GroupChatCreationResponse",id:"groupchatcreationresponse",level:3},{value:"GroupChatId",id:"groupchatid",level:3},{value:"GroupChatServer",id:"groupchatserver",level:3},{value:"GroupId",id:"groupid",level:3},{value:"Label",id:"label",level:3},{value:"LicenseType",id:"licensetype",level:3},{value:"LiveLocationChangedEvent",id:"livelocationchangedevent",level:3},{value:"Message",id:"message",level:3},{value:"MessageAck",id:"messageack",level:3},{value:"MessageId",id:"messageid",level:3},{value:"MessageInfo",id:"messageinfo",level:3},{value:"MessageInfoInteraction",id:"messageinfointeraction",level:3},{value:"MessageTypes",id:"messagetypes",level:3},{value:"Mp4StickerConversionProcessOptions",id:"mp4stickerconversionprocessoptions",level:3},{value:"NonSerializedId",id:"nonserializedid",level:3},{value:"NotificationLanguage",id:"notificationlanguage",level:3},{value:"NumberCheck",id:"numbercheck",level:3},{value:"OnError",id:"onerror",level:3},{value:"Order",id:"order",level:3},{value:"PageEvaluationTimeout",id:"pageevaluationtimeout",level:3},{value:"PollData",id:"polldata",level:3},{value:"PollOption",id:"polloption",level:3},{value:"PollVote",id:"pollvote",level:3},{value:"Product",id:"product",level:3},{value:"ProxyServerCredentials",id:"proxyservercredentials",level:3},{value:"QRFormat",id:"qrformat",level:3},{value:"QRQuality",id:"qrquality",level:3},{value:"QuoteMap",id:"quotemap",level:3},{value:"Reaction",id:"reaction",level:3},{value:"ReactionEvent",id:"reactionevent",level:3},{value:"ReactionRecord",id:"reactionrecord",level:3},{value:"ReactionSender",id:"reactionsender",level:3},{value:"SessionData",id:"sessiondata",level:3},{value:"SessionExpiredError",id:"sessionexpirederror",level:3},{value:"SimpleListener",id:"simplelistener",level:3},{value:"SingleChat",id:"singlechat",level:3},{value:"StickerMetadata",id:"stickermetadata",level:3},{value:"WaServers",id:"waservers",level:3},{value:"Webhook",id:"webhook",level:3},{value:"defaultProcessOptions",id:"defaultprocessoptions",level:3}],d={toc:s};function u(e){let{components:t,...a}=e;return(0,l.kt)("wrapper",(0,r.Z)({},d,a,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("h2",{id:"enumerations"},"Enumerations"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("a",{parentName:"li",href:"/docs/api/enums/api_model.Events"},"Events")),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("a",{parentName:"li",href:"/docs/api/enums/api_model.STATE"},"STATE")),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("a",{parentName:"li",href:"/docs/api/enums/api_model.Status"},"Status"))),(0,l.kt)("h2",{id:"type-aliases"},"Type Aliases"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("a",{parentName:"li",href:"/docs/api/types/api_model.EasyApiResponse"},"EasyApiResponse"))),(0,l.kt)("h2",{id:"references"},"References"),(0,l.kt)("h3",{id:"accountnumber"},"AccountNumber"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.AccountNumber"},"AccountNumber")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"addparticipanterror"},"AddParticipantError"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/classes/api_model_errors.AddParticipantError"},"AddParticipantError")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"addparticipanterrorstatuscode"},"AddParticipantErrorStatusCode"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_errors.AddParticipantErrorStatusCode"},"AddParticipantErrorStatusCode")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"advancedconfig"},"AdvancedConfig"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_config.AdvancedConfig"},"AdvancedConfig")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"advancedfile"},"AdvancedFile"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.AdvancedFile"},"AdvancedFile")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"base64"},"Base64"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.Base64"},"Base64")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"basechat"},"BaseChat"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_chat.BaseChat"},"BaseChat")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"bizcategory"},"BizCategory"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_contact.BizCategory"},"BizCategory")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"bizprofileoptions"},"BizProfileOptions"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_contact.BizProfileOptions"},"BizProfileOptions")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"businesshours"},"BusinessHours"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_contact.BusinessHours"},"BusinessHours")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"businessprofile"},"BusinessProfile"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_contact.BusinessProfile"},"BusinessProfile")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"cloud_providers"},"CLOUD","_","PROVIDERS"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.CLOUD_PROVIDERS"},"CLOUD_PROVIDERS")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"call"},"Call"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_call.Call"},"Call")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"callstate"},"CallState"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_call.CallState"},"CallState")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"cartitem"},"CartItem"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_product.CartItem"},"CartItem")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"chat"},"Chat"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_chat.Chat"},"Chat")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"chatid"},"ChatId"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.ChatId"},"ChatId")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"chatmuteduration"},"ChatMuteDuration"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_chat.ChatMuteDuration"},"ChatMuteDuration")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"chatserver"},"ChatServer"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.ChatServer"},"ChatServer")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"chatstate"},"ChatState"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_chat.ChatState"},"ChatState")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"chattypes"},"ChatTypes"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_chat.ChatTypes"},"ChatTypes")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"configobject"},"ConfigObject"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_config.ConfigObject"},"ConfigObject")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"contact"},"Contact"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_contact.Contact"},"Contact")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"contactid"},"ContactId"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.ContactId"},"ContactId")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"content"},"Content"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.Content"},"Content")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"countrycode"},"CountryCode"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.CountryCode"},"CountryCode")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"customerror"},"CustomError"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/classes/api_model_errors.CustomError"},"CustomError")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"customproduct"},"CustomProduct"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_product.CustomProduct"},"CustomProduct")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"directory_strategy"},"DIRECTORY","_","STRATEGY"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.DIRECTORY_STRATEGY"},"DIRECTORY_STRATEGY")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"dataurl"},"DataURL"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.DataURL"},"DataURL")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"devtools"},"DevTools"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_config.DevTools"},"DevTools")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"error_name"},"ERROR","_","NAME"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_errors.ERROR_NAME"},"ERROR_NAME")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"ephemeralduration"},"EphemeralDuration"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_chat.EphemeralDuration"},"EphemeralDuration")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"eventpayload"},"EventPayload"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_config.EventPayload"},"EventPayload")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"filepath"},"FilePath"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.FilePath"},"FilePath")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"geturl"},"GetURL"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.GetURL"},"GetURL")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"groupchat"},"GroupChat"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_chat.GroupChat"},"GroupChat")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"groupchatcreationparticipantaddresponse"},"GroupChatCreationParticipantAddResponse"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_chat.GroupChatCreationParticipantAddResponse"},"GroupChatCreationParticipantAddResponse")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"groupchatcreationresponse"},"GroupChatCreationResponse"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_chat.GroupChatCreationResponse"},"GroupChatCreationResponse")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"groupchatid"},"GroupChatId"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.GroupChatId"},"GroupChatId")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"groupchatserver"},"GroupChatServer"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.GroupChatServer"},"GroupChatServer")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"groupid"},"GroupId"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.GroupId"},"GroupId")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"label"},"Label"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_label.Label"},"Label")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"licensetype"},"LicenseType"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.LicenseType"},"LicenseType")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"livelocationchangedevent"},"LiveLocationChangedEvent"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_chat.LiveLocationChangedEvent"},"LiveLocationChangedEvent")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"message"},"Message"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.Message"},"Message")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"messageack"},"MessageAck"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_message.MessageAck"},"MessageAck")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"messageid"},"MessageId"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.MessageId"},"MessageId")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"messageinfo"},"MessageInfo"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.MessageInfo"},"MessageInfo")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"messageinfointeraction"},"MessageInfoInteraction"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.MessageInfoInteraction"},"MessageInfoInteraction")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"messagetypes"},"MessageTypes"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_message.MessageTypes"},"MessageTypes")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"mp4stickerconversionprocessoptions"},"Mp4StickerConversionProcessOptions"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_media.Mp4StickerConversionProcessOptions"},"Mp4StickerConversionProcessOptions")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"nonserializedid"},"NonSerializedId"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.NonSerializedId"},"NonSerializedId")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"notificationlanguage"},"NotificationLanguage"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.NotificationLanguage"},"NotificationLanguage")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"numbercheck"},"NumberCheck"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_contact.NumberCheck"},"NumberCheck")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"onerror"},"OnError"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.OnError"},"OnError")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"order"},"Order"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_product.Order"},"Order")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"pageevaluationtimeout"},"PageEvaluationTimeout"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/classes/api_model_errors.PageEvaluationTimeout"},"PageEvaluationTimeout")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"polldata"},"PollData"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.PollData"},"PollData")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"polloption"},"PollOption"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.PollOption"},"PollOption")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"pollvote"},"PollVote"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.PollVote"},"PollVote")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"product"},"Product"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_product.Product"},"Product")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"proxyservercredentials"},"ProxyServerCredentials"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_config.ProxyServerCredentials"},"ProxyServerCredentials")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"qrformat"},"QRFormat"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.QRFormat"},"QRFormat")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"qrquality"},"QRQuality"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_config.QRQuality"},"QRQuality")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"quotemap"},"QuoteMap"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.QuoteMap"},"QuoteMap")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"reaction"},"Reaction"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_reactions.Reaction"},"Reaction")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"reactionevent"},"ReactionEvent"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_reactions.ReactionEvent"},"ReactionEvent")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"reactionrecord"},"ReactionRecord"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_reactions.ReactionRecord"},"ReactionRecord")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"reactionsender"},"ReactionSender"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_message.ReactionSender"},"ReactionSender")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"sessiondata"},"SessionData"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_config.SessionData"},"SessionData")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"sessionexpirederror"},"SessionExpiredError"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/classes/api_model_errors.SessionExpiredError"},"SessionExpiredError")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"simplelistener"},"SimpleListener"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/enums/api_model_events.SimpleListener"},"SimpleListener")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"singlechat"},"SingleChat"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_chat.SingleChat"},"SingleChat")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"stickermetadata"},"StickerMetadata"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_media.StickerMetadata"},"StickerMetadata")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"waservers"},"WaServers"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.WaServers"},"WaServers")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"webhook"},"Webhook"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/interfaces/api_model_config.Webhook"},"Webhook")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"defaultprocessoptions"},"defaultProcessOptions"),(0,l.kt)("p",null,"Re-exports ",(0,l.kt)("a",{parentName:"p",href:"/docs/api/variables/api_model_media.defaultProcessOptions"},"defaultProcessOptions")))}u.isMDXComponent=!0}}]);