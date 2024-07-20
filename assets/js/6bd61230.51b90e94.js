"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[5293],{2483:(e,s,r)=>{r.r(s),r.d(s,{assets:()=>i,contentTitle:()=>t,default:()=>h,frontMatter:()=>c,metadata:()=>a,toc:()=>l});var n=r(4848),o=r(8453);const c={},t="Type Alias: MessagePreProcessor()",a={id:"reference/structures/preProcessors/type-aliases/MessagePreProcessor",title:"Type Alias: MessagePreProcessor()",description:"MessagePreProcessor: (message, client?, alreadyProcessed?, source?) => Promise\\",source:"@site/docs/reference/structures/preProcessors/type-aliases/MessagePreProcessor.md",sourceDirName:"reference/structures/preProcessors/type-aliases",slug:"/reference/structures/preProcessors/type-aliases/MessagePreProcessor",permalink:"/docs/reference/structures/preProcessors/type-aliases/MessagePreProcessor",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/reference/structures/preProcessors/type-aliases/MessagePreProcessor.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Type Alias: MPConfigType",permalink:"/docs/reference/structures/preProcessors/type-aliases/MPConfigType"},next:{title:"Variable: MessagePreprocessors",permalink:"/docs/reference/structures/preProcessors/variables/MessagePreprocessors"}},i={},l=[{value:"Parameters",id:"parameters",level:2},{value:"Returns",id:"returns",level:2}];function d(e){const s={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",p:"p",strong:"strong",...(0,o.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.h1,{id:"type-alias-messagepreprocessor",children:"Type Alias: MessagePreProcessor()"}),"\n",(0,n.jsxs)(s.blockquote,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"MessagePreProcessor"}),": (",(0,n.jsx)(s.code,{children:"message"}),", ",(0,n.jsx)(s.code,{children:"client"}),"?, ",(0,n.jsx)(s.code,{children:"alreadyProcessed"}),"?, ",(0,n.jsx)(s.code,{children:"source"}),"?) => ",(0,n.jsx)(s.code,{children:"Promise"}),"<",(0,n.jsx)(s.a,{href:"/docs/reference/api/model/message/interfaces/Message",children:(0,n.jsx)(s.code,{children:"Message"})}),">"]}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"A function that takes a message and returns a message."}),"\n",(0,n.jsx)(s.h2,{id:"parameters",children:"Parameters"}),"\n",(0,n.jsxs)(s.p,{children:["\u2022 ",(0,n.jsx)(s.strong,{children:"message"}),": ",(0,n.jsx)(s.a,{href:"/docs/reference/api/model/message/interfaces/Message",children:(0,n.jsx)(s.code,{children:"Message"})})]}),"\n",(0,n.jsx)(s.p,{children:"The message to be processed"}),"\n",(0,n.jsxs)(s.p,{children:["\u2022 ",(0,n.jsx)(s.strong,{children:"client?"}),": ",(0,n.jsx)(s.a,{href:"/docs/reference/api/Client/classes/Client",children:(0,n.jsx)(s.code,{children:"Client"})})]}),"\n",(0,n.jsx)(s.p,{children:"The client that received the message"}),"\n",(0,n.jsxs)(s.p,{children:["\u2022 ",(0,n.jsx)(s.strong,{children:"alreadyProcessed?"}),": ",(0,n.jsx)(s.code,{children:"boolean"})]}),"\n",(0,n.jsx)(s.p,{children:"Whether the message has already been processed by another preprocessor. (This is useful in cases where you want to mutate the message for both onMessage and onAnyMessage events but only want to do the actual process, like uploading to s3, once.)"}),"\n",(0,n.jsxs)(s.p,{children:["\u2022 ",(0,n.jsx)(s.strong,{children:"source?"}),": ",(0,n.jsx)(s.code,{children:'"onMessage"'})," | ",(0,n.jsx)(s.code,{children:'"onAnyMessage"'})]}),"\n",(0,n.jsx)(s.p,{children:"The source of the message. This is useful for knowing if the message is from onMessage or onAnyMessage. Only processing one source will prevent duplicate processing."}),"\n",(0,n.jsx)(s.h2,{id:"returns",children:"Returns"}),"\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{children:"Promise"}),"<",(0,n.jsx)(s.a,{href:"/docs/reference/api/model/message/interfaces/Message",children:(0,n.jsx)(s.code,{children:"Message"})}),">"]})]})}function h(e={}){const{wrapper:s}={...(0,o.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},8453:(e,s,r)=>{r.d(s,{R:()=>t,x:()=>a});var n=r(6540);const o={},c=n.createContext(o);function t(e){const s=n.useContext(c);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function a(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:t(e.components),n.createElement(c.Provider,{value:s},e.children)}}}]);