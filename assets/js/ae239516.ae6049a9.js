"use strict";(self.webpackChunkdocs_v_3=self.webpackChunkdocs_v_3||[]).push([[5180],{3905:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>u});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var p=a.createContext({}),s=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},d=function(e){var t=s(e.components);return a.createElement(p.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,p=e.parentName,d=o(e,["components","mdxType","originalType","parentName"]),m=s(n),u=r,k=m["".concat(p,".").concat(u)]||m[u]||c[u]||i;return n?a.createElement(k,l(l({ref:t},d),{},{components:n})):a.createElement(k,l({ref:t},d))}));function u(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,l=new Array(i);l[0]=m;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o.mdxType="string"==typeof e?e:r,l[1]=o;for(var s=2;s<i;s++)l[s]=n[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},2655:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>l,default:()=>c,frontMatter:()=>i,metadata:()=>o,toc:()=>s});var a=n(7462),r=(n(7294),n(3905));const i={id:"api_model_message.ReactionSender",title:"Interface: ReactionSender",sidebar_label:"ReactionSender",custom_edit_url:null},l=void 0,o={unversionedId:"api/interfaces/api_model_message.ReactionSender",id:"api/interfaces/api_model_message.ReactionSender",title:"Interface: ReactionSender",description:"api/model/message.ReactionSender",source:"@site/docs/api/interfaces/api_model_message.ReactionSender.md",sourceDirName:"api/interfaces",slug:"/api/interfaces/api_model_message.ReactionSender",permalink:"/docs/api/interfaces/api_model_message.ReactionSender",draft:!1,editUrl:null,tags:[],version:"current",frontMatter:{id:"api_model_message.ReactionSender",title:"Interface: ReactionSender",sidebar_label:"ReactionSender",custom_edit_url:null},sidebar:"tutorialSidebar",previous:{title:"QuoteMap",permalink:"/docs/api/interfaces/api_model_message.QuoteMap"},next:{title:"CartItem",permalink:"/docs/api/interfaces/api_model_product.CartItem"}},p={},s=[{value:"Properties",id:"properties",level:2},{value:"ack",id:"ack",level:3},{value:"id",id:"id",level:3},{value:"isSendFailure",id:"issendfailure",level:3},{value:"msgKey",id:"msgkey",level:3},{value:"orphan",id:"orphan",level:3},{value:"parentMsgKey",id:"parentmsgkey",level:3},{value:"reactionText",id:"reactiontext",level:3},{value:"read",id:"read",level:3},{value:"senderUserJid",id:"senderuserjid",level:3},{value:"t",id:"t",level:3},{value:"timestamp",id:"timestamp",level:3}],d={toc:s};function c(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"/docs/api/modules/api_model_message"},"api/model/message"),".ReactionSender"),(0,r.kt)("h2",{id:"properties"},"Properties"),(0,r.kt)("h3",{id:"ack"},"ack"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"ack"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"id"},"id"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"id"),": ",(0,r.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.MessageId"},(0,r.kt)("inlineCode",{parentName:"a"},"MessageId"))),(0,r.kt)("p",null,"The message ID of the reaction itself"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"issendfailure"},"isSendFailure"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"isSendFailure"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"msgkey"},"msgKey"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"msgKey"),": ",(0,r.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.MessageId"},(0,r.kt)("inlineCode",{parentName:"a"},"MessageId"))),(0,r.kt)("p",null,"The message ID of the reaction itself"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"orphan"},"orphan"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"orphan"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"parentmsgkey"},"parentMsgKey"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"parentMsgKey"),": ",(0,r.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.MessageId"},(0,r.kt)("inlineCode",{parentName:"a"},"MessageId"))),(0,r.kt)("p",null,"The ID of the message being reacted to"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"reactiontext"},"reactionText"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"reactionText"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"string")),(0,r.kt)("p",null,"The text of the reaction"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"read"},"read"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"read"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"If the reaction was seen/read"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"senderuserjid"},"senderUserJid"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"senderUserJid"),": ",(0,r.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.ContactId"},(0,r.kt)("inlineCode",{parentName:"a"},"ContactId"))),(0,r.kt)("p",null,"The contact ID of the sender of the reaction"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"t"},"t"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"t"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"The timestamp of the reaction"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"timestamp"},"timestamp"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"timestamp"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"The timestamp of the reaction"))}c.isMDXComponent=!0}}]);