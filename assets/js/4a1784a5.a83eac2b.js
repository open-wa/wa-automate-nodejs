"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[1124],{4758:(t,e,o)=>{o.r(e),o.d(e,{assets:()=>i,contentTitle:()=>s,default:()=>l,frontMatter:()=>c,metadata:()=>r,toc:()=>d});var n=o(4848),a=o(8453);const c={title:"Chatwoot integrations",description:"ready made integration for chatwoot."},s=void 0,r={id:"Integrations/chatwoot",title:"Chatwoot integrations",description:"ready made integration for chatwoot.",source:"@site/docs/Integrations/chatwoot.md",sourceDirName:"Integrations",slug:"/Integrations/chatwoot",permalink:"/docs/Integrations/chatwoot",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/Integrations/chatwoot.md",tags:[],version:"current",frontMatter:{title:"Chatwoot integrations",description:"ready made integration for chatwoot."},sidebar:"tutorialSidebar",previous:{title:"Translate your site",permalink:"/docs/tutorial-extras/translate-your-site"},next:{title:"Creating an API",permalink:"/docs/how-to/create-api"}},i={},d=[];function h(t){const e={code:"code",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,a.R)(),...t.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(e.p,{children:"you can directly integrate open-wa/wa-automate directly using the easy-api or docker"}),"\n",(0,n.jsxs)(e.ul,{children:["\n",(0,n.jsxs)(e.li,{children:["\n",(0,n.jsx)(e.p,{children:"before you start you need to have below details from chatwoot"}),"\n",(0,n.jsxs)(e.table,{children:[(0,n.jsx)(e.thead,{children:(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.th,{children:"item"}),(0,n.jsx)(e.th,{children:"description"}),(0,n.jsx)(e.th,{children:"example"})]})}),(0,n.jsxs)(e.tbody,{children:[(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.td,{children:"chatwoot API URL"}),(0,n.jsx)(e.td,{children:"it can be self-hosted or chatwoot hosted"}),(0,n.jsxs)(e.td,{children:["for self-hosted ",(0,n.jsx)(e.code,{children:"http://localhost:3000"}),"  and can be",(0,n.jsx)(e.code,{children:" https://app.chatwoot.com/platform/api/v1"})," for chatwoot hosted"]})]}),(0,n.jsxs)(e.tr,{children:[(0,n.jsx)(e.td,{children:"chatwoot access token"}),(0,n.jsx)(e.td,{children:"you can get it at the end of your chatwoot profile page"}),(0,n.jsxs)(e.td,{children:["for example ",(0,n.jsx)(e.code,{children:"5lUC0KdzAl8iZO5aLsZHdx0i9rRix6qd"})]})]}),(0,n.jsxs)(e.tr,{children:[(0,n.jsxs)(e.td,{children:[(0,n.jsx)(e.code,{children:"optional"})," full chatwoot API URL"]}),(0,n.jsx)(e.td,{children:"if you want to use an existing chatwoot inbox"}),(0,n.jsxs)(e.td,{children:["the URL will look like this ",(0,n.jsx)(e.code,{children:"https://app.chatwoot.com/accounts/[account id]/inboxes/[inbox id]"})]})]})]})]}),"\n"]}),"\n",(0,n.jsxs)(e.li,{children:["\n",(0,n.jsx)(e.p,{children:"if you want easy-api to automatically generate chatwoot inbox and configure it"}),"\n",(0,n.jsx)(e.p,{children:(0,n.jsx)(e.code,{children:'npx @open-wa/wa-automate -p [port number]  -k "your easy-api API Key" --verbose  --force-update-cw-webhook --chatwoot-url "https://app.chatwoot.com/platform/api/v1" --chatwoot-api-access-token "your chatwoot access token"'})}),"\n"]}),"\n",(0,n.jsxs)(e.li,{children:["\n",(0,n.jsx)(e.p,{children:"if you wan't to use and already generated inbox which was created using the above command then you need to provide the full chatwoot API URL which has the account ID and inbox id details."}),"\n",(0,n.jsx)(e.p,{children:(0,n.jsx)(e.code,{children:'npx @open-wa/wa-automate -p [port number]  -k "your easy-api API Key" --verbose  --force-update-cw-webhook --chatwoot-url "https://app.chatwoot.com/accounts/[account id]/inboxes/[inbox id]" --chatwoot-api-access-token "your chatwoot access token"'})}),"\n"]}),"\n"]})]})}function l(t={}){const{wrapper:e}={...(0,a.R)(),...t.components};return e?(0,n.jsx)(e,{...t,children:(0,n.jsx)(h,{...t})}):h(t)}},8453:(t,e,o)=>{o.d(e,{R:()=>s,x:()=>r});var n=o(6540);const a={},c=n.createContext(a);function s(t){const e=n.useContext(c);return n.useMemo((function(){return"function"==typeof t?t(e):{...e,...t}}),[e,t])}function r(t){let e;return e=t.disableParentContext?"function"==typeof t.components?t.components(a):t.components||a:s(t.components),n.createElement(c.Provider,{value:e},t.children)}}}]);